import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  executePortalResendActivation,
  PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE,
  type PortalResendActivationDependencies,
} from "./portal-resend-activation.server";

const dummyToken = "c2VjdXJlLXBvcnRhbC1yZXNlbmQtYWN0aXZhdGlvbi10b2tlbg";
const expiresAt = new Date("2026-10-15T00:00:00.000Z");

function createMockDependencies(overrides: Partial<PortalResendActivationDependencies> = {}) {
  const calls = {
    findAccount: [] as string[],
    issued: [] as Array<{ accountId: string; purpose: string; status?: string }>,
    sent: [] as Array<{ email: string; token: string; origin: string }>,
    invalidated: [] as string[],
  };

  const dependencies: PortalResendActivationDependencies = {
    findAccountByEmail: async (email) => {
      calls.findAccount.push(email);
      return null;
    },
    issueToken: async (input) => {
      calls.issued.push({
        accountId: input.accountId,
        purpose: input.purpose,
        status: input.expectedAccountStatus,
      });
      return { token: dummyToken, expiresAt };
    },
    sendEmail: async (input) => {
      calls.sent.push({ email: input.email, token: input.token, origin: input.origin });
      return { delivery: "sent" };
    },
    invalidateToken: async ({ token }) => {
      calls.invalidated.push(token);
      return true;
    },
    getOrigin: async () => "https://haxrsignature.com",
    ...overrides,
  };

  return { dependencies, calls };
}

describe("Portal resend activation service", () => {
  it("rotates token and sends new email when account is PENDING_ACTIVATION", async () => {
    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async (email) => {
        calls.findAccount.push(email);
        return {
          accountId: "11111111-2222-3333-4444-555555555555",
          status: "PENDING_ACTIVATION",
        };
      },
    });

    const result = await executePortalResendActivation(
      { email: "couple@example.com" },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.equal(result.message, PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE);
    assert.equal(calls.findAccount.length, 1);
    assert.equal(calls.issued.length, 1);
    assert.equal(calls.sent.length, 1);
    assert.equal(calls.sent[0]?.email, "couple@example.com");
  });

  it("returns neutral message and sends no email when account is not found (anti-enumeration)", async () => {
    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => null,
    });

    const result = await executePortalResendActivation(
      { email: "nonexistent@example.com" },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.equal(result.message, PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE);
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("returns neutral message and sends no email when account is already ACTIVE (anti-enumeration)", async () => {
    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => ({
        accountId: "active-account-id",
        status: "ACTIVE",
      }),
    });

    const result = await executePortalResendActivation(
      { email: "alreadyactive@example.com" },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.equal(result.message, PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE);
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("returns neutral message and sends no email when account is SUSPENDED", async () => {
    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => ({
        accountId: "suspended-account-id",
        status: "SUSPENDED",
      }),
    });

    const result = await executePortalResendActivation(
      { email: "suspended@example.com" },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.equal(result.message, PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE);
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("fails with user-friendly error on invalid email format", async () => {
    const { dependencies } = createMockDependencies();

    const result = await executePortalResendActivation(
      { email: "invalid-email" },
      dependencies,
    );

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error, "Introduza um endereço de email válido.");
    }
  });

  it("invalidates token when email delivery fails", async () => {
    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => ({
        accountId: "acc-id",
        status: "PENDING_ACTIVATION",
      }),
      sendEmail: async () => ({ delivery: "failed" }),
    });

    const result = await executePortalResendActivation(
      { email: "client@example.com" },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.equal(calls.invalidated.length, 1);
    assert.equal(calls.invalidated[0], dummyToken);
  });
});
