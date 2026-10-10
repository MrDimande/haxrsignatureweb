import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPortalAuthBaseUrl } from "./portal-env.server";

describe("getPortalAuthBaseUrl", () => {
  const originalEnv = { ...process.env };

  function resetEnv() {
    process.env = { ...originalEnv };
  }

  it("preserves isolated preview origin when VERCEL_ENV is preview even if PORTAL_AUTH_BASE_URL is set", () => {
    resetEnv();
    process.env.PORTAL_AUTH_BASE_URL = "https://production-portal.haxrsignature.com";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_BRANCH_URL = "preview-branch.vercel.app";
    process.env.NEXT_PUBLIC_SITE_URL = "https://haxrsignature.com";

    assert.equal(getPortalAuthBaseUrl(), "https://preview-branch.vercel.app");
    resetEnv();
  });

  it("prioritises PORTAL_AUTH_BASE_URL over NEXT_PUBLIC_SITE_URL in production", () => {
    resetEnv();
    process.env.PORTAL_AUTH_BASE_URL = "https://custom-portal.haxrsignature.com";
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://haxrsignature.com";

    assert.equal(getPortalAuthBaseUrl(), "https://custom-portal.haxrsignature.com");
    resetEnv();
  });

  it("resolves isolated preview origin when VERCEL_ENV is preview", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_BRANCH_URL = "haxrsignatureweb-preview-branch.vercel.app";
    process.env.NEXT_PUBLIC_SITE_URL = "https://haxrsignature.com";

    assert.equal(getPortalAuthBaseUrl(), "https://haxrsignatureweb-preview-branch.vercel.app");
    resetEnv();
  });

  it("resolves to VERCEL_URL in preview if VERCEL_BRANCH_URL is missing", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    delete process.env.VERCEL_BRANCH_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "haxrsignatureweb-dpl123.vercel.app";

    assert.equal(getPortalAuthBaseUrl(), "https://haxrsignatureweb-dpl123.vercel.app");
    resetEnv();
  });

  it("throws explicit error in preview when neither VERCEL_BRANCH_URL nor VERCEL_URL is provided", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.NEXT_PUBLIC_SITE_URL = "https://haxrsignature.com";

    assert.throws(
      () => getPortalAuthBaseUrl(),
      /portal_auth_preview_url_missing/,
    );
    resetEnv();
  });

  it("resolves to configured domain in production when not in preview", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://haxrsignature.com";

    assert.equal(getPortalAuthBaseUrl(), "https://haxrsignature.com");
    resetEnv();
  });

  it("throws explicit error in production when neither PORTAL_AUTH_BASE_URL nor NEXT_PUBLIC_SITE_URL is provided", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    assert.throws(
      () => getPortalAuthBaseUrl(),
      /portal_auth_base_url_missing_in_production/,
    );
    resetEnv();
  });

  it("resolves to http://localhost:3000 in local development if nothing configured", () => {
    resetEnv();
    delete process.env.PORTAL_AUTH_BASE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    assert.equal(getPortalAuthBaseUrl(), "http://localhost:3000");
    resetEnv();
  });
});
