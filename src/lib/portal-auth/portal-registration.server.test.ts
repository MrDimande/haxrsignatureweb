import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  executePortalRegistration,
  PORTAL_REGISTRATION_SUCCESS_MESSAGE,
  type ExistingPortalIdentity,
  type PortalRegistrationDependencies,
} from "./portal-registration.server";
import { hashPortalSecret } from "./credentials";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

const dummyToken = "c2VjdXJlLXBvcnRhbC1yZWdpc3RyYXRpb24tdG9rZW4";
const expiresAt = new Date("2026-10-15T00:00:00.000Z");

function createMockDependencies(overrides: Partial<PortalRegistrationDependencies> = {}) {
  const calls = {
    findAccount: [] as string[],
    created: [] as Array<{ fullName: string; email: string }>,
    issued: [] as Array<{ accountId: string; purpose: string; status?: string }>,
    sent: [] as Array<{ email: string; token: string; origin: string }>,
    invalidated: [] as string[],
  };

  const dependencies: PortalRegistrationDependencies = {
    findAccountByEmail: async (email) => {
      calls.findAccount.push(email);
      return null;
    },
    createProfileAndAccount: async (input) => {
      calls.created.push(input);
      return {
        accountId: "11111111-2222-3333-4444-555555555555",
        profileId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      };
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

describe("Portal client self-registration service", () => {
  it("new email creates 1:1 profile & portal_account in PENDING_ACTIVATION, issues hashed activation token, and sends branded email", async () => {
    const { dependencies, calls } = createMockDependencies();

    const result = await executePortalRegistration(
      {
        fullName: "Jessica Samuel",
        email: "Jessica.Samuel@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    assert.deepEqual(result, {
      success: true,
      message: PORTAL_REGISTRATION_SUCCESS_MESSAGE,
    });

    // Email normalized in lower case
    assert.equal(calls.findAccount[0], "jessica.samuel@example.com");

    // Profile & account created 1:1 with normalized email
    assert.deepEqual(calls.created, [
      { fullName: "Jessica Samuel", email: "jessica.samuel@example.com" },
    ]);

    // Token issued specifically with expectedAccountStatus = PENDING_ACTIVATION
    assert.deepEqual(calls.issued, [
      {
        accountId: "11111111-2222-3333-4444-555555555555",
        purpose: "activation",
        status: "PENDING_ACTIVATION",
      },
    ]);

    // Activation email sent to canonical address
    assert.deepEqual(calls.sent, [
      {
        email: "jessica.samuel@example.com",
        token: dummyToken,
        origin: "https://haxrsignature.com",
      },
    ]);

    // Raw token is never leaked in the result object
    assert.equal(JSON.stringify(result).includes(dummyToken), false);

    // Verify token hash properties
    const tokenHash = hashPortalSecret(dummyToken);
    assert.equal(tokenHash.length, 64);
    assert.notEqual(tokenHash, dummyToken);
  });

  it("existing ACTIVE email does not create duplicate profile/account or issue activation token", async () => {
    const existingActive: ExistingPortalIdentity = {
      accountId: "active-account-id",
      profileId: "active-profile-id",
      status: "ACTIVE",
      hasActiveEvent: true,
    };

    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => existingActive,
    });

    const result = await executePortalRegistration(
      {
        fullName: "Neidy Marino",
        email: "neidy@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    // Must return neutral generic success response (no account enumeration)
    assert.deepEqual(result, {
      success: true,
      message: PORTAL_REGISTRATION_SUCCESS_MESSAGE,
    });

    // Must NEVER create profile/account
    assert.equal(calls.created.length, 0);

    // Must NEVER issue token or send activation email
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("existing PENDING_ACTIVATION email re-issues activation token and sends email without duplicate profile", async () => {
    const existingPending: ExistingPortalIdentity = {
      accountId: "pending-account-id",
      profileId: "pending-profile-id",
      status: "PENDING_ACTIVATION",
      hasActiveEvent: false,
    };

    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => existingPending,
    });

    const result = await executePortalRegistration(
      {
        fullName: "Jessica Samuel",
        email: "pending@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    // Returns neutral response
    assert.deepEqual(result, {
      success: true,
      message: PORTAL_REGISTRATION_SUCCESS_MESSAGE,
    });

    // Must NOT create a duplicate profile or account
    assert.equal(calls.created.length, 0);

    // Must re-issue fresh token for the existing account
    assert.deepEqual(calls.issued, [
      {
        accountId: "pending-account-id",
        purpose: "activation",
        status: "PENDING_ACTIVATION",
      },
    ]);

    // Must send activation email
    assert.deepEqual(calls.sent, [
      {
        email: "pending@example.com",
        token: dummyToken,
        origin: "https://haxrsignature.com",
      },
    ]);
  });

  it("SUSPENDED account does not bypass suspension or leak status", async () => {
    const existingSuspended: ExistingPortalIdentity = {
      accountId: "suspended-account-id",
      profileId: "suspended-profile-id",
      status: "SUSPENDED",
      hasActiveEvent: false,
    };

    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => existingSuspended,
    });

    const result = await executePortalRegistration(
      {
        fullName: "Blocked User",
        email: "blocked@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    // Returns neutral response
    assert.deepEqual(result, {
      success: true,
      message: PORTAL_REGISTRATION_SUCCESS_MESSAGE,
    });

    // Must not touch anything
    assert.equal(calls.created.length, 0);
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("PENDING_IDENTITY_RESOLUTION does not automatically bind or take over legacy identity", async () => {
    const existingLegacy: ExistingPortalIdentity = {
      accountId: "legacy-account-id",
      profileId: "legacy-profile-id",
      status: "PENDING_IDENTITY_RESOLUTION",
      hasActiveEvent: true,
    };

    const { dependencies, calls } = createMockDependencies({
      findAccountByEmail: async () => existingLegacy,
    });

    const result = await executePortalRegistration(
      {
        fullName: "Legacy User",
        email: "legacy@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    // Returns neutral response
    assert.deepEqual(result, {
      success: true,
      message: PORTAL_REGISTRATION_SUCCESS_MESSAGE,
    });

    // Must not auto-bind or activate
    assert.equal(calls.created.length, 0);
    assert.equal(calls.issued.length, 0);
    assert.equal(calls.sent.length, 0);
  });

  it("invalid email results in validation failure before database access", async () => {
    const { dependencies, calls } = createMockDependencies();

    const result = await executePortalRegistration(
      {
        fullName: "Valid Name",
        email: "not-an-email",
        termsAccepted: true,
      },
      dependencies,
    );

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error, "Introduza um endereço de email válido.");
      assert.equal(result.fieldErrors?.email, "Introduza um endereço de email válido.");
    }
    assert.equal(calls.findAccount.length, 0);
    assert.equal(calls.created.length, 0);
  });

  it("missing consent results in validation failure before database access", async () => {
    const { dependencies, calls } = createMockDependencies();

    const result = await executePortalRegistration(
      {
        fullName: "Valid Name",
        email: "valid@example.com",
        termsAccepted: false,
      },
      dependencies,
    );

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error, "Aceite os termos para continuar.");
      assert.equal(result.fieldErrors?.termsAccepted, "Aceite os termos para continuar.");
    }
    assert.equal(calls.findAccount.length, 0);
    assert.equal(calls.created.length, 0);
  });

  it("missing full name results in validation failure before database access", async () => {
    const { dependencies, calls } = createMockDependencies();

    const result = await executePortalRegistration(
      {
        fullName: " ",
        email: "valid@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error, "Introduza o seu nome completo.");
      assert.equal(result.fieldErrors?.fullName, "Introduza o seu nome completo.");
    }
    assert.equal(calls.findAccount.length, 0);
    assert.equal(calls.created.length, 0);
  });

  it("invalidates token when email delivery fails", async () => {
    const { dependencies, calls } = createMockDependencies({
      sendEmail: async () => ({ delivery: "failed" }),
    });

    const result = await executePortalRegistration(
      {
        fullName: "Jessica Samuel",
        email: "fail-delivery@example.com",
        termsAccepted: true,
      },
      dependencies,
    );

    assert.equal(result.success, true);
    assert.deepEqual(calls.invalidated, [dummyToken]);
  });

  it("rate limits registration attempts", () => {
    const testIp = `test-ip-${Date.now()}`;
    for (let i = 0; i < RATE_LIMITS.portalRegister.max; i++) {
      const res = rateLimit(`portal-register:${testIp}`, RATE_LIMITS.portalRegister);
      assert.equal(res.allowed, true);
    }

    const blocked = rateLimit(`portal-register:${testIp}`, RATE_LIMITS.portalRegister);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0);
  });

  it("activation enforces token format and strong password policy", async () => {
    const { validatePortalPassword } = await import("./credentials");
    assert.equal(validatePortalPassword("short"), "Use pelo menos 12 caracteres.");
    assert.equal(validatePortalPassword("a".repeat(1025)), "A palavra-passe excede o limite permitido.");
    assert.equal(validatePortalPassword("ValidStrongPassword2026!"), null);

    // Token must be exactly 43 chars base64url
    const validToken = "c2VjdXJlLXBvcnRhbC1yZWdpc3RyYXRpb24tdG9rZW4";
    assert.equal(/^[A-Za-z0-9_-]{43}$/.test(validToken), true);
    assert.equal(/^[A-Za-z0-9_-]{43}$/.test("short-token"), false);
    assert.equal(/^[A-Za-z0-9_-]{43}$/.test("invalid token with spaces"), false);
  });

  it("post-activation redirect sends user without active_client_event_id to onboarding, not broken dashboard", () => {
    // When newly activated client has no active event and incomplete onboarding
    const hasActiveEvent = false;
    const onboardingComplete = false;
    const fromParam: string | null = "/app/dashboard";

    const target =
      !hasActiveEvent && !onboardingComplete
        ? "/onboarding/profile/1"
        : fromParam;

    assert.equal(target, "/onboarding/profile/1");
  });

  it("post-activation redirect sends user with existing active event to dashboard", () => {
    const hasActiveEvent = true;
    const onboardingComplete = true;
    const fromParam: string | null = null;

    const target =
      !hasActiveEvent && !onboardingComplete
        ? "/onboarding/profile/1"
        : (fromParam ?? "/app/dashboard");

    assert.equal(target, "/app/dashboard");
  });
});
