import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";

const RESET_TOKEN_EXPIRY_HOURS = 1;

export type AdminPasswordResetToken = {
  id: string;
  adminUserId: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type AdminPasswordResetTokenRow = {
  id: string;
  admin_user_id: string;
  expires_at: Date | string;
  used_at: Date | string | null;
  revoked_at: Date | string | null;
  created_at: Date | string;
};

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export async function createAdminPasswordResetToken(
  adminUserId: string,
  actorUserId?: string,
): Promise<{ rawToken: string; expiresAt: Date; tokenId: string }> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  return withNeonTransaction(async (client) => {
    // 1. Invalidate any prior unused reset tokens for this user
    await client.query(
      `UPDATE public.admin_password_reset_tokens
          SET revoked_at = now()
        WHERE admin_user_id = $1::uuid
          AND used_at IS NULL
          AND revoked_at IS NULL`,
      [adminUserId],
    );

    // 2. Insert new token
    const result = await client.query<AdminPasswordResetTokenRow>(
      `INSERT INTO public.admin_password_reset_tokens (
         admin_user_id,
         token_hash,
         expires_at
       ) VALUES (
         $1::uuid,
         $2,
         $3
       )
       RETURNING id, admin_user_id, expires_at, used_at, revoked_at, created_at`,
      [adminUserId, tokenHash, expiresAt],
    );

    const tokenId = result.rows[0].id;

    // 3. Audit log (never leak token)
    await recordAdminAudit({
      actorUserId: actorUserId || adminUserId,
      targetUserId: adminUserId,
      action: "password_reset_requested",
      details: { token_id: tokenId },
    });

    return { rawToken, expiresAt, tokenId };
  });
}

export async function validatePasswordResetToken(
  rawToken: string,
): Promise<{ valid: boolean; adminUserId?: string; tokenId?: string }> {
  if (!shouldUseNeonServerDatabase() || !rawToken?.trim()) {
    return { valid: false };
  }

  const tokenHash = hashToken(rawToken.trim());

  const result = await neonQuery<AdminPasswordResetTokenRow>(
    `SELECT id, admin_user_id, expires_at, used_at, revoked_at, created_at
       FROM public.admin_password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) return { valid: false };

  return { valid: true, adminUserId: row.admin_user_id, tokenId: row.id };
}

export async function executePasswordResetWithToken(
  rawToken: string,
  newPasswordHash: string,
): Promise<{ success: boolean; adminUserId: string }> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  const tokenHash = hashToken(rawToken.trim());

  return withNeonTransaction(async (client) => {
    // 1. Lock and validate token
    const tokenRes = await client.query<AdminPasswordResetTokenRow>(
      `SELECT id, admin_user_id, expires_at, used_at, revoked_at, created_at
         FROM public.admin_password_reset_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > now()
        FOR UPDATE`,
      [tokenHash],
    );

    const tokenRow = tokenRes.rows[0];
    if (!tokenRow) {
      throw new Error("Token de recuperação inválido, expirado ou já utilizado.");
    }

    const adminUserId = tokenRow.admin_user_id;

    // 2. Mark token used
    await client.query(
      `UPDATE public.admin_password_reset_tokens
          SET used_at = now()
        WHERE id = $1::uuid`,
      [tokenRow.id],
    );

    // 3. Update admin_credentials
    await client.query(
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
             updated_at = now()`,
      [adminUserId, newPasswordHash],
    );

    // 4. Revoke all active sessions for this user
    await client.query(
      `UPDATE public.admin_sessions
          SET revoked_at = now()
        WHERE admin_user_id = $1::uuid
          AND revoked_at IS NULL`,
      [adminUserId],
    );

    // 5. Audit logs
    await recordAdminAudit({
      actorUserId: adminUserId,
      targetUserId: adminUserId,
      action: "password_reset_completed",
      details: { token_id: tokenRow.id },
    });

    await recordAdminAudit({
      actorUserId: adminUserId,
      targetUserId: adminUserId,
      action: "password_changed",
      details: { via: "password_reset" },
    });

    return { success: true, adminUserId };
  });
}
