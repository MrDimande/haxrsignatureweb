import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

export const PORTAL_PASSWORD_MIN_LENGTH = 12;
const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

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
  if (value.length < PORTAL_PASSWORD_MIN_LENGTH) {
    return `Use pelo menos ${PORTAL_PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (value.length > 1024) return "A palavra-passe excede o limite permitido.";
  return null;
}

function deriveScrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAX_MEMORY },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(Buffer.from(derivedKey));
      },
    );
  });
}

/** Node's reviewed, memory-hard scrypt KDF; the encoded result holds no plaintext. */
export async function hashPortalPassword(password: string): Promise<string> {
  const validationError = validatePortalPassword(password);
  if (validationError) throw new Error(validationError);

  const salt = randomBytes(16);
  const digest = await deriveScrypt(password, salt);
  return [
    "scrypt",
    `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`,
    salt.toString("base64url"),
    digest.toString("base64url"),
  ].join("$");
}

export async function verifyPortalPassword(
  password: string,
  encodedHash: string | null | undefined,
): Promise<boolean> {
  if (!encodedHash) return false;
  const [algorithm, parameters, encodedSalt, encodedDigest] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    parameters !== `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}` ||
    !encodedSalt ||
    !encodedDigest
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(encodedDigest, "base64url");
    if (expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = await deriveScrypt(password, Buffer.from(encodedSalt, "base64url"));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
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
