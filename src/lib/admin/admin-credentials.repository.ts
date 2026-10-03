import "server-only";

import { neonQuery } from "@/lib/neon/server-db";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";

export type AdminCredential = {
  id: string;
  adminUserId: string;
  passwordHash: string;
  passwordUpdatedAt: string;
  credentialVersion: number;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminCredentialRow = {
  id: string;
  admin_user_id: string;
  password_hash: string;
  password_updated_at: Date | string;
  credential_version: number;
  failed_login_count: number;
  locked_until: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

function asIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: AdminCredentialRow): AdminCredential {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    passwordHash: row.password_hash,
    passwordUpdatedAt: asIsoString(row.password_updated_at),
    credentialVersion: row.credential_version,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until ? asIsoString(row.locked_until) : null,
    createdAt: asIsoString(row.created_at),
    updatedAt: asIsoString(row.updated_at),
  };
}

export function isAccountLocked(credentials: { lockedUntil: string | null } | null): boolean {
  if (!credentials?.lockedUntil) return false;
  return new Date(credentials.lockedUntil).getTime() > Date.now();
}

export async function getAdminCredentialsByUserId(
  adminUserId: string,
): Promise<AdminCredential | null> {
  if (!shouldUseNeonServerDatabase()) return null;

  const result = await neonQuery<AdminCredentialRow>(
    `SELECT id,
            admin_user_id,
            password_hash,
            password_updated_at,
            credential_version,
            failed_login_count,
            locked_until,
            created_at,
            updated_at
       FROM public.admin_credentials
      WHERE admin_user_id = $1::uuid
      LIMIT 1`,
    [adminUserId],
  );

  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function setAdminPassword(
  adminUserId: string,
  passwordHash: string,
  actorUserId?: string,
): Promise<{ credentialVersion: number }> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  const existing = await getAdminCredentialsByUserId(adminUserId);
  const isNew = !existing;

  const result = await neonQuery<{ credential_version: number }>(
    `INSERT INTO public.admin_credentials (
       admin_user_id,
       password_hash,
       password_updated_at,
       credential_version,
       failed_login_count,
       locked_until
     ) VALUES (
       $1::uuid,
       $2,
       now(),
       1,
       0,
       NULL
     )
     ON CONFLICT (admin_user_id) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           password_updated_at = now(),
           credential_version = public.admin_credentials.credential_version + 1,
           failed_login_count = 0,
           locked_until = NULL,
           updated_at = now()
     RETURNING credential_version`,
    [adminUserId, passwordHash],
  );

  const newVersion = result.rows[0].credential_version;

  await recordAdminAudit({
    actorUserId: actorUserId || adminUserId,
    targetUserId: adminUserId,
    action: isNew ? "password_set" : "password_changed",
    details: { credential_version: newVersion },
  });

  return { credentialVersion: newVersion };
}

export async function recordFailedAdminLogin(
  adminUserId: string,
): Promise<{ failedCount: number; lockedUntil: string | null }> {
  if (!shouldUseNeonServerDatabase()) {
    return { failedCount: 0, lockedUntil: null };
  }

  const result = await neonQuery<{
    failed_login_count: number;
    locked_until: Date | string | null;
  }>(
    `UPDATE public.admin_credentials
        SET failed_login_count = failed_login_count + 1,
            locked_until = CASE
              WHEN failed_login_count + 1 >= $2 THEN now() + interval '${LOCKOUT_DURATION_MINUTES} minutes'
              ELSE locked_until
            END,
            updated_at = now()
      WHERE admin_user_id = $1::uuid
      RETURNING failed_login_count, locked_until`,
    [adminUserId, MAX_FAILED_LOGINS],
  );

  const row = result.rows[0];
  if (!row) {
    return { failedCount: 0, lockedUntil: null };
  }

  return {
    failedCount: row.failed_login_count,
    lockedUntil: row.locked_until ? asIsoString(row.locked_until) : null,
  };
}

export async function resetFailedAdminLogin(adminUserId: string): Promise<void> {
  if (!shouldUseNeonServerDatabase()) return;

  await neonQuery(
    `UPDATE public.admin_credentials
        SET failed_login_count = 0,
            locked_until = NULL,
            updated_at = now()
      WHERE admin_user_id = $1::uuid
        AND (failed_login_count > 0 OR locked_until IS NOT NULL)`,
    [adminUserId],
  );
}

export async function incrementAdminCredentialVersion(
  adminUserId: string,
  actorUserId?: string,
): Promise<number> {
  if (!shouldUseNeonServerDatabase()) return 1;

  const result = await neonQuery<{ credential_version: number }>(
    `UPDATE public.admin_credentials
        SET credential_version = credential_version + 1,
            updated_at = now()
      WHERE admin_user_id = $1::uuid
      RETURNING credential_version`,
    [adminUserId],
  );

  const row = result.rows[0];
  if (!row) return 1;

  await recordAdminAudit({
    actorUserId: actorUserId || adminUserId,
    targetUserId: adminUserId,
    action: "all_sessions_revoked",
    details: { reason: "credential_version_incremented", new_version: row.credential_version },
  });

  return row.credential_version;
}
