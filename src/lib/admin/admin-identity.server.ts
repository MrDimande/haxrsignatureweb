import "server-only";

import {
  canManageAdminUsers,
  isAdminUserActive,
  normalizeAdminEmail,
  type AdminIdentity,
} from "@/lib/admin/admin-user";
import {
  findAdminUserByEmail,
} from "@/lib/admin/admin-users.repository";

export type AdminIdentityMode = "legacy" | "database";

export class AdminIdentityAccessError extends Error {
  constructor(message = "A identidade administrativa não tem acesso activo.") {
    super(message);
    this.name = "AdminIdentityAccessError";
  }
}

export function getConfiguredAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL;
  return email?.trim() ? normalizeAdminEmail(email) : null;
}

export function getAdminIdentityMode(): AdminIdentityMode {
  return process.env.HAXR_ADMIN_IDENTITY_MODE?.trim().toLowerCase() === "database"
    ? "database"
    : "legacy";
}

export function isDatabaseAdminIdentityEnforced(): boolean {
  return getAdminIdentityMode() === "database";
}

function getLegacyIdentity(email: string): AdminIdentity {
  return {
    id: "",
    name: "",
    email,
    role: "ADMIN",
    permissions: [],
    status: "active",
    createdAt: "",
    updatedAt: "",
    lastLoginAt: null,
    isPersisted: false,
  };
}

export async function getCurrentAdminIdentity(): Promise<AdminIdentity | null> {
  const email = getConfiguredAdminEmail();
  if (!email) return null;

  if (!isDatabaseAdminIdentityEnforced()) return getLegacyIdentity(email);

  const user = await findAdminUserByEmail(email);
  return user ? { ...user, isPersisted: true } : null;
}

export async function requireActiveAdminIdentity(): Promise<AdminIdentity> {
  const identity = await getCurrentAdminIdentity();

  if (
    !identity ||
    (isDatabaseAdminIdentityEnforced() &&
      (!identity.isPersisted || !isAdminUserActive(identity)))
  ) {
    throw new AdminIdentityAccessError();
  }

  return identity;
}

export async function requireOwnerAdminIdentity(): Promise<AdminIdentity> {
  const identity = await getCurrentAdminIdentity();
  if (!identity?.isPersisted || !canManageAdminUsers(identity)) {
    throw new AdminIdentityAccessError("Apenas o proprietário pode gerir utilizadores.");
  }

  return identity;
}
