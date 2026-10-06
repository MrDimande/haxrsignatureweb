import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAppUserDisplay, type ClientAppProfile } from "@/lib/auth/app-user-display";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import {
  createPortalCookieValue,
  createPortalSecret,
  decidePortalLogin,
  hashPortalPassword,
  hashPortalSecret,
  normalizePortalEmail,
  parsePortalCookieValue,
  type PortalAccountStatus,
  validatePortalPassword,
  verifyPortalPassword,
} from "@/lib/portal-auth/credentials";
import { PORTAL_SESSION_COOKIE } from "@/lib/portal-auth/cookie-name";

export { PORTAL_SESSION_COOKIE } from "@/lib/portal-auth/cookie-name";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const REMEMBERED_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ACTIVATION_TTL_SECONDS = 60 * 60 * 24 * 3;

type PortalAccountRow = {
  account_id: string;
  profile_id: string;
  email: string | null;
  password_hash: string | null;
  status: PortalAccountStatus;
  auth_version: number;
  full_name: string | null;
  app_role: string | null;
  active_client_event_id: string | null;
};

type PortalSessionRow = PortalAccountRow & {
  session_id: string;
};

export type PortalSessionIdentity = {
  accountId: string;
  profileId: string;
  email: string;
  profile: ClientAppProfile;
};

function selectAccountColumns(): string {
  return `
    a.id AS account_id,
    a.profile_id,
    a.email,
    a.password_hash,
    a.status::text AS status,
    a.auth_version,
    p.full_name,
    p.app_role::text AS app_role,
    p.active_client_event_id
  `;
}

function toIdentity(row: PortalAccountRow): PortalSessionIdentity | null {
  if (!row.email || row.status !== "ACTIVE") return null;
  return {
    accountId: row.account_id,
    profileId: row.profile_id,
    email: row.email,
    profile: {
      id: row.profile_id,
      full_name: row.full_name,
      app_role: row.app_role,
      active_client_event_id: row.active_client_event_id,
    },
  };
}

function sessionMaxAge(rememberMe: boolean): number {
  return rememberMe ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;
}

