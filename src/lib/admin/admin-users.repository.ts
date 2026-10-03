import "server-only";

import {
  ADMIN_SUPER_ADMIN_PERMISSION,
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  normalizeAdminEmail,
  type AdminPermission,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatus,
} from "@/lib/admin/admin-user";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
};

const adminUserColumns = `
  id,
  name,
  email,
  role,
  permissions,
  status,
  created_at,
  updated_at,
  last_login_at`;

function isAdminUserRole(value: string): value is AdminUserRole {
  return (ADMIN_USER_ROLES as readonly string[]).includes(value);
}

function isAdminUserStatus(value: string): value is AdminUserStatus {
  return (ADMIN_USER_STATUSES as readonly string[]).includes(value);
}

function asIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapPermissions(values: string[] | null | undefined): AdminPermission[] {
  return values?.filter(
    (value): value is AdminPermission => value === ADMIN_SUPER_ADMIN_PERMISSION,
  ) ?? [];
}

function mapAdminUser(row: AdminUserRow): AdminUser {
  if (!isAdminUserRole(row.role) || !isAdminUserStatus(row.status)) {
    throw new Error("O registo de utilizador administrativo contém um papel ou estado inválido.");
  }

  return {
    id: row.id,
    name: row.name,
    email: normalizeAdminEmail(row.email),
    role: row.role,
    permissions: mapPermissions(row.permissions),
    status: row.status,
    createdAt: asIsoString(row.created_at),
    updatedAt: asIsoString(row.updated_at),
    lastLoginAt: row.last_login_at ? asIsoString(row.last_login_at) : null,
  };
}

export function isMissingAdminUsersTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42P01"
  );
}

export async function findAdminUserById(id: string): Promise<AdminUser | null> {
  if (!shouldUseNeonServerDatabase() || !id?.trim()) return null;

  const result = await neonQuery<AdminUserRow>(
    `SELECT ${adminUserColumns}
       FROM public.admin_users
      WHERE id = $1::uuid
      LIMIT 1`,
    [id.trim()],
  );

  const row = result.rows[0];
  return row ? mapAdminUser(row) : null;
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  if (!shouldUseNeonServerDatabase()) return null;

  const result = await neonQuery<AdminUserRow>(
    `SELECT ${adminUserColumns}
       FROM public.admin_users
      WHERE lower(email) = $1
      LIMIT 1`,
    [normalizeAdminEmail(email)],
  );

  const row = result.rows[0];
  return row ? mapAdminUser(row) : null;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("O directório administrativo requer a ligação Neon configurada.");
  }

  const result = await neonQuery<AdminUserRow>(
    `SELECT ${adminUserColumns}
       FROM public.admin_users
      ORDER BY CASE role WHEN 'OWNER' THEN 0 ELSE 1 END, name ASC, email ASC`,
  );

  return result.rows.map(mapAdminUser);
}

export async function recordAdminLogin(userId: string): Promise<void> {
  if (!shouldUseNeonServerDatabase()) return;

  await neonQuery(
    `UPDATE public.admin_users
        SET last_login_at = now()
      WHERE id = $1::uuid
        AND status = 'active'`,
    [userId],
  );

  await recordAdminAudit({
    actorUserId: userId,
    targetUserId: userId,
    action: "login_success",
    details: { auth_mode: "database" },
  });
}

/**
 * Transactionally updates an administrative user's role and/or status.
 * Hard Invariant: ACTIVE_OWNER_COUNT >= 1.
 * Locks active OWNER rows with FOR UPDATE to prevent race conditions during concurrent mutations.
 */
export async function updateAdminUserRoleAndStatus(input: {
  targetUserId: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  permissions?: AdminPermission[];
  actorUserId: string;
}): Promise<AdminUser> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("Neon database required.");
  }

  return withNeonTransaction(async (client) => {
    // 1. Transactionally lock all currently active OWNER rows
    const ownersRes = await client.query<{ id: string; role: string; status: string }>(
      `SELECT id, role, status
         FROM public.admin_users
        WHERE role = 'OWNER' AND status = 'active'
        FOR UPDATE`,
    );

    const activeOwners = ownersRes.rows;

    // 2. Fetch target user
    const targetRes = await client.query<AdminUserRow>(
      `SELECT ${adminUserColumns}
         FROM public.admin_users
        WHERE id = $1::uuid
        FOR UPDATE`,
      [input.targetUserId],
    );

    const targetRow = targetRes.rows[0];
    if (!targetRow) {
      throw new Error("Utilizador não encontrado.");
    }

    const currentTarget = mapAdminUser(targetRow);
    const isTargetActiveOwner = currentTarget.role === "OWNER" && currentTarget.status === "active";

    const nextRole = input.role ?? currentTarget.role;
    const nextStatus = input.status ?? currentTarget.status;

    // Conformance with admin_users_owner_super_admin constraint:
    // role = OWNER must have permissions @> ['SUPER_ADMIN']
    // role != OWNER must not have SUPER_ADMIN
    let nextPermissions: AdminPermission[] = input.permissions ?? currentTarget.permissions;
    if (nextRole === "OWNER") {
      if (!nextPermissions.includes(ADMIN_SUPER_ADMIN_PERMISSION)) {
        nextPermissions = [ADMIN_SUPER_ADMIN_PERMISSION];
      }
    } else {
      nextPermissions = nextPermissions.filter((p) => p !== ADMIN_SUPER_ADMIN_PERMISSION);
    }

    // 3. OWNER Protection Invariant:
    // If target was an active OWNER and is being demoted or suspended:
    const losingActiveOwnerStatus =
      isTargetActiveOwner && (nextRole !== "OWNER" || nextStatus !== "active");

    if (losingActiveOwnerStatus && activeOwners.length <= 1) {
      throw new Error(
        "Não é permitido suspender ou despromover o único Proprietário activo do sistema.",
      );
    }

    // 4. Update row
    const updateRes = await client.query<AdminUserRow>(
      `UPDATE public.admin_users
          SET role = $2,
              status = $3,
              permissions = $4::text[],
              updated_at = now()
        WHERE id = $1::uuid
        RETURNING ${adminUserColumns}`,
      [input.targetUserId, nextRole, nextStatus, nextPermissions],
    );

    const updatedUser = mapAdminUser(updateRes.rows[0]);

    // 5. Audit logs for each changed property
    if (currentTarget.role !== updatedUser.role) {
      await recordAdminAudit({
        actorUserId: input.actorUserId,
        targetUserId: updatedUser.id,
        action: "role_changed",
        details: { previous_role: currentTarget.role, new_role: updatedUser.role },
      });
    }

    if (currentTarget.status !== updatedUser.status) {
      await recordAdminAudit({
        actorUserId: input.actorUserId,
        targetUserId: updatedUser.id,
        action: updatedUser.status === "active" ? "user_reactivated" : "user_suspended",
        details: { previous_status: currentTarget.status, new_status: updatedUser.status },
      });

      // If user was suspended, revoke all active sessions immediately
      if (updatedUser.status === "suspended") {
        await client.query(
          `UPDATE public.admin_sessions SET revoked_at = now() WHERE admin_user_id = $1::uuid AND revoked_at IS NULL`,
          [updatedUser.id],
        );
      }
    }

    return updatedUser;
  });
}
