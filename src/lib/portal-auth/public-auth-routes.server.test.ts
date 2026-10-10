import assert from "node:assert/strict";
import test from "node:test";
import { NextResponse } from "next/server";
import { persistentRateLimit, type PersistentRateLimitOptions } from "@/lib/security/persistent-rate-limit";
import type { RateLimitConfig, RateLimitResult } from "@/lib/security/rate-limit";
import { PORTAL_REGISTRATION_SUCCESS_MESSAGE } from "./portal-registration.server";
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

test("all public auth routes respond 503 with short Retry-After when their persistent rate-limit database is unavailable", async () => {
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
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("retry-after"), "30");
      const body = (await response.json()) as { error?: string };
      assert.equal(body.error, "service_unavailable");
    }
  } finally {
    console.warn = originalWarn;
  }
});

test("login reserves attempts atomically before password verification and refunds them on success", async () => {
  const rateLimitCalls: Array<{ key: string; increment: boolean | undefined }> = [];
  const refundedKeys: string[] = [];

  const rateLimit = async (key: string, _config: RateLimitConfig, options?: PersistentRateLimitOptions) => {
    rateLimitCalls.push({ key, increment: options?.increment });
    return { allowed: true, remaining: 4, retryAfterSeconds: 0 };
  };
  const refundLimit = async (key: string) => {
    refundedKeys.push(key);
  };

  const handler = createPortalLoginHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: () => "h".repeat(64),
    rateLimit,
    refundLimit,
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
  // Ambos os baldes (IP e Email) foram reservados atomicamente com increment: true ANTES da verificação
  assert.deepEqual(rateLimitCalls.map((call) => call.increment), [true, true]);
  // Ambas as reservas foram devolvidas com sucesso após login válido
  assert.deepEqual(refundedKeys, ["portal-login:198.51.100.8", `portal-login-email:${"h".repeat(64)}`]);

  // Cenário de credencial recusada
  rateLimitCalls.length = 0;
  refundedKeys.length = 0;
  const rejectedHandler = createPortalLoginHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: () => "h".repeat(64),
    rateLimit,
    refundLimit,
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
  assert.deepEqual(rateLimitCalls.map((call) => call.increment), [true, true]);
  // Em caso de falha, NENHUMA tentativa é devolvida
  assert.equal(refundedKeys.length, 0);
});

test("login handles concurrent parallel requests atomically without race conditions", async () => {
  const keyCounts = new Map<string, number>();
  const maxAllowed = 5;

  const atomicRateLimit = async (key: string, _config: RateLimitConfig, options?: PersistentRateLimitOptions) => {
    if (options?.increment) {
      const current = keyCounts.get(key) ?? 0;
      const next = current + 1;
      keyCounts.set(key, next);
      if (next > maxAllowed) {
        return { allowed: false, remaining: 0, retryAfterSeconds: 900 };
      }
      return { allowed: true, remaining: maxAllowed - next, retryAfterSeconds: 0 };
    }
    return { allowed: true, remaining: maxAllowed, retryAfterSeconds: 0 };
  };

  const refundLimit = async (key: string) => {
    const current = keyCounts.get(key) ?? 0;
    if (current > 0) keyCounts.set(key, current - 1);
  };

  let credentialVerifications = 0;
  const handler = createPortalLoginHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: () => "hash123",
    rateLimit: atomicRateLimit,
    refundLimit,
    createLoginResponse: async () => {
      credentialVerifications += 1;
      // Simula latência de hash de credencial
      await new Promise((resolve) => setTimeout(resolve, 15));
      return {
        kind: "denied",
        response: NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 }),
      };
    },
  });

  // 10 pedidos em paralelo ao mesmo tempo
  const requests = Array.from({ length: 10 }, () =>
    handler(
      new Request("https://preview.example.test/api/portal-auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "target@example.test", password: "Password123!" }),
      }),
    ),
  );

  const responses = await Promise.all(requests);
  const statusCounts = responses.reduce<Record<number, number>>((acc, res) => {
    acc[res.status] = (acc[res.status] || 0) + 1;
    return acc;
  }, {});

  // Exatamente 5 passam para a verificação e 5 são barrados atomicamente com 429
  assert.equal(statusCounts[401], 5);
  assert.equal(statusCounts[429], 5);
  assert.equal(credentialVerifications, 5);
});

test("registration enforces shared email rate limit and returns identical anti-enumeration success message", async () => {
  let registrationInvoked = false;

  const handler = createPortalRegisterHandler({
    getIp: () => "198.51.100.8",
    hashIdentifier: (email) => `hashed_${email}`,
    rateLimit: async (key: string) => {
      if (key.startsWith("portal-resend-activation-email:")) {
        // Simula que o limite de email partilhado com o reenvio foi excedido
        return { allowed: false, remaining: 0, retryAfterSeconds: 900 };
      }
      return { allowed: true, remaining: 5, retryAfterSeconds: 0 };
    },
    executeRegistration: async () => {
      registrationInvoked = true;
      return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
    },
  });

  const response = await handler(
    new Request("https://preview.example.test/api/portal-auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: "Cliente Alvo",
        email: "alvo@example.test",
        termsAccepted: true,
      }),
    }),
  );

  // Resposta anti-enumeração idêntica à resposta de sucesso
  assert.equal(response.status, 200);
  const body = (await response.json()) as { success: boolean; message: string };
  assert.equal(body.success, true);
  assert.equal(body.message, PORTAL_REGISTRATION_SUCCESS_MESSAGE);
  // Não executou o registo na base de dados
  assert.equal(registrationInvoked, false);
});

test("rejects localhost and 127.0.0.1 in production across auth routes including login", async () => {
  const originalEnv = { ...process.env };
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.VERCEL_ENV;

    const loginHandler = createPortalLoginHandler();
    const loginResponse = await loginHandler(
      new Request("https://www.haxrsignature.com/api/portal-auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "user@example.com", password: "Password123!" }),
      }),
    );
    assert.equal(loginResponse.status, 403);
    const loginBody = (await loginResponse.json()) as { error?: string };
    assert.equal(loginBody.error, "Origem não autorizada.");

    const registerHandler = createPortalRegisterHandler();
    const registerResponse = await registerHandler(
      new Request("https://www.haxrsignature.com/api/portal-auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3000",
        },
        body: JSON.stringify({ fullName: "Teste", email: "user@example.com", termsAccepted: true }),
      }),
    );
    assert.equal(registerResponse.status, 403);
  } finally {
    process.env = originalEnv;
  }
});
