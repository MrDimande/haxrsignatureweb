import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildLegacyEmailSha256,
  fetchNeonSession,
  reconcileVerifiedNeonIdentity,
} from "@/lib/neon/auth-session";
import { getSetCookieHeaders } from "@/lib/neon/auth-proxy";
import { closeNeonPoolForTests, neonQuery } from "@/lib/neon/server-db";
import { createClientEventReadAuthClient } from "@/lib/auth/client-event-server-clients";
import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const BRANCH_ORIGIN =
  "https://haxrsignatureweb-git-migration-ce8d3d-alberto-dimandes-projects.vercel.app";

type CountRow = { count: string };
type UserRow = { id: string };
type ClaimRow = { status: string; new_user_id: string | null };

type AuthCallResult = {
  response: Response;
  payload: unknown;
};

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
    throw new Error("neon_auth_url_missing_from_vercel_config");
  }
  return value;
}

async function authCall(
  authUrl: string,
  path: string,
  body: Record<string, unknown>,
  cookieHeader?: string,
): Promise<AuthCallResult> {
  const response = await fetch(`${authUrl.replace(/\/$/, "")}/${path}`, {
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

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.clone().json().catch(() => null)
    : null;

  return { response, payload };
}

function cookieHeaderFromResponse(response: Response): string {
  return getSetCookieHeaders(response.headers)
    .map((cookie) => cookie.split(";", 1)[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function count(sql: string, params: readonly unknown[]): Promise<number> {
  const result = await neonQuery<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function runCanary(): Promise<void> {
  if (!isMigrationPreview()) {
    console.info("[neon-auth-app-canary] skipped outside migration Preview");
    return;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("database_url_missing");
  }

  const authUrl = readAuthUrlFromVercelConfig();
  process.env.NEON_AUTH_BASE_URL = authUrl;
  process.env.HAXR_AUTH_PROVIDER = "neon";

  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `neon-app-canary-${suffix}@haxr.invalid`;
  const password = `Haxr!${randomBytes(24).toString("base64url")}`;
  const oldUserId = randomUUID();
  const eventId = randomUUID();
  const outsiderId = randomUUID();
  const fingerprint = `neon-app-canary-${suffix}`;
  const emailSha256 = buildLegacyEmailSha256(email);
  let neonUserId: string | null = null;
  let cookieHeader = "";
  let primaryError: unknown = null;

  try {
    await neonQuery(
      `INSERT INTO public.profiles (id, full_name) VALUES ($1::uuid, $2::text)`,
      [oldUserId, "HAXR Auth App Canary"],
    );

    await neonQuery(
      `
        INSERT INTO public.client_events (
          id,
          owner_user_id,
          slug,
          event_name,
          bride_name,
          groom_name,
          onboarding_fingerprint
        )
        VALUES ($1::uuid, $2::uuid, $3::text, $4::text, $5::text, $6::text, $7::text)
      `,
      [
        eventId,
        oldUserId,
        `neon-app-canary-${suffix}`,
        "HAXR Neon Auth Canary",
        "Canary",
        "Synthetic",
        fingerprint,
      ],
    );

    await neonQuery(
      `UPDATE public.profiles SET active_client_event_id=$1::uuid WHERE id=$2::uuid`,
      [eventId, oldUserId],
    );

    await neonQuery(
      `INSERT INTO public.event_members (client_event_id, user_id, role) VALUES ($1::uuid, $2::uuid, 'owner')`,
      [eventId, oldUserId],
    );

    await neonQuery(
      `
        INSERT INTO public.event_onboarding_snapshots (
          client_event_id,
          owner_user_id,
          local_fingerprint,
          payload,
          synced_from
        )
        VALUES ($1::uuid, $2::uuid, $3::text, $4::jsonb, 'api')
      `,
      [eventId, oldUserId, fingerprint, JSON.stringify({ canary: true })],
    );

    await neonQuery(
      `INSERT INTO app_private.legacy_auth_identity (old_user_id, email_sha256) VALUES ($1::uuid, $2::text)`,
      [oldUserId, emailSha256],
    );

    const signUp = await authCall(authUrl, "sign-up/email", {
      email,
      password,
      name: "HAXR Neon Auth Canary",
    });
    if (!signUp.response.ok) {
      throw new Error(`sign_up_http_${signUp.response.status}`);
    }

    const userLookup = await neonQuery<UserRow>(
      `SELECT id FROM neon_auth."user" WHERE lower(email)=lower($1::text) LIMIT 1`,
      [email],
    );
    neonUserId = userLookup.rows[0]?.id ?? null;
    if (!neonUserId) throw new Error("neon_user_missing_after_signup");

    const credentialAccounts = await count(
      `SELECT count(*)::text AS count FROM neon_auth.account WHERE "userId"=$1::uuid`,
      [neonUserId],
    );
    if (credentialAccounts < 1) throw new Error("credential_account_missing");

    await neonQuery(
      `UPDATE neon_auth."user" SET "emailVerified"=true, "updatedAt"=now() WHERE id=$1::uuid`,
      [neonUserId],
    );

    const signIn = await authCall(authUrl, "sign-in/email", { email, password });
    if (!signIn.response.ok) {
      throw new Error(`sign_in_http_${signIn.response.status}`);
    }

    cookieHeader = cookieHeaderFromResponse(signIn.response);
    if (!cookieHeader) throw new Error("session_cookie_missing");

    const session = await fetchNeonSession(cookieHeader);
    if (!session || session.user.id !== neonUserId || !session.user.emailVerified) {
      throw new Error("fetch_neon_session_contract_failed");
    }

    const profile = await reconcileVerifiedNeonIdentity(session.user);
    if (!profile || profile.id !== neonUserId || profile.active_client_event_id !== eventId) {
      throw new Error("identity_reconciliation_contract_failed");
    }

    const authClient =
      await createClientEventReadAuthClient<ClientEventDashboardAuthClient>();
    if (!authClient) throw new Error("client_event_auth_client_unavailable");

    const ownerAccess = await resolveClientEventDashboardAccess(
      authClient,
      neonUserId,
      eventId,
    );
    const outsiderAccess = await resolveClientEventDashboardAccess(
      authClient,
      outsiderId,
      eventId,
    );

    const claim = await neonQuery<ClaimRow>(
      `SELECT status, new_user_id FROM app_private.legacy_auth_identity WHERE old_user_id=$1::uuid`,
      [oldUserId],
    );
    const claimRow = claim.rows[0];

    const movedProfile = await count(
      `SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid AND active_client_event_id=$2::uuid`,
      [neonUserId, eventId],
    );
    const movedOwner = await count(
      `SELECT count(*)::text AS count FROM public.client_events WHERE id=$1::uuid AND owner_user_id=$2::uuid`,
      [eventId, neonUserId],
    );
    const movedMembership = await count(
      `SELECT count(*)::text AS count FROM public.event_members WHERE client_event_id=$1::uuid AND user_id=$2::uuid`,
      [eventId, neonUserId],
    );
    const movedSnapshot = await count(
      `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE client_event_id=$1::uuid AND owner_user_id=$2::uuid`,
      [eventId, neonUserId],
    );
    const oldReferences =
      (await count(`SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid`, [oldUserId])) +
      (await count(`SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`, [oldUserId])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`, [oldUserId])) +
      (await count(`SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`, [oldUserId]));

    const passed =
      claimRow?.status === "claimed" &&
      claimRow.new_user_id === neonUserId &&
      movedProfile === 1 &&
      movedOwner === 1 &&
      movedMembership === 1 &&
      movedSnapshot === 1 &&
      oldReferences === 0 &&
      ownerAccess.kind === "ok" &&
      outsiderAccess.kind === "forbidden";

    if (!passed) throw new Error("full_app_acl_canary_failed");

    const signOut = await authCall(authUrl, "sign-out", {}, cookieHeader);
    if (!signOut.response.ok) {
      throw new Error(`sign_out_http_${signOut.response.status}`);
    }
    cookieHeader = "";

    const sessionsAfterSignOut = await count(
      `SELECT count(*)::text AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
      [neonUserId],
    );
    if (sessionsAfterSignOut !== 0) {
      throw new Error("session_cleanup_after_signout_failed");
    }

    console.info(
      "[neon-auth-app-canary]",
      JSON.stringify({
        signUp: true,
        credentialAccount: true,
        signIn: true,
        fetchNeonSession: true,
        verifiedSession: true,
        claim: true,
        profileMoved: true,
        ownerMoved: true,
        membershipMoved: true,
        snapshotMoved: true,
        oldReferences,
        ownerAcl: ownerAccess.kind,
        outsiderAcl: outsiderAccess.kind,
        signOut: true,
        sessionsAfterSignOut,
      }),
    );
  } catch (cause) {
    primaryError = cause;
  } finally {
    if (cookieHeader) {
      await authCall(authUrl, "sign-out", {}, cookieHeader).catch(() => null);
    }

    await neonQuery(
      `UPDATE public.profiles SET active_client_event_id=NULL WHERE id IN ($1::uuid, $2::uuid)`,
      [oldUserId, neonUserId ?? oldUserId],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM public.event_onboarding_snapshots WHERE client_event_id=$1::uuid`,
      [eventId],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM public.event_members WHERE client_event_id=$1::uuid`,
      [eventId],
    ).catch(() => null);
    await neonQuery(`DELETE FROM public.client_events WHERE id=$1::uuid`, [eventId]).catch(
      () => null,
    );
    await neonQuery(
      `DELETE FROM app_private.legacy_auth_identity WHERE old_user_id=$1::uuid OR email_sha256=$2::text`,
      [oldUserId, emailSha256],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM public.profiles WHERE id IN ($1::uuid, $2::uuid)`,
      [oldUserId, neonUserId ?? oldUserId],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM neon_auth.verification WHERE identifier=$1::text OR identifier LIKE '%' || $1::text || '%'`,
      [email],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM neon_auth."user" WHERE lower(email)=lower($1::text)`,
      [email],
    ).catch(() => null);

    const cleanup = {
      users: await count(
        `SELECT count(*)::text AS count FROM neon_auth."user" WHERE lower(email)=lower($1::text)`,
        [email],
      ).catch(() => -1),
      legacyMaps: await count(
        `SELECT count(*)::text AS count FROM app_private.legacy_auth_identity WHERE old_user_id=$1::uuid OR email_sha256=$2::text`,
        [oldUserId, emailSha256],
      ).catch(() => -1),
      profiles: await count(
        `SELECT count(*)::text AS count FROM public.profiles WHERE id IN ($1::uuid, $2::uuid)`,
        [oldUserId, neonUserId ?? oldUserId],
      ).catch(() => -1),
      events: await count(
        `SELECT count(*)::text AS count FROM public.client_events WHERE id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
      memberships: await count(
        `SELECT count(*)::text AS count FROM public.event_members WHERE client_event_id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
      snapshots: await count(
        `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE client_event_id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
    };

    console.info("[neon-auth-app-canary-cleanup]", JSON.stringify(cleanup));

    const cleanupPassed = Object.values(cleanup).every((value) => value === 0);
    await closeNeonPoolForTests().catch(() => undefined);

    if (primaryError) throw primaryError;
    if (!cleanupPassed) throw new Error("canary_cleanup_failed");
  }
}

runCanary().catch((cause) => {
  console.error(
    "[neon-auth-app-canary] failed",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
