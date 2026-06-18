import {
    ADMIN_SESSION_COOKIE,
    isAdminConfigured,
    isValidSession,
} from "@/lib/admin/auth";
import {
    isCanonicalHost,
    isPreviewDeployment,
    shouldRedirectToCanonical,
    CANONICAL_SITE_URL,
} from "@/lib/seo/canonical-host";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ADMIN_PATHS = new Set(["/admin"]);

function isPublicAdminApi(pathname: string): boolean {
  return pathname === "/api/admin/login";
}

function isProtectedAdminApi(pathname: string): boolean {
  return pathname.startsWith("/api/admin") && !isPublicAdminApi(pathname);
}

function unauthorizedApiResponse() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/admin", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectToCanonicalHost(request: NextRequest): NextResponse {
  const canonical = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_SITE_URL);
  return NextResponse.redirect(canonical, 308);
}

function applySeoHeaders(response: NextResponse): NextResponse {
  if (isPreviewDeployment()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  if (shouldRedirectToCanonical(host)) {
    return redirectToCanonicalHost(request);
  }

  if (isProtectedAdminApi(pathname)) {
    if (!isAdminConfigured()) {
      return unauthorizedApiResponse();
    }

    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await isValidSession(session))) {
      return unauthorizedApiResponse();
    }

    return applySeoHeaders(NextResponse.next());
  }

  if (!pathname.startsWith("/admin")) {
    const response = NextResponse.next();
    if (!isCanonicalHost(host) || isPreviewDeployment()) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    return response;
  }

  if (!isAdminConfigured()) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      return applySeoHeaders(NextResponse.next());
    }
    return redirectToLogin(request, pathname);
  }

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (await isValidSession(session)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return applySeoHeaders(NextResponse.next());
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return redirectToLogin(request, pathname);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return applySeoHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};
