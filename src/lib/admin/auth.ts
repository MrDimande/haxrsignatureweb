import "server-only";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
import { normalizeAdminEmail, type AdminUser } from "@/lib/admin/admin-user";
import {
  isV2DatabaseSession,
  validateDatabaseSession,
  createAdminSession,
} from "@/lib/admin/admin-sessions.repository";
import {
  getAdminCredentialsByUserId,
  isAccountLocked,
  recordFailedAdminLogin,
  resetFailedAdminLogin,
} from "@/lib/admin/admin-credentials.repository";
import { findAdminUserByEmail, recordAdminLogin } from "@/lib/admin/admin-users.repository";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";
import { verifyPassword } from "@/lib/security/password";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AdminAuthMode = "legacy_environment" | "hybrid" | "database_credentials";

export function getAdminAuthMode(): AdminAuthMode {
  const mode = process.env.HAXR_ADMIN_AUTH_MODE?.trim().toLowerCase();
  if (mode === "database_credentials") return "database_credentials";
  if (mode === "hybrid") return "hybrid";
  return "legacy_environment";
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

export function isAdminConfigured(): boolean {
  const mode = getAdminAuthMode();
  if (mode === "database_credentials") {
    return shouldUseNeonServerDatabase();
  }
  return Boolean(
    process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return bufferToBase64Url(signature);
}

export async function createSessionToken(): Promise<string> {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const email = configuredEmail ? normalizeAdminEmail(configuredEmail) : "";
  const secret = getSessionSecret();

  if (!email || !secret) return "";

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${email}:${exp}`;
  const signature = await signPayload(payload, secret);
  return `${exp}.${signature}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  // 1. Check if token is a versioned database session (v2.*)
  if (isV2DatabaseSession(token)) {
    const result = await validateDatabaseSession(token);
    return result.valid;
  }

  // 2. Token is legacy HMAC format
  const mode = getAdminAuthMode();

  // In database_credentials mode, legacy HMAC sessions are strictly rejected
  if (mode === "database_credentials") {
    return false;
  }

  // Validate HMAC signature
  const secret = getSessionSecret();
  const configuredEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const email = configuredEmail ? normalizeAdminEmail(configuredEmail) : "";
  if (!secret || !email) return false;

  const [expStr, signature] = token.split(".");
  if (!expStr || !signature) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = await signPayload(`${email}:${exp}`, secret);
  const isHmacValid = timingSafeEqual(signature, expected);
  if (!isHmacValid) return false;

  // In hybrid mode: If the legacy user has acquired an active database credential,
  // the legacy HMAC session must be rejected (DOWNGRADE_FALLBACK_BLOCKED)
  if (mode === "hybrid") {
    const user = await findAdminUserByEmail(email);
    if (user) {
      const credentials = await getAdminCredentialsByUserId(user.id);
      if (credentials) {
        // User has a database credential: legacy session is revoked/rejected
        return false;
      }
    }
  }

  return true;
}

export type AdminLoginResult =
  | { success: true; sessionToken: string; user: AdminUser }
  | { success: false; error: string; status: number };

export async function authenticateAdminUser(
  emailInput: string,
  passwordInput: string,
  metadata?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<AdminLoginResult> {
  const mode = getAdminAuthMode();
  const email = normalizeAdminEmail(emailInput);
  const password = passwordInput;

  if (!email || !password) {
    return { success: false, error: "Credenciais inválidas.", status: 401 };
  }

  // Mode: database_credentials or hybrid
  if (mode === "database_credentials" || mode === "hybrid") {
    const user = await findAdminUserByEmail(email);

    if (user) {
      const credentials = await getAdminCredentialsByUserId(user.id);

      // If user has a database credential row:
      if (credentials) {
        // 1. Check account suspension
        if (user.status !== "active") {
          await recordAdminAudit({
            targetUserId: user.id,
            action: "login_failed",
            details: { reason: "user_suspended" },
          });
          return { success: false, error: "Acesso administrativo suspenso.", status: 403 };
        }

        // 2. Check temporary lockout
        if (isAccountLocked(credentials)) {
          await recordAdminAudit({
            targetUserId: user.id,
            action: "login_failed",
            details: { reason: "account_locked" },
          });
          return {
            success: false,
            error: "Conta temporariamente bloqueada por excesso de tentativas. Tente mais tarde.",
            status: 423,
          };
        }

        // 3. Verify password with scrypt
        const passwordMatches = await verifyPassword(password, credentials.passwordHash);

        if (!passwordMatches) {
          // CRITICAL INVARIANT: NEVER fallback to ADMIN_PASSWORD!
          const { lockedUntil } = await recordFailedAdminLogin(user.id);
          await recordAdminAudit({
            targetUserId: user.id,
            action: "login_failed",
            details: { reason: "wrong_password", locked_until: lockedUntil },
          });
          return { success: false, error: "Credenciais inválidas.", status: 401 };
        }

        // 4. Password matches: reset failed login count
        await resetFailedAdminLogin(user.id);
        await recordAdminLogin(user.id);

        // 5. Create versioned database session
        const { token } = await createAdminSession(user.id, metadata);

        return { success: true, sessionToken: token, user };
      }

      // User exists in database but has NO database credential yet
      // In database_credentials mode: fails because a database credential is required
      if (mode === "database_credentials") {
        await recordAdminAudit({
          targetUserId: user.id,
          action: "login_failed",
          details: { reason: "no_database_credential" },
        });
        return { success: false, error: "Credenciais inválidas.", status: 401 };
      }
    } else {
      // Unknown email: safe failure, no user enumeration
      await recordAdminAudit({
        targetUserId: null,
        action: "login_failed",
        details: { reason: "unknown_email" },
      });

      if (mode === "database_credentials") {
        return { success: false, error: "Credenciais inválidas.", status: 401 };
      }
    }

    // Hybrid mode fallback: only allowed if user has NO database credentials
    // and credentials match legacy environment ADMIN_EMAIL and ADMIN_PASSWORD
    if (mode === "hybrid") {
      const configuredEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
      const adminEmail = configuredEmail ? normalizeAdminEmail(configuredEmail) : "";
      const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

      const matchesLegacy =
        timingSafeEqual(email, adminEmail) &&
        timingSafeEqual(password, adminPassword);

      if (matchesLegacy) {
        // If matched legacy environment, create legacy HMAC session or database session if persisted
        const targetUser = user || {
          id: "",
          name: "Alberto Dimande",
          email: adminEmail,
          role: "OWNER",
          permissions: ["SUPER_ADMIN"],
          status: "active",
          createdAt: "",
          updatedAt: "",
          lastLoginAt: null,
        } as AdminUser;

        const legacyToken = await createSessionToken();
        if (targetUser.id) {
          await recordAdminLogin(targetUser.id);
        }

        return { success: true, sessionToken: legacyToken, user: targetUser };
      }

      return { success: false, error: "Credenciais inválidas.", status: 401 };
    }
  }

  // Mode: legacy_environment
  const configuredEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const adminEmail = configuredEmail ? normalizeAdminEmail(configuredEmail) : "";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

  const isLegacyValid =
    timingSafeEqual(email, adminEmail) &&
    timingSafeEqual(password, adminPassword);

  if (!isLegacyValid) {
    return { success: false, error: "Credenciais inválidas.", status: 401 };
  }

  const legacyUser = (await findAdminUserByEmail(email)) || {
    id: "",
    name: "Alberto Dimande",
    email: adminEmail,
    role: "OWNER",
    permissions: ["SUPER_ADMIN"],
    status: "active",
    createdAt: "",
    updatedAt: "",
    lastLoginAt: null,
  } as AdminUser;

  if (legacyUser.id) {
    await recordAdminLogin(legacyUser.id);
  }

  const legacySessionToken = await createSessionToken();
  return { success: true, sessionToken: legacySessionToken, user: legacyUser };
}

export function validateCredentials(email: string, password: string): boolean {
  if (!isAdminConfigured()) return false;

  const configuredEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const adminEmail = configuredEmail ? normalizeAdminEmail(configuredEmail) : "";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

  return (
    timingSafeEqual(normalizeAdminEmail(email), adminEmail) &&
    timingSafeEqual(password, adminPassword)
  );
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}

export { ADMIN_SESSION_COOKIE };
