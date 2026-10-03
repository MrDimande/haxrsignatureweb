import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { neonQuery } from "@/lib/neon/server-db";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";
import type { AdminUser } from "@/lib/admin/admin-user";

export const ADMIN_SESSION_VERSION_PREFIX = "v2";
const SESSION_LIFETIME_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * SESSION_LIFETIME_DAYS;

export type AdminSession = {
  id: string;
  adminUserId: string;
  credentialVersion: number;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AdminSessionValidationResult =
  | { valid: true; user: AdminUser; session: AdminSession }
  | { valid: false; reason: string; user?: AdminUser };

type AdminSessionRow = {
  id: string;
  admin_user_id: string;
  credential_version: number;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  last_seen_at: Date | string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Date | string;
  // joined user
  user_name: string;
  user_email: string;
  user_role: string;
  user_permissions: string[];
  user_status: string;
  user_created_at: Date | string;
  user_updated_at: Date | string;
  user_last_login_at: Date | string | null;
  // joined credential version
  current_credential_version: number;
};

function asIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function createSessionCookieValue(sessionId: string, secret: string): string {
  return `${ADMIN_SESSION_VERSION_PREFIX}.${sessionId}.${secret}`;
}

export function parseSessionCookieValue(
  cookieValue: string | undefined,
): { sessionId: string; secret: string } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3 || parts[0] !== ADMIN_SESSION_VERSION_PREFIX) {
    return null;
  }
  const [, sessionId, secret] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(sessionId)) return null;
  if (!/^[A-Za-z0-9_-]{30,64}$/.test(secret)) return null;

  return { sessionId, secret };
}

export function isV2DatabaseSession(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts[0] === ADMIN_SESSION_VERSION_PREFIX;
}

export async function createAdminSession(
  adminUserId: string,
  metadata?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  // Get current credential version
  const credRes = await neonQuery<{ credential_version: number }>(
    `SELECT credential_version FROM public.admin_credentials WHERE admin_user_id = $1::uuid LIMIT 1`,
    [adminUserId],
  );

  const credVersion = credRes.rows[0]?.credential_version ?? 1;
  const secret = randomBytes(32).toString("base64url");
  const tokenHash = hashSecret(secret);

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const result = await neonQuery<{ id: string }>(
    `INSERT INTO public.admin_sessions (
       admin_user_id,
       token_hash,
       credential_version,
       expires_at,
       user_agent,
       ip_address
     ) VALUES (
       $1::uuid,
       $2,
       $3,
       $4,
       $5,
       $6
     )
     RETURNING id`,
    [
      adminUserId,
      tokenHash,
      credVersion,
      expiresAt,
      metadata?.userAgent?.slice(0, 500) || null,
      metadata?.ipAddress?.slice(0, 100) || null,
    ],
  );

  const sessionId = result.rows[0].id;
  const token = createSessionCookieValue(sessionId, secret);

  return { token, sessionId, expiresAt };
}

