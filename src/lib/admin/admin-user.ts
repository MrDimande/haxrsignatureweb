export const ADMIN_USER_ROLES = [
  "OWNER",
  "ADMIN",
  "EVENT_MANAGER",
  "GUEST_MANAGER",
  "CONTENT_EDITOR",
] as const;

export const ADMIN_USER_STATUSES = ["active", "suspended"] as const;

export const ADMIN_SUPER_ADMIN_PERMISSION = "SUPER_ADMIN" as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];
export type AdminPermission = typeof ADMIN_SUPER_ADMIN_PERMISSION;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  permissions: AdminPermission[];
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type AdminIdentity = AdminUser & {
  isPersisted: boolean;
};

export function normalizeAdminEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAdminUserActive(
  user: Pick<AdminUser, "status"> | null | undefined,
): user is Pick<AdminUser, "status"> & { status: "active" } {
  return user?.status === "active";
}

export function isOwner(
  user: Pick<AdminUser, "role" | "status"> | null | undefined,
): boolean {
  return user?.status === "active" && user.role === "OWNER";
}

export function canManageAdminUsers(
  user: Pick<AdminUser, "role" | "status" | "permissions"> | null | undefined,
): boolean {
  return (
    user !== null &&
    user !== undefined &&
    isOwner(user) &&
    user.permissions.includes(ADMIN_SUPER_ADMIN_PERMISSION)
  );
}

export function getAdminInitials(
  user: Pick<AdminUser, "name" | "email"> | null | undefined,
): string {
  const source = user?.name.trim() || user?.email.trim() || "HAXR";
  const initials = source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "H";
}

export function getAdminRoleLabel(role: AdminUserRole | null): string {
  switch (role) {
    case "OWNER":
      return "Proprietário";
    case "ADMIN":
      return "Administrador";
    case "EVENT_MANAGER":
      return "Gestor de Eventos";
    case "GUEST_MANAGER":
      return "Gestor de Convidados";
    case "CONTENT_EDITOR":
      return "Editor de Conteúdo";
    default:
      return "Acesso administrativo";
  }
}

export function getAdminStatusLabel(status: AdminUserStatus): string {
  return status === "active" ? "Activo" : "Suspenso";
}
