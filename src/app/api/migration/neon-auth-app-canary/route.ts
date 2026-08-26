import { randomBytes, randomUUID } from "node:crypto";
import {
  buildLegacyEmailSha256,
  fetchNeonSession,
  reconcileVerifiedNeonIdentity,
} from "@/lib/neon/auth-session";
import { getSetCookieHeaders } from "@/lib/neon/auth-proxy";
import {
  getNeonAuthUrl,
  shouldUseNeonAuthForAppSession,
} from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import { createClientEventReadAuthClient } from "@/lib/auth/client-event-server-clients";
import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";

export const dynamic = "force-dynamic";

const MIGRATION_BRANCH = "migration/supabase-to-neon";

type CountRow = { count: string };
type UserRow = { id: string };
type ClaimRow = {
  status: string;
  new_user_id: string | null;
};

type AuthCallResult = {
  response: Response;
  payload: unknown;
};

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH &&
    shouldUseNeonAuthForAppSession()
  );
}

async function authCall(
  authUrl: string,
  origin: string,
  path: string,
  body: Record<string, unknown>,
  cookieHeader?: string,
): Promise<AuthCallResult> {
  const response = await fetch(`${authUrl.replace(/\/$/, "")}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
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

async function count(sql: string, params: unknown[]): Promise<number> {
  const result = await neonQuery<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

export async function GET(request: Request): Promise<Response> {
  if (!isMigrationPreview()) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const authUrl = getNeonAuthUrl();
  if (!authUrl || !process.env.DATABASE_URL?.trim()) {
    return Response.json({ error: "migration_backend_not_ready" }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
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

    const signUp = await authCall(authUrl, origin, "sign-up/email", {
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

    await neonQuery(
      `UPDATE neon_auth."user" SET "emailVerified"=true, "updatedAt"=now() WHERE id=$1::uuid`,
      [neonUserId],
    );

    const signIn = await authCall(authUrl, origin, "sign-in/email", {
      email,
      password,
    });
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

    const authClient = await createClientEventReadAuthClient<ClientEventDashboardAuthClient>();
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
      (await count(
        `SELECT count(*)::text AS count FROM public.profiles WHERE id=$1::uuid`,
        [oldUserId],
      )) +
      (await count(
        `SELECT count(*)::text AS count FROM public.client_events WHERE owner_user_id=$1::uuid`,
        [oldUserId],
      )) +
      (await count(
        `SELECT count(*)::text AS count FROM public.event_members WHERE user_id=$1::uuid`,
        [oldUserId],
      )) +
      (await count(
        `SELECT count(*)::text AS count FROM public.event_onboarding_snapshots WHERE owner_user_id=$1::uuid`,
        [oldUserId],
      ));

    const claimRow = claim.rows[0];
    const passed =
      claimRow?.status === "claimed" &&
      claimRow.new_user_id === neonUserId &&
      ownerAccess.kind === "ok" &&
      outsiderAccess.kind === "forbidden" &&
      movedOwner === 1 &&
      movedMembership === 1 &&
      movedSnapshot === 1 &&
      oldReferences === 0;

    if (!passed) throw new Error("full_app_acl_canary_failed");

    return Response.json(
      {
        ok: true,
        auth: {
          signUp: true,
          signIn: true,
          fetchNeonSession: true,
          verifiedSession: true,
        },
        reconciliation: {
          claimed: true,
          profileMoved: true,
          ownerMoved: movedOwner === 1,
          membershipMoved: movedMembership === 1,
          snapshotMoved: movedSnapshot === 1,
          oldReferences,
        },
        acl: {
          owner: ownerAccess.kind,
          outsider: outsiderAccess.kind,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    );
  } catch (cause) {
    return Response.json(
      {
        ok: false,
        stage: cause instanceof Error ? cause.message : "unknown_error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    if (cookieHeader) {
      await authCall(authUrl, origin, "sign-out", {}, cookieHeader).catch(() => null);
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

    await neonQuery(`DELETE FROM neon_auth."user" WHERE lower(email)=lower($1::text)`, [email]).catch(
      () => null,
    );
  }
}
