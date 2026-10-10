import assert from "node:assert/strict";
import test from "node:test";
import { NextResponse } from "next/server";
import { persistentRateLimit, type PersistentRateLimitOptions } from "@/lib/security/persistent-rate-limit";
import type { RateLimitConfig, RateLimitResult } from "@/lib/security/rate-limit";
import {
  createPortalActivateHandler,
  createPortalLoginHandler,
  createPortalRegisterHandler,
  createPortalResendActivationHandler,
} from "./public-auth-routes.server";

async function databaseFailureRateLimit(
  key: string,
  config: RateLimitConfig,
  options?: PersistentRateLimitOptions,
): Promise<RateLimitResult> {
  const fail = async () => {
    throw new Error("simulated_rate_limit_database_failure");
  };
  return persistentRateLimit(key, config, {
    ...options,
    dependencies: { invokeNeon: fail, queryNeonState: fail },
  });
}

test("all public auth routes fail closed when their persistent rate-limit database is unavailable", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const scenarios = [
      {
        handler: createPortalRegisterHandler({ rateLimit: databaseFailureRateLimit }),
        request: new Request("https://preview.example.test/api/portal-auth/register", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "198.51.100.8" },
          body: JSON.stringify({ fullName: "Test Client", email: "client@example.test", termsAccepted: true }),
        }),
      },
      {
        handler: createPortalResendActivationHandler({ rateLimit: databaseFailureRateLimit }),
        request: new Request("https://preview.example.test/api/portal-auth/resend-activation", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "198.51.100.8" },
          body: JSON.stringify({ email: "client@example.test" }),
        }),
      },
      {
        handler: createPortalActivateHandler({ rateLimit: databaseFailureRateLimit }),
        request: new Request("https://preview.example.test/api/portal-auth/activate", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "198.51.100.8" },
          body: JSON.stringify({ token: "x".repeat(43), password: "ValidPassword2026!" }),
        }),
      },
      {
        handler: createPortalLoginHandler({ rateLimit: databaseFailureRateLimit }),
        request: new Request("https://preview.example.test/api/portal-auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", "x-real-ip": "198.51.100.8" },
          body: JSON.stringify({ email: "client@example.test", password: "ValidPassword2026!" }),
        }),
      },
    ];

    for (const scenario of scenarios) {
      const response = await scenario.handler(scenario.request);
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("retry-after"), "900");
    }
  } finally {
    console.warn = originalWarn;
  }
});

test("login increments both buckets only after a rejected credential check", async () => {
  const calls: Array<{ key: string; increment: boolean | undefined }> = [];
  const rateLimit = async (key: string, _config: RateLimitConfig, options?: PersistentRateLimitOptions) => {
    calls.push({ key, increment: options?.increment });
    return { allowed: true, remaining: 4, retryAfterSeconds: 0 };
  };
  const handler = createPortalLoginHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: () => "h".repeat(64),
    rateLimit,
    createLoginResponse: async () => ({
      kind: "authenticated",
      response: NextResponse.json({ success: true }),
    }),
  });

  const response = await handler(
    new Request("https://preview.example.test/api/portal-auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "client@example.test", password: "ValidPassword2026!" }),
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(calls.map((call) => call.increment), [false, false]);

  calls.length = 0;
  const rejectedHandler = createPortalLoginHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: () => "h".repeat(64),
    rateLimit,
    createLoginResponse: async () => ({
      kind: "denied",
      response: NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 }),
    }),
  });
  const rejectedResponse = await rejectedHandler(
    new Request("https://preview.example.test/api/portal-auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "client@example.test", password: "InvalidPassword2026!" }),
    }),
  );
  assert.equal(rejectedResponse.status, 401);
  assert.deepEqual(calls.map((call) => call.increment), [false, false, true, true]);
  assert.match(calls[1]?.key ?? "", /^portal-login-email:h+$/);
});
