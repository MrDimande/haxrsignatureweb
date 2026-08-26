const NEON_VERIFY_EMAIL_KEY = "haxr_neon_verify_email";
const NEON_PASSWORD_RESET_EMAIL_KEY = "haxr_neon_password_reset_email";

function writeSessionValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, value.trim());
}

function readSessionValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(key)?.trim();
  return value || null;
}

function clearSessionValue(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

export function stashPendingNeonEmailVerification(email: string): void {
  writeSessionValue(NEON_VERIFY_EMAIL_KEY, email);
}

export function readPendingNeonEmailVerification(): string | null {
  return readSessionValue(NEON_VERIFY_EMAIL_KEY);
}

export function clearPendingNeonEmailVerification(): void {
  clearSessionValue(NEON_VERIFY_EMAIL_KEY);
}

export function stashPendingNeonPasswordReset(email: string): void {
  writeSessionValue(NEON_PASSWORD_RESET_EMAIL_KEY, email);
}

export function readPendingNeonPasswordReset(): string | null {
  return readSessionValue(NEON_PASSWORD_RESET_EMAIL_KEY);
}

export function clearPendingNeonPasswordReset(): void {
  clearSessionValue(NEON_PASSWORD_RESET_EMAIL_KEY);
}
