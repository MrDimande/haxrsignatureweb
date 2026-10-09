import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPortalAuthBaseUrl } from "./portal-env.server";

describe("getPortalAuthBaseUrl", () => {
  const originalEnv = { ...process.env };

  function resetEnv() {
    process.env = { ...originalEnv };
  }

  it("prioritises explicit PORTAL_AUTH_BASE_URL above all other variables", () => {
    resetEnv();
    process.env.PORTAL_AUTH_BASE_URL = "https://custom-portal.haxrsignature.com";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_BRANCH_URL = "preview-branch.vercel.app";
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

  it("resolves to production canonical domain in production when not in preview", () => {
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
