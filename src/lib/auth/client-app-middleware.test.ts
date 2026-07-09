import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest, NextResponse } from "next/server";
import {
  evaluateClientAppAuthMiddleware,
  isAppProtectedPath,
  isClientSignInPath,
  isSafeAppReturnPath,
  resolveAuthenticatedSignInRedirect,
  resolvePostLoginRedirectWithReturnPath,
  resolveUnauthenticatedAppRedirect,
  shouldHandleClientAppAuth,
} from "./client-app-middleware";

const BASE_URL = "http://localhost:3000";

function mockUser() {
  return { id: "user-1", email: "staging-a@haxrsignature.test" } as const;
}

function sessionResponse(request: NextRequest): NextResponse {
  const response = NextResponse.next({ request });
  response.cookies.set("sb-session", "refresh-token");
  return response;
}

describe("client-app-middleware", () => {
  it("isAppProtectedPath matches /app routes only", () => {
    assert.equal(isAppProtectedPath("/app/dashboard"), true);
    assert.equal(isAppProtectedPath("/app"), true);
    assert.equal(isAppProtectedPath("/admin/dashboard"), false);
    assert.equal(isAppProtectedPath("/onboarding"), false);
    assert.equal(isAppProtectedPath("/"), false);
  });

  it("isClientSignInPath matches /sign-in only", () => {
    assert.equal(isClientSignInPath("/sign-in"), true);
    assert.equal(isClientSignInPath("/signin"), false);
  });

  it("shouldHandleClientAppAuth covers app and sign-in routes", () => {
    assert.equal(shouldHandleClientAppAuth("/app/dashboard"), true);
    assert.equal(shouldHandleClientAppAuth("/sign-in"), true);
    assert.equal(shouldHandleClientAppAuth("/"), false);
    assert.equal(shouldHandleClientAppAuth("/tools/guest-list"), false);
  });

  it("resolveUnauthenticatedAppRedirect sends /app/dashboard to sign-in with from", () => {
    const url = resolveUnauthenticatedAppRedirect(BASE_URL, "/app/dashboard");
    assert.equal(url.pathname, "/sign-in");
    assert.equal(url.searchParams.get("from"), "/app/dashboard");
  });

  it("evaluateClientAppAuthMiddleware redirects unauthenticated /app/dashboard", () => {
    const request = new NextRequest(`${BASE_URL}/app/dashboard`);
    const decision = evaluateClientAppAuthMiddleware({
      pathname: "/app/dashboard",
      requestUrl: request.url,
      user: null,
      sessionResponse: sessionResponse(request),
    });

    assert.equal(decision.action, "redirect");
    assert.equal(decision.response.headers.get("location"), `${BASE_URL}/sign-in?from=%2Fapp%2Fdashboard`);
  });

  it("evaluateClientAppAuthMiddleware allows authenticated /app/dashboard", () => {
    const request = new NextRequest(`${BASE_URL}/app/dashboard`);
    const decision = evaluateClientAppAuthMiddleware({
      pathname: "/app/dashboard",
      requestUrl: request.url,
      user: mockUser(),
      sessionResponse: sessionResponse(request),
    });

    assert.equal(decision.action, "continue");
    assert.equal(
      decision.response.headers.get("Cache-Control"),
      "no-store, no-cache, must-revalidate",
    );
  });

  it("evaluateClientAppAuthMiddleware redirects authenticated /sign-in to dashboard", () => {
    const request = new NextRequest(`${BASE_URL}/sign-in`);
    const decision = evaluateClientAppAuthMiddleware({
      pathname: "/sign-in",
      requestUrl: request.url,
      user: mockUser(),
      sessionResponse: sessionResponse(request),
    });

    assert.equal(decision.action, "redirect");
    assert.equal(decision.response.headers.get("location"), `${BASE_URL}/app/dashboard`);
  });

  it("evaluateClientAppAuthMiddleware allows unauthenticated /sign-in", () => {
    const request = new NextRequest(`${BASE_URL}/sign-in`);
    const decision = evaluateClientAppAuthMiddleware({
      pathname: "/sign-in",
      requestUrl: request.url,
      user: null,
      sessionResponse: sessionResponse(request),
    });

    assert.equal(decision.action, "continue");
  });

  it("resolveAuthenticatedSignInRedirect honours safe from param", () => {
    const url = resolveAuthenticatedSignInRedirect(BASE_URL, "/app/settings");
    assert.equal(url.pathname, "/app/settings");
  });

  it("resolveAuthenticatedSignInRedirect rejects unsafe from paths", () => {
    const url = resolveAuthenticatedSignInRedirect(BASE_URL, "//evil.test");
    assert.equal(url.pathname, "/app/dashboard");
  });

  it("resolvePostLoginRedirectWithReturnPath prefers safe from over onboarding state", () => {
    assert.equal(
      resolvePostLoginRedirectWithReturnPath("/app/events", false),
      "/app/events",
    );
  });

  it("resolvePostLoginRedirectWithReturnPath falls back to onboarding when incomplete", () => {
    assert.equal(resolvePostLoginRedirectWithReturnPath(null, false), "/onboarding");
  });

  it("isSafeAppReturnPath blocks open redirects", () => {
    assert.equal(isSafeAppReturnPath("/app/dashboard"), true);
    assert.equal(isSafeAppReturnPath("//evil.test"), false);
    assert.equal(isSafeAppReturnPath("https://evil.test"), false);
  });
});