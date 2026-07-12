import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  POST_LOGIN_DASHBOARD,
  POST_LOGIN_ONBOARDING,
} from "@/lib/auth/onboarding-status";

export const CLIENT_SIGN_IN_PATH = "/sign-in";
export const APP_ROUTE_PREFIX = "/app";

export function isAppProtectedPath(pathname: string): boolean {
  return pathname === APP_ROUTE_PREFIX || pathname.startsWith(`${APP_ROUTE_PREFIX}/`);
}

export function isClientSignInPath(pathname: string): boolean {
  return pathname === CLIENT_SIGN_IN_PATH;
}

export function isSafeAppReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  return path === APP_ROUTE_PREFIX || path.startsWith(`${APP_ROUTE_PREFIX}/`);
}

export function shouldHandleClientAppAuth(pathname: string): boolean {
  return isAppProtectedPath(pathname) || isClientSignInPath(pathname);
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
  if (fromParam && isSafeAppReturnPath(fromParam)) {
    return new URL(fromParam, requestUrl);
  }

  return new URL(POST_LOGIN_DASHBOARD, requestUrl);
}

export function resolvePostLoginRedirectWithReturnPath(
  fromParam: string | null,
  onboardingComplete: boolean,
): string {
  if (fromParam && isSafeAppReturnPath(fromParam)) {
    return fromParam;
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

  if (isAppProtectedPath(pathname) && !user) {
    const redirectUrl = resolveUnauthenticatedAppRedirect(requestUrl, pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(sessionResponse, redirectResponse);
    return { action: "redirect", response: redirectResponse };
  }

  if (isClientSignInPath(pathname) && user) {
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

  return { action: "continue", response: sessionResponse };
}

export function createPassthroughSessionResponse(request: NextRequest): NextResponse {
  return NextResponse.next({ request });
}
