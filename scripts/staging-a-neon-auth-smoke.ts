import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchNeonSession, reconcileVerifiedNeonIdentity } from "@/lib/neon/auth-session";
import { getSetCookieHeaders } from "@/lib/neon/auth-proxy";
import { closeNeonPoolForTests, neonQuery } from "@/lib/neon/server-db";
import { createClientEventReadAuthClient } from "@/lib/auth/client-event-server-clients";
import {
  getClientEventDashboardData,
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const BRANCH_ORIGIN =
  "https://haxrsignatureweb-git-migration-ce8d3d-alberto-dimandes-projects.vercel.app";
const STAGING_A_EMAIL = "staging-a@haxrsignature.test";
const STAGING_A_USER_ID = "b5d48e9b-7523-4b3f-956c-7a97352c8082";
const EXPECTED_EVENTS = 5;
const EXPECTED_MEMBERSHIPS = 5;
const EXPECTED_SNAPSHOTS = 3;

type AuthCallResult = { response: Response; payload: unknown };
type CredentialRow = {
  id: string;
  password: string | null;
  updatedAt: string;
};
type TempUserRow = { id: string };
type TempPasswordRow = { password: string | null };
type ProfileRow = {
  id: string;
  active_client_event_id: string | null;
  full_name: string | null;
  app_role: "client" | "planner" | "admin";
};
type EventRow = { id: string };
type CountRow = { count: string };

type LegacyMapRow = {
  status: string;
  new_user_id: string | null;
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

async function runSmoke(): Promise<void> {
  if (!isMigrationPreview()) {
    console.info("[staging-a-neon-auth-smoke] skipped outside migration Preview");
    return;
  }
  if (!process.env.DATABASE_URL?.trim()) throw new Error("database_url_missing");

  const authUrl = readAuthUrlFromVercelConfig();
  process.env.NEON_AUTH_BASE_URL = authUrl;
  process.env.HAXR_AUTH_PROVIDER = "neon";

  const tempEmail = `staging-a-smoke-${Date.now()}-${randomBytes(4).toString("hex")}@haxr.invalid`;
  const tempPassword = `Haxr!${randomBytes(24).toString("base64url")}`;
  let tempUserId: string | null = null;
  let cookieHeader = "";
  let originalCredential: CredentialRow | null = null;
  let primaryError: unknown = null;

  try {
    const profileResult = await neonQuery<ProfileRow>(
      `SELECT id, active_client_event_id, full_name, app_role
       FROM public.profiles
       WHERE id=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    const profileBefore = profileResult.rows[0];
    if (!profileBefore || !profileBefore.active_client_event_id) {
      throw new Error("staging_a_profile_or_active_event_missing");
    }

    const verifiedUser = await count(
      `SELECT count(*)::text AS count FROM neon_auth."user"
       WHERE id=$1::uuid AND lower(email)=lower($2::text) AND "emailVerified"=true`,
      [STAGING_A_USER_ID, STAGING_A_EMAIL],
    );
    if (verifiedUser !== 1) throw new Error("staging_a_verified_neon_user_missing");

    const legacyMap = await neonQuery<LegacyMapRow>(
      `SELECT status, new_user_id
       FROM app_private.legacy_auth_identity
       WHERE new_user_id=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    if (
      legacyMap.rows[0]?.status !== "claimed" ||
      legacyMap.rows[0]?.new_user_id !== STAGING_A_USER_ID
    ) {
      throw new Error("staging_a_legacy_claim_not_finalized");
    }

    const credential = await neonQuery<CredentialRow>(
      `SELECT id, password, "updatedAt"::text AS "updatedAt"
       FROM neon_auth.account
       WHERE "userId"=$1::uuid AND "providerId"='credential'
       LIMIT 1`,
      [STAGING_A_USER_ID],
    );
    originalCredential = credential.rows[0] ?? null;
    if (!originalCredential?.password) throw new Error("staging_a_credential_missing");

    const sessionsBefore = await count(
      `SELECT count(*)::text AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    if (sessionsBefore !== 0) throw new Error("staging_a_expected_zero_sessions_before_smoke");

    const signUp = await authCall(authUrl, "sign-up/email", {
      email: tempEmail,
      password: tempPassword,
      name: "HAXR Staging A Smoke Hash Source",
    });
    if (!signUp.response.ok) throw new Error(`temp_sign_up_http_${signUp.response.status}`);

    const tempUser = await neonQuery<TempUserRow>(
      `SELECT id FROM neon_auth."user" WHERE lower(email)=lower($1::text) LIMIT 1`,
      [tempEmail],
    );
    tempUserId = tempUser.rows[0]?.id ?? null;
    if (!tempUserId) throw new Error("temp_neon_user_missing");

    const tempHash = await neonQuery<TempPasswordRow>(
      `SELECT password FROM neon_auth.account
       WHERE "userId"=$1::uuid AND "providerId"='credential'
       LIMIT 1`,
      [tempUserId],
    );
    const generatedHash = tempHash.rows[0]?.password ?? null;
    if (!generatedHash) throw new Error("temp_credential_hash_missing");

    await neonQuery(
      `UPDATE neon_auth.account
       SET password=$2::text, "updatedAt"=now()
       WHERE id=$1::uuid`,
      [originalCredential.id, generatedHash],
    );

    const signIn = await authCall(authUrl, "sign-in/email", {
      email: STAGING_A_EMAIL,
      password: tempPassword,
    });
    if (!signIn.response.ok) throw new Error(`staging_a_sign_in_http_${signIn.response.status}`);

    cookieHeader = cookieHeaderFromResponse(signIn.response);
    if (!cookieHeader) throw new Error("staging_a_session_cookie_missing");

    const session = await fetchNeonSession(cookieHeader);
    if (
      !session ||
      session.user.id !== STAGING_A_USER_ID ||
      !session.user.emailVerified ||
      session.user.email.toLowerCase() !== STAGING_A_EMAIL
    ) {
      throw new Error("staging_a_session_contract_failed");
    }

    const reconciled = await reconcileVerifiedNeonIdentity(session.user);
    if (
      !reconciled ||
      reconciled.id !== STAGING_A_USER_ID ||
      reconciled.active_client_event_id !== profileBefore.active_client_event_id
    ) {
      throw new Error("staging_a_reconciliation_contract_failed");
    }

    const eventIdsResult = await neonQuery<EventRow>(
      `SELECT id FROM public.client_events WHERE owner_user_id=$1::uuid ORDER BY created_at`,
      [STAGING_A_USER_ID],
    );
    if (eventIdsResult.rows.length !== EXPECTED_EVENTS) {
      throw new Error(`staging_a_event_count_${eventIdsResult.rows.length}`);
    }

    const memberships = await count(
      `SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    const snapshots = await count(
      `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    if (memberships !== EXPECTED_MEMBERSHIPS) throw new Error("staging_a_membership_count_changed");
    if (snapshots !== EXPECTED_SNAPSHOTS) throw new Error("staging_a_snapshot_count_changed");

    const authClient = await createClientEventReadAuthClient<ClientEventDashboardAuthClient>();
    if (!authClient) throw new Error("staging_a_auth_client_unavailable");

    let accessibleEvents = 0;
    for (const event of eventIdsResult.rows) {
      const access = await resolveClientEventDashboardAccess(
        authClient,
        STAGING_A_USER_ID,
        event.id,
      );
      if (access.kind !== "ok") throw new Error("staging_a_event_acl_failed");
      accessibleEvents += 1;
    }

    const dashboard = await getClientEventDashboardData({
      authClient,
      userId: STAGING_A_USER_ID,
      eventId: profileBefore.active_client_event_id,
      profile: {
        full_name: reconciled.full_name,
        app_role: reconciled.app_role,
      },
    });
    if (
      dashboard.kind !== "ok" ||
      !dashboard.dashboard ||
      dashboard.dashboard.eventOverview.eventId !== profileBefore.active_client_event_id
    ) {
      throw new Error("staging_a_dashboard_load_failed");
    }

    const signOut = await authCall(authUrl, "sign-out", {}, cookieHeader);
    if (!signOut.response.ok) throw new Error(`staging_a_sign_out_http_${signOut.response.status}`);
    cookieHeader = "";

    const sessionsAfterSignOut = await count(
      `SELECT count(*)::text AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
      [STAGING_A_USER_ID],
    );
    if (sessionsAfterSignOut !== sessionsBefore) {
      throw new Error("staging_a_session_cleanup_failed");
    }

    console.info(
      "[staging-a-neon-auth-smoke]",
      JSON.stringify({
        signIn: true,
        session: true,
        reconciliation: true,
        accessibleEvents,
        memberships,
        snapshots,
        activeDashboard: true,
        dashboardModules: dashboard.dashboard.modules.length,
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

    if (originalCredential) {
      await neonQuery(
        `UPDATE neon_auth.account
         SET password=$2::text, "updatedAt"=$3::timestamptz
         WHERE id=$1::uuid`,
        [originalCredential.id, originalCredential.password, originalCredential.updatedAt],
      ).catch(() => null);
    }

    if (tempUserId) {
      await neonQuery(`DELETE FROM neon_auth."user" WHERE id=$1::uuid`, [tempUserId]).catch(
        () => null,
      );
    }
    await neonQuery(
      `DELETE FROM neon_auth.verification WHERE identifier=$1::text OR identifier LIKE '%' || $1::text || '%'`,
      [tempEmail],
    ).catch(() => null);

    const cleanup = {
      tempUsers: await count(
        `SELECT count(*)::text AS count FROM neon_auth."user" WHERE lower(email)=lower($1::text)`,
        [tempEmail],
      ).catch(() => -1),
      stagingSessions: await count(
        `SELECT count(*)::text AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
        [STAGING_A_USER_ID],
      ).catch(() => -1),
      events: await count(
        `SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`,
        [STAGING_A_USER_ID],
      ).catch(() => -1),
      memberships: await count(
        `SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`,
        [STAGING_A_USER_ID],
      ).catch(() => -1),
      snapshots: await count(
        `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`,
        [STAGING_A_USER_ID],
      ).catch(() => -1),
    };

    const passwordRestored = originalCredential
      ? await neonQuery<{ restored: boolean }>(
          `SELECT (password=$2::text AND "updatedAt"=$3::timestamptz) AS restored
           FROM neon_auth.account WHERE id=$1::uuid`,
          [originalCredential.id, originalCredential.password, originalCredential.updatedAt],
        )
          .then((result) => result.rows[0]?.restored === true)
          .catch(() => false)
      : false;

    console.info(
      "[staging-a-neon-auth-smoke-cleanup]",
      JSON.stringify({ ...cleanup, passwordRestored }),
    );

    const cleanupPassed =
      cleanup.tempUsers === 0 &&
      cleanup.stagingSessions === 0 &&
      cleanup.events === EXPECTED_EVENTS &&
      cleanup.memberships === EXPECTED_MEMBERSHIPS &&
      cleanup.snapshots === EXPECTED_SNAPSHOTS &&
      passwordRestored;

    await closeNeonPoolForTests().catch(() => undefined);
    if (primaryError) throw primaryError;
    if (!cleanupPassed) throw new Error("staging_a_smoke_cleanup_failed");
  }
}

runSmoke().catch((cause) => {
  console.error(
    "[staging-a-neon-auth-smoke] failed",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
