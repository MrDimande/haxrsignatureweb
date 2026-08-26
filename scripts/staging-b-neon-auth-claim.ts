import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchNeonSession, reconcileVerifiedNeonIdentity } from "@/lib/neon/auth-session";
import { getSetCookieHeaders } from "@/lib/neon/auth-proxy";
import { closeNeonPoolForTests, neonQuery } from "@/lib/neon/server-db";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const BRANCH_ORIGIN =
  "https://haxrsignatureweb-git-migration-ce8d3d-alberto-dimandes-projects.vercel.app";
const EMAIL = "staging-b@haxrsignature.test";
const OLD_USER_ID = "4a80dc5a-6a0c-43ab-b6a6-772559e60751";

type CountRow = { count: string };
type UserRow = { id: string; emailVerified: boolean };
type ClaimRow = { status: string; new_user_id: string | null };

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
  );
}

function readAuthUrlFromVercelConfig(): string {
  const config = JSON.parse(
    readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
  ) as { env?: { NEON_AUTH_BASE_URL?: string } };
  const value = config.env?.NEON_AUTH_BASE_URL?.trim();
  if (!value || !value.startsWith("https://")) {
    throw new Error("neon_auth_url_missing");
  }
  return value;
}

async function authCall(
  authUrl: string,
  path: string,
  body: Record<string, unknown>,
  cookieHeader?: string,
): Promise<Response> {
  return fetch(`${authUrl.replace(/\/$/, "")}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BRANCH_ORIGIN,
      "x-neon-auth-middleware": "true",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    redirect: "manual",
  });
}

function cookieHeaderFromResponse(response: Response): string {
  return getSetCookieHeaders(response.headers)
    .map((cookie) => cookie.split(";", 1)[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function count(sql: string, params: readonly unknown[] = []): Promise<number> {
  const result = await neonQuery<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function runClaim(): Promise<void> {
  if (!isMigrationPreview()) {
    console.info("[staging-b-neon-claim] skipped outside migration Preview");
    return;
  }
  if (!process.env.DATABASE_URL?.trim()) throw new Error("database_url_missing");

  const authUrl = readAuthUrlFromVercelConfig();
  process.env.NEON_AUTH_BASE_URL = authUrl;
  process.env.HAXR_AUTH_PROVIDER = "neon";

  const password = `Haxr!${randomBytes(24).toString("base64url")}`;
  let neonUserId: string | null = null;
  let cookieHeader = "";
  let claimed = false;

  try {
    const preflight = await neonQuery<ClaimRow>(
      `SELECT status, new_user_id
       FROM app_private.legacy_auth_identity
       WHERE old_user_id=$1::uuid`,
      [OLD_USER_ID],
    );
    const preflightRow = preflight.rows[0];
    if (!preflightRow || preflightRow.status !== "pending" || preflightRow.new_user_id) {
      throw new Error("staging_b_not_pending");
    }

    const oldProfile = await count(
      `SELECT count(*)::text AS count
       FROM public.profiles
       WHERE id=$1::uuid AND full_name='Staging B'`,
      [OLD_USER_ID],
    );
    const oldRefs =
      (await count(`SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`, [OLD_USER_ID])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`, [OLD_USER_ID])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`, [OLD_USER_ID]));
    const existingNeon = await count(
      `SELECT count(*)::text AS count FROM neon_auth."user" WHERE lower(email)=lower($1::text)`,
      [EMAIL],
    );
    if (oldProfile !== 1 || oldRefs !== 0 || existingNeon !== 0) {
      throw new Error("staging_b_preflight_failed");
    }

    const signUp = await authCall(authUrl, "sign-up/email", {
      email: EMAIL,
      password,
      name: "Staging B",
    });
    if (!signUp.ok) throw new Error(`sign_up_http_${signUp.status}`);

    const userLookup = await neonQuery<UserRow>(
      `SELECT id, "emailVerified" AS "emailVerified"
       FROM neon_auth."user"
       WHERE lower(email)=lower($1::text)
       LIMIT 1`,
      [EMAIL],
    );
    neonUserId = userLookup.rows[0]?.id ?? null;
    if (!neonUserId) throw new Error("neon_user_missing_after_signup");

    await neonQuery(
      `UPDATE neon_auth."user"
       SET "emailVerified"=true, "updatedAt"=now()
       WHERE id=$1::uuid`,
      [neonUserId],
    );

    const signIn = await authCall(authUrl, "sign-in/email", { email: EMAIL, password });
    if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
    cookieHeader = cookieHeaderFromResponse(signIn);
    if (!cookieHeader) throw new Error("session_cookie_missing");

    const session = await fetchNeonSession(cookieHeader);
    if (!session || session.user.id !== neonUserId || !session.user.emailVerified) {
      throw new Error("session_contract_failed");
    }

    const profile = await reconcileVerifiedNeonIdentity(session.user);
    if (!profile || profile.id !== neonUserId || profile.full_name !== "Staging B") {
      throw new Error("identity_reconciliation_failed");
    }
    claimed = true;

    const claimResult = await neonQuery<ClaimRow>(
      `SELECT status, new_user_id
       FROM app_private.legacy_auth_identity
       WHERE old_user_id=$1::uuid`,
      [OLD_USER_ID],
    );
    const claimRow = claimResult.rows[0];

    const newProfile = await count(
      `SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid AND full_name='Staging B'`,
      [neonUserId],
    );
    const oldProfileLeft = await count(
      `SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid`,
      [OLD_USER_ID],
    );
    const newRefs =
      (await count(`SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`, [neonUserId])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`, [neonUserId])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`, [neonUserId]));
    const oldRefsAfter =
      (await count(`SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`, [OLD_USER_ID])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`, [OLD_USER_ID])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`, [OLD_USER_ID]));
    const credentialAccounts = await count(
      `SELECT count(*)::text AS count FROM neon_auth.account WHERE "userId"=$1::uuid AND "providerId"='credential'`,
      [neonUserId],
    );

    if (
      claimRow?.status !== "claimed" ||
      claimRow.new_user_id !== neonUserId ||
      newProfile !== 1 ||
      oldProfileLeft !== 0 ||
      newRefs !== 0 ||
      oldRefsAfter !== 0 ||
      credentialAccounts !== 1
    ) {
      throw new Error("staging_b_claim_validation_failed");
    }

    const signOut = await authCall(authUrl, "sign-out", {}, cookieHeader);
    if (!signOut.ok) throw new Error(`sign_out_http_${signOut.status}`);
    cookieHeader = "";

    const sessionsAfterSignOut = await count(
      `SELECT count(*)::text AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
      [neonUserId],
    );
    if (sessionsAfterSignOut !== 0) throw new Error("session_cleanup_failed");

    console.info(
      "[staging-b-neon-claim]",
      JSON.stringify({
        signUp: true,
        verified: true,
        signIn: true,
        session: true,
        reconciliation: true,
        claimed: true,
        profileMoved: true,
        oldProfileLeft,
        oldReferences: oldRefsAfter,
        newReferences: newRefs,
        credentialAccount: true,
        signOut: true,
        sessionsAfterSignOut,
      }),
    );
  } catch (cause) {
    if (cookieHeader) {
      await authCall(authUrl, "sign-out", {}, cookieHeader).catch(() => null);
    }

    if (!claimed && neonUserId) {
      const claimState = await neonQuery<ClaimRow>(
        `SELECT status, new_user_id FROM app_private.legacy_auth_identity WHERE old_user_id=$1::uuid`,
        [OLD_USER_ID],
      ).catch(() => ({ rows: [] as ClaimRow[] }));
      const row = claimState.rows[0];
      if (row?.status === "pending" && !row.new_user_id) {
        await neonQuery(`DELETE FROM neon_auth."user" WHERE id=$1::uuid`, [neonUserId]).catch(
          () => null,
        );
      }
    }

    throw cause;
  } finally {
    await closeNeonPoolForTests().catch(() => undefined);
  }
}

runClaim().catch((cause) => {
  console.error(
    "[staging-b-neon-claim] failed",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
