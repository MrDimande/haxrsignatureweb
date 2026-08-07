import { siteUrl } from "@/lib/seo/site-meta";
import { isSafeClientReturnPath } from "@/lib/auth/client-app-middleware";

export const AUTH_CALLBACK_PATH = "/auth/callback";
export const RESET_PASSWORD_PATH = "/reset-password";

export function isSafeAuthCallbackNext(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  if (path === RESET_PASSWORD_PATH || path === "/onboarding") {
    return true;
  }

  return isSafeClientReturnPath(path);
}

export function resolveDefaultAuthCallbackNext(): string {
  return "/app/dashboard";
}

export function sanitizeAuthCallbackNext(nextParam: string | null): string {
  if (nextParam && isSafeAuthCallbackNext(nextParam)) {
    return nextParam;
  }
  return resolveDefaultAuthCallbackNext();
}

export function buildAuthCallbackUrl(input: {
  origin: string;
  next?: string | null;
}): string {
  const next = sanitizeAuthCallbackNext(input.next ?? null);
  const url = new URL(AUTH_CALLBACK_PATH, input.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function buildPasswordResetRedirectUrl(origin?: string): string {
  const base = origin ?? siteUrl;
  return buildAuthCallbackUrl({ origin: base, next: RESET_PASSWORD_PATH });
}