export async function validateDatabaseSession(
  cookieValue: string | undefined,
): Promise<AdminSessionValidationResult> {
  if (!shouldUseNeonServerDatabase()) {
    return { valid: false, reason: "neon_not_configured" };
  }

  const parsed = parseSessionCookieValue(cookieValue);
  if (!parsed) {
    return { valid: false, reason: "invalid_token_format" };
  }

  const tokenHash = hashSecret(parsed.secret);

  const result = await neonQuery<AdminSessionRow>(
    `SELECT s.id,
            s.admin_user_id,
            s.credential_version,
            s.expires_at,
            s.revoked_at,
            s.last_seen_at,
            s.user_agent,
            s.ip_address,
            s.created_at,
            u.name AS user_name,
            u.email AS user_email,
            u.role AS user_role,
            u.permissions AS user_permissions,
            u.status AS user_status,
            u.created_at AS user_created_at,
            u.updated_at AS user_updated_at,
            u.last_login_at AS user_last_login_at,
            COALESCE(c.credential_version, 1) AS current_credential_version
       FROM public.admin_sessions s
       JOIN public.admin_users u ON u.id = s.admin_user_id
  LEFT JOIN public.admin_credentials c ON c.admin_user_id = u.id
      WHERE s.id = $1::uuid
        AND s.token_hash = $2
      LIMIT 1`,
    [parsed.sessionId, tokenHash],
  );

  const row = result.rows[0];
  if (!row) {
    return { valid: false, reason: "session_not_found" };
  }

  const user: AdminUser = {
    id: row.admin_user_id,
    name: row.user_name,
    email: row.user_email,
    role: row.user_role as AdminUser["role"],
    permissions: (row.user_permissions || []) as AdminUser["permissions"],
    status: row.user_status as AdminUser["status"],
    createdAt: asIsoString(row.user_created_at),
    updatedAt: asIsoString(row.user_updated_at),
    lastLoginAt: row.user_last_login_at ? asIsoString(row.user_last_login_at) : null,
  };

  const session: AdminSession = {
    id: row.id,
    adminUserId: row.admin_user_id,
    credentialVersion: row.credential_version,
    expiresAt: asIsoString(row.expires_at),
    revokedAt: row.revoked_at ? asIsoString(row.revoked_at) : null,
    lastSeenAt: row.last_seen_at ? asIsoString(row.last_seen_at) : null,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: asIsoString(row.created_at),
  };

  if (session.revokedAt) {
    return { valid: false, reason: "session_revoked", user };
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return { valid: false, reason: "session_expired", user };
  }

  if (user.status !== "active") {
    return { valid: false, reason: "user_suspended", user };
  }

  if (session.credentialVersion !== row.current_credential_version) {
    return { valid: false, reason: "credential_version_mismatch", user };
  }

  // Throttled last_seen_at update (if last_seen_at is older than 5 minutes or null)
  const lastSeenMs = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (Date.now() - lastSeenMs > 5 * 60 * 1000) {
    neonQuery(
      `UPDATE public.admin_sessions SET last_seen_at = now() WHERE id = $1::uuid`,
      [session.id],
    ).catch(() => {});
  }

  return { valid: true, user, session };
}

export async function revokeAdminSession(
  sessionId: string,
  actorUserId?: string,
): Promise<boolean> {
  if (!shouldUseNeonServerDatabase()) return false;

  const result = await neonQuery<{ admin_user_id: string }>(
    `UPDATE public.admin_sessions
        SET revoked_at = now()
      WHERE id = $1::uuid
        AND revoked_at IS NULL
    RETURNING admin_user_id`,
    [sessionId],
  );

  const row = result.rows[0];
  if (!row) return false;

  await recordAdminAudit({
    actorUserId: actorUserId || row.admin_user_id,
    targetUserId: row.admin_user_id,
    action: "session_revoked",
    details: { session_id: sessionId },
  });

  return true;
}

export async function revokeAllAdminSessionsForUser(
  adminUserId: string,
  actorUserId?: string,
): Promise<number> {
  if (!shouldUseNeonServerDatabase()) return 0;

  const result = await neonQuery<{ id: string }>(
    `UPDATE public.admin_sessions
        SET revoked_at = now()
      WHERE admin_user_id = $1::uuid
        AND revoked_at IS NULL
    RETURNING id`,
    [adminUserId],
  );

  const count = result.rows.length;
  if (count > 0) {
    await recordAdminAudit({
      actorUserId: actorUserId || adminUserId,
      targetUserId: adminUserId,
      action: "all_sessions_revoked",
      details: { revoked_count: count },
    });
  }

  return count;
}

export async function listActiveAdminSessionsForUser(
  adminUserId: string,
): Promise<AdminSession[]> {
  if (!shouldUseNeonServerDatabase()) return [];

  const result = await neonQuery<Omit<AdminSessionRow, "user_name" | "user_email" | "user_role" | "user_permissions" | "user_status" | "user_created_at" | "user_updated_at" | "user_last_login_at" | "current_credential_version">>(
    `SELECT id,
            admin_user_id,
            credential_version,
            expires_at,
            revoked_at,
            last_seen_at,
            user_agent,
            ip_address,
            created_at
       FROM public.admin_sessions
      WHERE admin_user_id = $1::uuid
        AND revoked_at IS NULL
        AND expires_at > now()
      ORDER BY created_at DESC`,
    [adminUserId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    adminUserId: row.admin_user_id,
    credentialVersion: row.credential_version,
    expiresAt: asIsoString(row.expires_at),
    revokedAt: null,
    lastSeenAt: row.last_seen_at ? asIsoString(row.last_seen_at) : null,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: asIsoString(row.created_at),
  }));
}
