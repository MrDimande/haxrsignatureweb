import { randomBytes, createHash } from "node:crypto";
import {
  PASSWORD_MIN_LENGTH,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/security/password";

export const PORTAL_PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH;

export type PortalAccountStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "PENDING_IDENTITY_RESOLUTION";

export function normalizePortalEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validatePortalPassword(value: string): string | null {
  return validatePassword(value);
}

/** Node's reviewed, memory-hard scrypt KDF; the encoded result holds no plaintext. */
export async function hashPortalPassword(password: string): Promise<string> {
  return hashPassword(password);
}

export async function verifyPortalPassword(
  password: string,
  encodedHash: string | null | undefined,
): Promise<boolean> {
  return verifyPassword(password, encodedHash);
}

export function createPortalSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 is only for high-entropy opaque secrets, never user passwords. */
export function hashPortalSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function createPortalCookieValue(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}

export function parsePortalCookieValue(value: string | undefined): {
  sessionId: string;
  secret: string;
} | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator <= 0 || separator === value.length - 1) return null;
  const sessionId = value.slice(0, separator);
  const secret = value.slice(separator + 1);
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(sessionId)) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  return { sessionId, secret };
}

export type PortalLoginDecision =
  | { kind: "authenticated" }
  | { kind: "activation_required" }
  | { kind: "denied" };

export function decidePortalLogin(input: {
  account: { status: PortalAccountStatus; password_hash: string | null } | null;
  passwordMatches: boolean;
}): PortalLoginDecision {
  if (!input.account || !input.passwordMatches) return { kind: "denied" };
  if (input.account.status === "PENDING_ACTIVATION") {
    return { kind: "activation_required" };
  }
  if (input.account.status !== "ACTIVE") return { kind: "denied" };
  return { kind: "authenticated" };
}
