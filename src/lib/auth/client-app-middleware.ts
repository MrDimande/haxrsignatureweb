import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  POST_LOGIN_DASHBOARD,
  POST_LOGIN_ONBOARDING,
} from "@/lib/auth/onboarding-status";

export const CLIENT_SIGN_IN_PATH = "/sign-in";
export const CLIENT_SIGN_UP_PATH = "/sign-up";
export const APP_ROUTE_PREFIX = "/app";
export const CLIENT_DASHBOARD_ALIAS = "/dashboard";
export const STYLE_QUIZ_PATH = "/style-quiz";
export const PUBLIC_POST_AUTH_RETURN_PATHS = [
  "/for-pros",
  "/fornecedores",
] as const;

/** Marketing tools that require a free couple account (Loverly-style gate). */
export const CLIENT_GATED_TOOL_PATHS = [STYLE_QUIZ_PATH] as const;

export function isClientGatedToolPath(pathname: string): boolean {
  return CLIENT_GATED_TOOL_PATHS.some((path) => pathname === path);
}

export function isAppProtectedPath(pathname: string): boolean {
  return pathname === APP_ROUTE_PREFIX || pathname.startsWith(`${APP_ROUTE_PREFIX}/`);
}

export function isClientSignInPath(pathname: string): boolean {
  return pathname === CLIENT_SIGN_IN_PATH;
}

export function isClientSignUpPath(pathname: string): boolean {
  return pathname === CLIENT_SIGN_UP_PATH;
}

export function isClientAuthEntryPath(pathname: string): boolean {
  return isClientSignInPath(pathname) || isClientSignUpPath(pathname);
}

export function buildSignInPath(fromParam: string | null): string {
  if (fromParam && isSafeClientReturnPath(fromParam)) {
    return `${CLIENT_SIGN_IN_PATH}?from=${encodeURIComponent(fromParam)}`;
  }
  return CLIENT_SIGN_IN_PATH;
}

export function buildSignUpPath(fromParam: string | null): string {
  if (fromParam && isSafeClientReturnPath(fromParam)) {
    return `${CLIENT_SIGN_UP_PATH}?from=${encodeURIComponent(fromParam)}`;
  }
  return CLIENT_SIGN_UP_PATH;
}

export function isSafeAppReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  return path === APP_ROUTE_PREFIX || path.startsWith(`${APP_ROUTE_PREFIX}/`);
}

export function isSafeClientReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  return (
    isSafeAppReturnPath(path) ||
    isClientGatedToolPath(path) ||
    PUBLIC_POST_AUTH_RETURN_PATHS.some((allowedPath) => path === allowedPath)
  );
}

export const POST_AUTH_RETURN_STORAGE_KEY = "haxr_post_auth_return";

export function stashPostAuthReturn(path: string | null): void {
  if (typeof window === "undefined" || !path || !isSafeClientReturnPath(path)) return;
  sessionStorage.setItem(POST_AUTH_RETURN_STORAGE_KEY, path);
}

export function readStashedPostAuthReturn(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(POST_AUTH_RETURN_STORAGE_KEY);
  return value && isSafeClientReturnPath(value) ? value : null;
}

export function clearStashedPostAuthReturn(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(POST_AUTH_RETURN_STORAGE_KEY);
}

export function shouldHandleClientAppAuth(pathname: string): boolean {
  return (
    isAppProtectedPath(pathname) ||
    isClientAuthEntryPath(pathname) ||
    isClientGatedToolPath(pathname) ||
    pathname === CLIENT_DASHBOARD_ALIAS
  );
}

export function resolveUnauthenticatedAppRedirect(
  requestUrl: string,
  pathname: string,
): URL {
  const loginUrl = new URL(CLIENT_SIGN_IN_PATH, requestUrl);
  loginUrl.searchParams.set("from", pathname);
  return loginUrl;
}

/**
 * Middleware cannot read onboarding localStorage.
 * Default to dashboard; DashboardPageClient still redirects incomplete onboarding to /onboarding.
 */
export function resolveAuthenticatedSignInRedirect(
  requestUrl: string,
  fromParam: string | null,
): URL {
  if (fromParam && isSafeClientReturnPath(fromParam)) {
    return new URL(fromParam, requestUrl);
  }

  return new URL(POST_LOGIN_DASHBOARD, requestUrl);
}

export function resolvePostLoginRedirectWithReturnPath(
  fromParam: string | null,
  onboardingComplete: boolean,
): string {
  const stashed = readStashedPostAuthReturn();
  const effectiveFrom = fromParam ?? stashed;

  if (effectiveFrom && isSafeClientReturnPath(effectiveFrom)) {
    clearStashedPostAuthReturn();
    return effectiveFrom;
  }

  return onboardingComplete ? POST_LOGIN_DASHBOARD : POST_LOGIN_ONBOARDING;
}

export function copyResponseCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export type ClientAppAuthMiddlewareDecision =
  | { action: "continue"; response: NextResponse }
  | { action: "redirect"; response: NextResponse };

export function evaluateClientAppAuthMiddleware(input: {
  pathname: string;
  requestUrl: string;
  user: User | null;
  sessionResponse: NextResponse;
  fromParam?: string | null;
}): ClientAppAuthMiddlewareDecision {
  const { pathname, requestUrl, user, sessionResponse, fromParam = null } = input;

  if (pathname === CLIENT_DASHBOARD_ALIAS && !user) {
    const redirectUrl = resolveUnauthenticatedAppRedirect(
      requestUrl,
      POST_LOGIN_DASHBOARD,
    );
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(sessionResponse, redirectResponse);
    return { action: "redirect", response: redirectResponse };
  }

  if (pathname === CLIENT_DASHBOARD_ALIAS && user) {
    const redirectResponse = NextResponse.redirect(
      new URL(POST_LOGIN_DASHBOARD, requestUrl),
    );
    copyResponseCookies(sessionResponse, redirectResponse);
    return { action: "redirect", response: redirectResponse };
  }

  if ((isAppProtectedPath(pathname) || isClientGatedToolPath(pathname)) && !user) {
    const redirectUrl = resolveUnauthenticatedAppRedirect(requestUrl, pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(sessionResponse, redirectResponse);
    return { action: "redirect", response: redirectResponse };
  }

  if (isClientAuthEntryPath(pathname) && user) {
    const redirectUrl = resolveAuthenticatedSignInRedirect(requestUrl, fromParam);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(sessionResponse, redirectResponse);
    return { action: "redirect", response: redirectResponse };
  }

  if (isAppProtectedPath(pathname)) {
    sessionResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    sessionResponse.headers.set("X-Frame-Options", "DENY");
    sessionResponse.headers.set("X-Content-Type-Options", "nosniff");
  }

  if (isClientGatedToolPath(pathname) && user) {
    sessionResponse.headers.set("Cache-Control", "private, no-cache");
  }

  return { action: "continue", response: sessionResponse };
}

export function createPassthroughSessionResponse(request: NextRequest): NextResponse {
  return NextResponse.next({ request });
}