function applyPortalCookie(response: NextResponse, value: string, maxAge: number): void {
  response.cookies.set(PORTAL_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearPortalCookie(response: NextResponse): void {
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function findAccountByEmail(email: string): Promise<PortalAccountRow | null> {
  const result = await neonQuery<PortalAccountRow>(
    `SELECT ${selectAccountColumns()}
       FROM public.portal_accounts a
       JOIN public.profiles p ON p.id = a.profile_id
      WHERE a.email = $1
      LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function getCurrentPortalSession(): Promise<PortalSessionIdentity | null> {
  const cookieStore = await cookies();
  const parsed = parsePortalCookieValue(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const result = await neonQuery<PortalSessionRow>(
    `SELECT s.id AS session_id, ${selectAccountColumns()}
       FROM public.portal_sessions s
       JOIN public.portal_accounts a ON a.id = s.account_id
       JOIN public.profiles p ON p.id = a.profile_id
      WHERE s.id = $1::uuid
        AND s.token_hash = $2
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.auth_version = a.auth_version
      LIMIT 1`,
    [parsed.sessionId, hashPortalSecret(parsed.secret)],
  );
  return result.rows[0] ? toIdentity(result.rows[0]) : null;
}

export async function createPortalLoginResponse(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<
  | { kind: "authenticated"; response: NextResponse }
  | { kind: "activation_required"; response: NextResponse }
  | { kind: "denied"; response: NextResponse }
> {
  const email = normalizePortalEmail(input.email);
  if (!email || input.password.length > 1024) {
    return { kind: "denied", response: NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 }) };
  }

  const account = await findAccountByEmail(email);
  const passwordMatches = await verifyPortalPassword(input.password, account?.password_hash);
  const decision = decidePortalLogin({ account, passwordMatches });

  if (decision.kind === "activation_required") {
    return {
      kind: decision.kind,
      response: NextResponse.json(
        { error: "Esta conta precisa de activação. Consulte o email de reactivação ou contacte a HAXR." },
        { status: 403 },
      ),
    };
  }
  if (decision.kind !== "authenticated" || !account) {
    return { kind: "denied", response: NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 }) };
  }

  const secret = createPortalSecret();
  const maxAge = sessionMaxAge(input.rememberMe);
  const created = await neonQuery<{ id: string }>(
    `INSERT INTO public.portal_sessions (account_id, token_hash, auth_version, expires_at)
     VALUES ($1::uuid, $2, $3, now() + ($4::integer * interval '1 second'))
     RETURNING id`,
    [account.account_id, hashPortalSecret(secret), account.auth_version, maxAge],
  );
  const sessionId = created.rows[0]?.id;
  if (!sessionId) throw new Error("portal_session_creation_failed");

  await neonQuery(
    "UPDATE public.portal_accounts SET last_login_at = now() WHERE id = $1::uuid",
    [account.account_id],
  );

  const response = NextResponse.json({ success: true });
  applyPortalCookie(response, createPortalCookieValue(sessionId, secret), maxAge);
  return { kind: "authenticated", response };
}

export async function logoutPortalSession(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  const parsed = parsePortalCookieValue(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
  if (parsed) {
    await neonQuery(
      `UPDATE public.portal_sessions
          SET revoked_at = now()
        WHERE id = $1::uuid AND token_hash = $2 AND revoked_at IS NULL`,
      [parsed.sessionId, hashPortalSecret(parsed.secret)],
    );
  }
  clearPortalCookie(response);
  return response;
}

export async function issuePortalAccountToken(input: {
  accountId: string;
  purpose: "activation" | "password_reset";
  expectedAccountStatus?: PortalAccountStatus;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = createPortalSecret();
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_SECONDS * 1000);

  await withNeonTransaction(async (client) => {
    await client.query(
      `UPDATE public.portal_account_tokens
          SET invalidated_at = now()
        WHERE account_id = $1::uuid
          AND purpose = $2::public.portal_token_purpose
          AND consumed_at IS NULL
          AND invalidated_at IS NULL`,
      [input.accountId, input.purpose],
    );
    if (input.expectedAccountStatus) {
      const accountResult = await client.query<{ status: PortalAccountStatus }>(
        `SELECT status::text AS status
           FROM public.portal_accounts
          WHERE id = $1::uuid
          FOR UPDATE`,
        [input.accountId],
      );
      const account = accountResult.rows[0];
      if (!account || account.status !== input.expectedAccountStatus) {
        throw new Error("portal_account_status_not_allowed");
      }
    }
    await client.query(
      `INSERT INTO public.portal_account_tokens (account_id, purpose, token_hash, expires_at)
       VALUES ($1::uuid, $2::public.portal_token_purpose, $3, $4::timestamptz)`,
      [input.accountId, input.purpose, hashPortalSecret(token), expiresAt.toISOString()],
    );
  });

  return { token, expiresAt };
}

/** Invalidates the exact opaque token after a delivery failure; never logs or returns it. */
export async function invalidatePortalAccountToken(input: {
  accountId: string;
  purpose: "activation" | "password_reset";
  token: string;
}): Promise<boolean> {
  const result = await neonQuery(
    `UPDATE public.portal_account_tokens
        SET invalidated_at = now()
      WHERE account_id = $1::uuid
        AND purpose = $2::public.portal_token_purpose
        AND token_hash = $3
        AND consumed_at IS NULL
        AND invalidated_at IS NULL`,
    [input.accountId, input.purpose, hashPortalSecret(input.token)],
  );

  return result.rowCount === 1;
}

export async function activatePortalAccount(input: {
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: "invalid_token" | "invalid_password" }> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(input.token)) return { ok: false, reason: "invalid_token" };
  if (validatePortalPassword(input.password)) return { ok: false, reason: "invalid_password" };
  const passwordHash = await hashPortalPassword(input.password);

  return withNeonTransaction(async (client) => {
    const tokenResult = await client.query<{
      token_id: string;
      account_id: string;
      purpose: "activation" | "password_reset";
      status: PortalAccountStatus;
    }>(
      `SELECT t.id AS token_id, t.account_id, t.purpose::text AS purpose, a.status::text AS status
         FROM public.portal_account_tokens t
         JOIN public.portal_accounts a ON a.id = t.account_id
        WHERE t.token_hash = $1
          AND t.expires_at > now()
          AND t.consumed_at IS NULL
          AND t.invalidated_at IS NULL
        FOR UPDATE OF t, a`,
      [hashPortalSecret(input.token)],
    );
    const token = tokenResult.rows[0];
    if (!token || token.status === "SUSPENDED") return { ok: false, reason: "invalid_token" };

    await client.query(
      `UPDATE public.portal_accounts
          SET password_hash = $1,
              password_set_at = now(),
              email_verified_at = COALESCE(email_verified_at, now()),
              status = 'ACTIVE'::public.portal_account_status,
              auth_version = auth_version + 1
        WHERE id = $2::uuid`,
      [passwordHash, token.account_id],
    );
    await client.query(
      "UPDATE public.portal_account_tokens SET consumed_at = now() WHERE id = $1::uuid",
      [token.token_id],
    );
    await client.query(
      "UPDATE public.portal_sessions SET revoked_at = now() WHERE account_id = $1::uuid AND revoked_at IS NULL",
      [token.account_id],
    );
    return { ok: true };
  });
}

export async function canAccessPortalEvent(profileId: string, eventId: string): Promise<boolean> {
  const result = await neonQuery<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM public.client_events ce
        WHERE ce.id = $1::uuid
          AND ce.is_active = true
          AND (
            ce.owner_user_id = $2::uuid
            OR EXISTS (
              SELECT 1
                FROM public.event_members em
               WHERE em.client_event_id = ce.id
                 AND em.user_id = $2::uuid
            )
          )
     ) AS allowed`,
    [eventId, profileId],
  );
  return result.rows[0]?.allowed === true;
}

export function isPortalEventMembership(input: {
  profileId: string;
  ownerProfileId: string;
  memberProfileIds: readonly string[];
}): boolean {
  return input.profileId === input.ownerProfileId || input.memberProfileIds.includes(input.profileId);
}

export function displayPortalSession(identity: PortalSessionIdentity) {
  return buildAppUserDisplay({
    user: { email: identity.email },
    profile: identity.profile,
  });
}
