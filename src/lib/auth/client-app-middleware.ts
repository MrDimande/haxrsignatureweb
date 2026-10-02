import { NextResponse, type NextRequest } from "next/server";
import { POST_LOGIN_DASHBOARD, POST_LOGIN_ONBOARDING } from "@/lib/auth/onboarding-status";
import { PORTAL_SESSION_COOKIE } from "@/lib/portal-auth/cookie-name";

export const CLIENT_SIGN_IN_PATH = "/sign-in";
export const CLIENT_SIGN_UP_PATH = "/sign-up";
export const APP_ROUTE_PREFIX = "/app";
export const CLIENT_DASHBOARD_ALIAS = "/dashboard";
export const STYLE_QUIZ_PATH = "/style-quiz";
export const PUBLIC_POST_AUTH_RETURN_PATHS = ["/for-pros", "/fornecedores"] as const;
export const CLIENT_GATED_TOOL_PATHS = [STYLE_QUIZ_PATH] as const;
export const POST_AUTH_RETURN_STORAGE_KEY = "haxr_post_auth_return";

export function isClientGatedToolPath(pathname: string): boolean { return CLIENT_GATED_TOOL_PATHS.some((path) => pathname === path); }
export function isAppProtectedPath(pathname: string): boolean { return pathname === APP_ROUTE_PREFIX || pathname.startsWith(`${APP_ROUTE_PREFIX}/`); }
export function isClientSignInPath(pathname: string): boolean { return pathname === CLIENT_SIGN_IN_PATH; }
export function isClientSignUpPath(pathname: string): boolean { return pathname === CLIENT_SIGN_UP_PATH; }
export function isClientAuthEntryPath(pathname: string): boolean { return isClientSignInPath(pathname) || isClientSignUpPath(pathname); }

export function isSafeAppReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && (path === APP_ROUTE_PREFIX || path.startsWith(`${APP_ROUTE_PREFIX}/`));
}

export function isSafeClientReturnPath(path: string): boolean {
  return isSafeAppReturnPath(path) || isClientGatedToolPath(path) || PUBLIC_POST_AUTH_RETURN_PATHS.some((allowed) => path === allowed);
}

export function buildSignInPath(fromParam: string | null): string { return fromParam && isSafeClientReturnPath(fromParam) ? `${CLIENT_SIGN_IN_PATH}?from=${encodeURIComponent(fromParam)}` : CLIENT_SIGN_IN_PATH; }
export function buildSignUpPath(fromParam: string | null): string { return fromParam && isSafeClientReturnPath(fromParam) ? `${CLIENT_SIGN_UP_PATH}?from=${encodeURIComponent(fromParam)}` : CLIENT_SIGN_UP_PATH; }

export function stashPostAuthReturn(path: string | null): void {
  if (typeof window !== "undefined" && path && isSafeClientReturnPath(path)) sessionStorage.setItem(POST_AUTH_RETURN_STORAGE_KEY, path);
}

export function readStashedPostAuthReturn(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(POST_AUTH_RETURN_STORAGE_KEY);
  return value && isSafeClientReturnPath(value) ? value : null;
}

export function clearStashedPostAuthReturn(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(POST_AUTH_RETURN_STORAGE_KEY);
}

export function resolvePostLoginRedirectWithReturnPath(fromParam: string | null, onboardingComplete: boolean): string {
  const stored = readStashedPostAuthReturn();
  const path = fromParam ?? stored;
  if (path && isSafeClientReturnPath(path)) {
    clearStashedPostAuthReturn();
    return path;
  }
  return onboardingComplete ? POST_LOGIN_DASHBOARD : POST_LOGIN_ONBOARDING;
}

export function shouldHandleClientAppAuth(pathname: string): boolean { return isAppProtectedPath(pathname) || isClientAuthEntryPath(pathname) || isClientGatedToolPath(pathname) || pathname === CLIENT_DASHBOARD_ALIAS; }

/** This only rejects a missing cookie. Server layouts and route handlers validate it against PostgreSQL. */
export function evaluateClientAppRequest(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname === CLIENT_DASHBOARD_ALIAS) return NextResponse.redirect(new URL(POST_LOGIN_DASHBOARD, request.url));
  if ((isAppProtectedPath(pathname) || isClientGatedToolPath(pathname)) && !request.cookies.get(PORTAL_SESSION_COOKIE)?.value) {
    const target = new URL(CLIENT_SIGN_IN_PATH, request.url);
    target.searchParams.set("from", pathname);
    return NextResponse.redirect(target);
  }
  return null;
}
