import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isAdminConfigured,
  isValidSession,
} from "@/lib/admin/auth";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedAdminApi(pathname)) {
    if (!isAdminConfigured()) {
      return unauthorizedApiResponse();
    }

    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await isValidSession(session))) {
      return unauthorizedApiResponse();
    }

    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!isAdminConfigured()) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      return NextResponse.next();
    }
    return redirectToLogin(request, pathname);
  }

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (await isValidSession(session)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return redirectToLogin(request, pathname);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
