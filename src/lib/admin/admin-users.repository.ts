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
import { neonQuery } from "@/lib/neon/server-db";

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
    `WITH updated AS (
       UPDATE public.admin_users
          SET last_login_at = now()
        WHERE id = $1::uuid
          AND status = 'active'
      RETURNING id
     )
     INSERT INTO public.admin_user_audit_log (actor_user_id, target_user_id, action)
     SELECT id, id, 'login'
       FROM updated`,
    [userId],
  );
}
