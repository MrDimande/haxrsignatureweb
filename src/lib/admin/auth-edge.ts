import { normalizeAdminEmail } from "@/lib/admin/admin-user";

export const ADMIN_SESSION_COOKIE = "haxr_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function isAdminConfigured(): boolean {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const dbUrl = process.env.DATABASE_URL?.trim();

  // In database mode, database URL is also sufficient
  return Boolean((email && password && secret) || dbUrl);
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
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
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return bufferToBase64Url(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Lightweight edge-compatible session validation for middleware.
 * Full per-user database validation and downgrade checks occur server-side
 * inside enforceAdminAuth() / requireActiveAdminIdentity().
 */
export async function isValidEdgeSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  // 1. Versioned database session check (v2.<sessionId>.<secret>)
  if (token.startsWith("v2.")) {
    const parts = token.split(".");
    if (parts.length === 3 && parts[1] && parts[2]) {
      // Valid v2 structure present: allow middleware to proceed to full server validation
      return true;
    }
    return false;
  }

  // 2. Legacy stateless HMAC cookie ({exp}.{signature})
  const mode = process.env.HAXR_ADMIN_AUTH_MODE?.trim().toLowerCase();
  if (mode === "database_credentials") {
    // Legacy HMAC sessions rejected in database_credentials mode
    return false;
  }

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
  return timingSafeEqual(signature, expected);
}
