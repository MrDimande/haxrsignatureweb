import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleCreateEventRequest } from "@/lib/events/create-event-api";
import { createClientEventFromPayloadNeon } from "@/lib/events/client-event.neon.service";
import {
  createClientEventOperationalRpcClient,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { fetchNeonSession, reconcileVerifiedNeonIdentity } from "@/lib/neon/auth-session";
import { getSetCookieHeaders } from "@/lib/neon/auth-proxy";
import { closeNeonPoolForTests, neonQuery } from "@/lib/neon/server-db";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const BRANCH_ORIGIN =
  "https://haxrsignatureweb-git-migration-ce8d3d-alberto-dimandes-projects.vercel.app";

type CountRow = { count: string };
type UserRow = { id: string };
type RpcClient = {
  rpc(
    fn:
      | "get_client_event_guests"
      | "get_client_event_payments"
      | "get_client_event_checklist"
      | "get_client_event_documents"
      | "get_client_event_vendors",
    args: { p_client_event_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
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

async function count(sql: string, params: readonly unknown[]): Promise<number> {
  const result = await neonQuery<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function runCanary(): Promise<void> {
  if (!isMigrationPreview()) {
    console.info("[neon-api-events-canary] skipped outside migration Preview");
    return;
  }
  if (!process.env.DATABASE_URL?.trim()) throw new Error("database_url_missing");

  const authUrl = readAuthUrlFromVercelConfig();
  process.env.NEON_AUTH_BASE_URL = authUrl;
  process.env.HAXR_AUTH_PROVIDER = "neon";

  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `neon-api-events-${suffix}@haxr.invalid`;
  const password = `Haxr!${randomBytes(24).toString("base64url")}`;
  const fingerprint = `api-events-${suffix}`;
  const payload = {
    eventType: "wedding" as const,
    eventName: `API Events Canary ${suffix}`,
    brideName: "Canary",
    groomName: "Synthetic",
    eventDate: "2026-12-20",
    eventLocation: "Maputo",
    estimatedGuests: 30,
    budgetMin: 100000,
    budgetMax: 150000,
    servicesInterested: ["rsvp", "gestao_convidados"] as const,
    phone: "+258840000001",
    source: "onboarding" as const,
    localFingerprint: fingerprint,
  };

  let neonUserId: string | null = null;
  let clientEventId: string | null = null;
  let operationalEventId: string | null = null;
  let cookieHeader = "";
  let primaryError: unknown = null;

  try {
    const signUp = await authCall(authUrl, "sign-up/email", {
      email,
      password,
      name: "HAXR API Events Canary",
    });
    if (!signUp.ok) throw new Error(`sign_up_http_${signUp.status}`);

    const userLookup = await neonQuery<UserRow>(
      `SELECT id FROM neon_auth."user" WHERE lower(email)=lower($1::text) LIMIT 1`,
      [email],
    );
    neonUserId = userLookup.rows[0]?.id ?? null;
    if (!neonUserId) throw new Error("neon_user_missing_after_signup");

    await neonQuery(
      `UPDATE neon_auth."user" SET "emailVerified"=true, "updatedAt"=now() WHERE id=$1::uuid`,
      [neonUserId],
    );

    const signIn = await authCall(authUrl, "sign-in/email", { email, password });
    if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
    cookieHeader = cookieHeaderFromResponse(signIn);
    if (!cookieHeader) throw new Error("session_cookie_missing");

    const session = await fetchNeonSession(cookieHeader);
    if (!session || session.user.id !== neonUserId || !session.user.emailVerified) {
      throw new Error("neon_session_contract_failed");
    }
    const profile = await reconcileVerifiedNeonIdentity(session.user);
    if (!profile || profile.id !== neonUserId) {
      throw new Error("new_profile_reconciliation_failed");
    }

    const envCheck = validateClientEventAuthEnvironment();
    const operationalCheck = validateClientEventOperationalEnvironment();
    if (!envCheck.ok || !operationalCheck.ok) {
      throw new Error("client_event_environment_not_ready");
    }

    const unauthorized = await handleCreateEventRequest({
      envCheck,
      serviceRoleCheck: operationalCheck,
      user: null,
      rawBody: payload,
      idempotencyKey: "unauthorized-canary",
      createDeps: null,
      createEvent: createClientEventFromPayloadNeon,
    });
    if (unauthorized.status !== 401 || unauthorized.body.ok) {
      throw new Error("unauthorized_contract_failed");
    }

    const invalid = await handleCreateEventRequest({
      envCheck,
      serviceRoleCheck: operationalCheck,
      user: { id: neonUserId },
      rawBody: { ...payload, estimatedGuests: 0 },
      idempotencyKey: "invalid-canary",
      createDeps: null,
      createEvent: createClientEventFromPayloadNeon,
    });
    if (invalid.status !== 400 || invalid.body.ok) {
      throw new Error("validation_contract_failed");
    }

    const first = await handleCreateEventRequest({
      envCheck,
      serviceRoleCheck: operationalCheck,
      user: { id: neonUserId },
      rawBody: payload,
      idempotencyKey: `api-events-${suffix}`,
      createDeps: null,
      createEvent: createClientEventFromPayloadNeon,
    });
    if (first.status !== 201 || !first.body.ok || !first.body.created) {
      throw new Error(`first_create_contract_failed_${first.status}`);
    }
    clientEventId = first.body.data.eventId;
    operationalEventId = first.body.data.operationalEventId;
    if (!operationalEventId || !first.body.data.operationalLinked) {
      throw new Error("operational_event_not_linked");
    }

    const replay = await handleCreateEventRequest({
      envCheck,
      serviceRoleCheck: operationalCheck,
      user: { id: neonUserId },
      rawBody: payload,
      idempotencyKey: `api-events-${suffix}`,
      createDeps: null,
      createEvent: createClientEventFromPayloadNeon,
    });
    if (
      replay.status !== 200 ||
      !replay.body.ok ||
      replay.body.created ||
      replay.body.data.eventId !== clientEventId ||
      replay.body.data.operationalEventId !== operationalEventId
    ) {
      throw new Error("idempotent_replay_contract_failed");
    }

    const secondPayload = {
      ...payload,
      eventName: `API Events Second ${suffix}`,
      localFingerprint: `api-events-second-${suffix}`,
    };
    const activeConflict = await handleCreateEventRequest({
      envCheck,
      serviceRoleCheck: operationalCheck,
      user: { id: neonUserId },
      rawBody: secondPayload,
      idempotencyKey: `api-events-second-${suffix}`,
      createDeps: null,
      createEvent: createClientEventFromPayloadNeon,
    });
    if (
      activeConflict.status !== 409 ||
      activeConflict.body.ok ||
      activeConflict.body.error !== "active_event_exists"
    ) {
      throw new Error("active_event_conflict_contract_failed");
    }

    const eventCount = await count(
      `SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid AND onboarding_fingerprint=$2::text`,
      [neonUserId, fingerprint],
    );
    const membershipCount = await count(
      `SELECT count(*)::text AS count FROM public.event_members WHERE client_event_id=$1::uuid AND user_id=$2::uuid AND role='owner'`,
      [clientEventId, neonUserId],
    );
    const snapshotCount = await count(
      `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE client_event_id=$1::uuid AND owner_user_id=$2::uuid`,
      [clientEventId, neonUserId],
    );
    const activeProfile = await count(
      `SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid AND active_client_event_id=$2::uuid`,
      [neonUserId, clientEventId],
    );
    const operationalCount = await count(
      `SELECT count(*)::text AS count FROM public.events WHERE id=$1::uuid AND notes=$2::text`,
      [operationalEventId, `Provisioned from client_events:${clientEventId}`],
    );
    if (
      eventCount !== 1 ||
      membershipCount !== 1 ||
      snapshotCount !== 1 ||
      activeProfile !== 1 ||
      operationalCount !== 1
    ) {
      throw new Error("database_shape_contract_failed");
    }

    const rpcClient = createClientEventOperationalRpcClient<RpcClient>();
    const rpcNames: Parameters<RpcClient["rpc"]>[0][] = [
      "get_client_event_guests",
      "get_client_event_payments",
      "get_client_event_checklist",
      "get_client_event_documents",
      "get_client_event_vendors",
    ];
    for (const fn of rpcNames) {
      const result = await rpcClient.rpc(fn, { p_client_event_id: clientEventId });
      if (result.error || result.data === null) {
        throw new Error(`operational_rpc_failed_${fn}`);
      }
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
      "[neon-api-events-canary]",
      JSON.stringify({
        signUp: true,
        signIn: true,
        session: true,
        unauthorized401: true,
        validation400: true,
        created201: true,
        idempotent200: true,
        activeConflict409: true,
        clientEvents: eventCount,
        memberships: membershipCount,
        snapshots: snapshotCount,
        activeProfile,
        operationalEvents: operationalCount,
        operationalRpcs: rpcNames.length,
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

    if (neonUserId) {
      await neonQuery(
        `UPDATE public.profiles SET active_client_event_id=NULL WHERE id=$1::uuid`,
        [neonUserId],
      ).catch(() => null);
    }
    if (clientEventId) {
      await neonQuery(
        `DELETE FROM public.event_onboarding_snapshots WHERE client_event_id=$1::uuid`,
        [clientEventId],
      ).catch(() => null);
      await neonQuery(
        `DELETE FROM public.event_members WHERE client_event_id=$1::uuid`,
        [clientEventId],
      ).catch(() => null);
      await neonQuery(
        `DELETE FROM public.client_events WHERE id=$1::uuid`,
        [clientEventId],
      ).catch(() => null);
    }
    if (operationalEventId) {
      await neonQuery(`DELETE FROM public.events WHERE id=$1::uuid`, [operationalEventId]).catch(
        () => null,
      );
    }
    if (neonUserId) {
      await neonQuery(`DELETE FROM public.profiles WHERE id=$1::uuid`, [neonUserId]).catch(
        () => null,
      );
    }
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
      profiles: neonUserId
        ? await count(`SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid`, [neonUserId]).catch(() => -1)
        : 0,
      clientEvents: await count(
        `SELECT count(*)::text AS count FROM public.client_events WHERE onboarding_fingerprint=$1::text`,
        [fingerprint],
      ).catch(() => -1),
      operationalEvents: clientEventId
        ? await count(
            `SELECT count(*)::text AS count FROM public.events WHERE notes=$1::text`,
            [`Provisioned from client_events:${clientEventId}`],
          ).catch(() => -1)
        : 0,
    };
    console.info("[neon-api-events-canary-cleanup]", JSON.stringify(cleanup));
    const cleanupPassed = Object.values(cleanup).every((value) => value === 0);
    await closeNeonPoolForTests().catch(() => undefined);

    if (primaryError) throw primaryError;
    if (!cleanupPassed) throw new Error("api_events_canary_cleanup_failed");
  }
}

runCanary().catch((cause) => {
  console.error(
    "[neon-api-events-canary] failed",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
