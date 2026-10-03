import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";
import {
  normalizeAdminEmail,
  type AdminPermission,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/admin/admin-user";

const INVITE_EXPIRY_DAYS = 7;

export type AdminInvite = {
  id: string;
  email: string;
  role: AdminUserRole;
  permissions: AdminPermission[];
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdBy: string | null;
  createdAt: string;
};

type AdminInviteRow = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  expires_at: Date | string;
  accepted_at: Date | string | null;
  revoked_at: Date | string | null;
  created_by: string | null;
  created_at: Date | string;
};

function asIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function mapRow(row: AdminInviteRow): AdminInvite {
  return {
    id: row.id,
    email: normalizeAdminEmail(row.email),
    role: row.role as AdminUserRole,
    permissions: (row.permissions || []) as AdminPermission[],
    expiresAt: asIsoString(row.expires_at),
    acceptedAt: row.accepted_at ? asIsoString(row.accepted_at) : null,
    revokedAt: row.revoked_at ? asIsoString(row.revoked_at) : null,
    createdBy: row.created_by,
    createdAt: asIsoString(row.created_at),
  };
}

export async function createAdminInvite(input: {
  email: string;
  role: AdminUserRole;
  permissions?: AdminPermission[];
  actorUserId?: string;
}): Promise<{ invite: AdminInvite; rawToken: string }> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  const email = normalizeAdminEmail(input.email);
  const permissions = input.permissions ?? [];
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return withNeonTransaction(async (client) => {
    // 1. Check if prior pending invite exists for this email and revoke it
    const revokePrior = await client.query<{ id: string }>(
      `UPDATE public.admin_invites
          SET revoked_at = now()
        WHERE lower(email) = $1
          AND accepted_at IS NULL
          AND revoked_at IS NULL
       RETURNING id`,
      [email],
    );

    const isReissue = revokePrior.rows.length > 0;

    // 2. Insert new invite
    const insertRes = await client.query<AdminInviteRow>(
      `INSERT INTO public.admin_invites (
         email,
         role,
         permissions,
         token_hash,
         expires_at,
         created_by
       ) VALUES (
         $1,
         $2,
         $3::text[],
         $4,
         $5,
         $6::uuid
       )
       RETURNING id, email, role, permissions, expires_at, accepted_at, revoked_at, created_by, created_at`,
      [email, input.role, permissions, tokenHash, expiresAt, input.actorUserId || null],
    );

    const row = insertRes.rows[0];
    const invite = mapRow(row);

    // 3. Audit log (never leak rawToken)
    await recordAdminAudit({
      actorUserId: input.actorUserId || null,
      targetUserId: null,
      action: isReissue ? "invite_reissued" : "user_invited",
      details: {
        invite_id: invite.id,
        email: invite.email,
        role: invite.role,
        is_reissue: isReissue,
      },
    });

    return { invite, rawToken };
  });
}

export async function findValidInviteByToken(
  rawToken: string,
): Promise<AdminInvite | null> {
  if (!shouldUseNeonServerDatabase() || !rawToken?.trim()) return null;

  const tokenHash = hashToken(rawToken.trim());

  const result = await neonQuery<AdminInviteRow>(
    `SELECT id, email, role, permissions, expires_at, accepted_at, revoked_at, created_by, created_at
       FROM public.admin_invites
      WHERE token_hash = $1
        AND accepted_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1`,
    [tokenHash],
  );

  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function acceptAdminInvite(input: {
  rawToken: string;
  name: string;
  passwordHash: string;
}): Promise<AdminUser> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  const tokenHash = hashToken(input.rawToken.trim());

  return withNeonTransaction(async (client) => {
    // 1. Lock and validate invite
    const inviteRes = await client.query<AdminInviteRow>(
      `SELECT id, email, role, permissions, expires_at, accepted_at, revoked_at, created_by, created_at
         FROM public.admin_invites
        WHERE token_hash = $1
          AND accepted_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > now()
        FOR UPDATE`,
      [tokenHash],
    );

    const inviteRow = inviteRes.rows[0];
    if (!inviteRow) {
      throw new Error("Convite inválido, expirado ou já utilizado.");
    }

    const email = normalizeAdminEmail(inviteRow.email);

    // 2. Insert or activate admin_user
    const userRes = await client.query<{
      id: string;
      name: string;
      email: string;
      role: string;
      permissions: string[];
      status: string;
      created_at: Date | string;
      updated_at: Date | string;
      last_login_at: Date | string | null;
    }>(
      `INSERT INTO public.admin_users (
         name,
         email,
         role,
         permissions,
         status
       ) VALUES (
         $1,
         $2,
         $3,
         $4::text[],
         'active'
       )
       ON CONFLICT (lower(email)) DO UPDATE
         SET name = EXCLUDED.name,
             role = EXCLUDED.role,
             permissions = EXCLUDED.permissions,
             status = 'active',
             updated_at = now()
       RETURNING id, name, email, role, permissions, status, created_at, updated_at, last_login_at`,
      [input.name.trim(), email, inviteRow.role, inviteRow.permissions],
    );

    const userRow = userRes.rows[0];

    // 3. Insert or update admin_credentials
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
      [userRow.id, input.passwordHash],
    );

    // 4. Mark invite accepted
    await client.query(
      `UPDATE public.admin_invites
          SET accepted_at = now()
        WHERE id = $1::uuid`,
      [inviteRow.id],
    );

    // 5. Audit logs
    await recordAdminAudit({
      actorUserId: userRow.id,
      targetUserId: userRow.id,
      action: "invite_accepted",
      details: { invite_id: inviteRow.id },
    });

    await recordAdminAudit({
      actorUserId: userRow.id,
      targetUserId: userRow.id,
      action: "password_set",
      details: { via: "invite_acceptance" },
    });

    return {
      id: userRow.id,
      name: userRow.name,
      email: normalizeAdminEmail(userRow.email),
      role: userRow.role as AdminUserRole,
      permissions: (userRow.permissions || []) as AdminPermission[],
      status: userRow.status as AdminUser["status"],
      createdAt: asIsoString(userRow.created_at),
      updatedAt: asIsoString(userRow.updated_at),
      lastLoginAt: userRow.last_login_at ? asIsoString(userRow.last_login_at) : null,
    };
  });
}

export async function listPendingAdminInvites(): Promise<AdminInvite[]> {
  if (!shouldUseNeonServerDatabase()) return [];

  const result = await neonQuery<AdminInviteRow>(
    `SELECT id, email, role, permissions, expires_at, accepted_at, revoked_at, created_by, created_at
       FROM public.admin_invites
      WHERE accepted_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
      ORDER BY created_at DESC`,
  );

  return result.rows.map(mapRow);
}

export async function revokeAdminInvite(
  inviteId: string,
  actorUserId?: string,
): Promise<boolean> {
  if (!shouldUseNeonServerDatabase()) return false;

  const result = await neonQuery<AdminInviteRow>(
    `UPDATE public.admin_invites
        SET revoked_at = now()
      WHERE id = $1::uuid
        AND accepted_at IS NULL
        AND revoked_at IS NULL
    RETURNING id, email`,
    [inviteId],
  );

  const row = result.rows[0];
  if (!row) return false;

  await recordAdminAudit({
    actorUserId: actorUserId || null,
    targetUserId: null,
    action: "invite_reissued", // or revoked
    details: { invite_id: row.id, email: row.email, revoked: true },
  });

  return true;
}
