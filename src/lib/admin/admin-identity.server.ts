import "server-only";

import { cookies } from "next/headers";
import {
  canManageAdminUsers,
  isAdminUserActive,
  normalizeAdminEmail,
  type AdminIdentity,
} from "@/lib/admin/admin-user";
import {
  findAdminUserByEmail,
} from "@/lib/admin/admin-users.repository";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuthMode,
  isValidSession,
} from "@/lib/admin/auth";
import {
  isV2DatabaseSession,
  validateDatabaseSession,
} from "@/lib/admin/admin-sessions.repository";

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
    name: "Alberto Dimande",
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
  let sessionToken: string | undefined;

  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  } catch {
    // Outside Next.js request context (e.g. isolated unit tests)
  }

  // 1. Check versioned per-user database session (v2.*)
  if (isV2DatabaseSession(sessionToken)) {
    const result = await validateDatabaseSession(sessionToken);
    if (result.valid && result.user) {
      return { ...result.user, isPersisted: true };
    }
    return null;
  }

  // 2. Legacy HMAC fallback handling
  const authMode = getAdminAuthMode();
  if (authMode === "database_credentials") {
    // Legacy sessions strictly rejected in database_credentials mode
    return null;
  }

  if (sessionToken) {
    const legacyValid = await isValidSession(sessionToken);
    if (!legacyValid) return null;
  }

  const email = getConfiguredAdminEmail();
  if (!email) return null;

  if (!isDatabaseAdminIdentityEnforced()) {
    return getLegacyIdentity(email);
  }

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
