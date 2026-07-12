/** Protecções partilhadas para formulários públicos */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const recentByEmail = new Map<string, number[]>();

export function isHoneypotFilled(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

export function isRateLimited(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (recentByEmail.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= RATE_LIMIT_MAX) {
    return true;
  }

  hits.push(now);
  recentByEmail.set(key, hits);
  return false;
}

export function publicFormSuccess(message: string) {
  return { success: true as const, message };
}

export function publicFormError(message: string, status = 400) {
  return { error: message, status };
}
