import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

export function isAdminConfigured(): boolean {
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
  const email = process.env.ADMIN_EMAIL?.trim() ?? "";
  const secret = getSessionSecret();

  if (!email || !secret) return "";

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${email}:${exp}`;
  const signature = await signPayload(payload, secret);
  return `${exp}.${signature}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !isAdminConfigured()) return false;

  const secret = getSessionSecret();
  const email = process.env.ADMIN_EMAIL?.trim() ?? "";
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

export function validateCredentials(email: string, password: string): boolean {
  if (!isAdminConfigured()) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

  return email === adminEmail && password === adminPassword;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}

export { ADMIN_SESSION_COOKIE };
