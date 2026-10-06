import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AdminIdentity } from "@/lib/admin/admin-user";
import type { AdminPortalAccount } from "@/lib/admin/portal-accounts.repository";
import {
  executePortalActivation,
  type PortalActivationDependencies,
} from "@/lib/admin/services/portal-activation.service";

const accountId = "54ed2aa6-4291-4656-b2e3-4dba8d9021b3";
const profileId = "f9258a9e-9542-4ffc-8156-2b49b7272cb3";
const rawToken = "c2VjdXJlLXBvcnRhbC1hY3RpdmF0aW9uLXRva2Vu";

const owner: AdminIdentity = {
  id: "6a2b218c-7248-4dfb-a45c-58cadd313d91",
  name: "Owner",
  email: "owner@haxrsignature.com",
  role: "OWNER",
  permissions: ["SUPER_ADMIN"],
  status: "active",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  lastLoginAt: null,
  isPersisted: true,
};

function createAccount(overrides: Partial<AdminPortalAccount> = {}): AdminPortalAccount {
  return {
    accountId,
    profileId,
    fullName: "Cliente de Teste",
    email: "controlled-recipient@example.test",
    status: "PENDING_ACTIVATION",
    hasLiveActivation: false,
    ...overrides,
  };
}

function createDependencies(overrides: Partial<PortalActivationDependencies> = {}) {
  const calls = {
    issued: 0,
    sent: [] as Array<{ email: string; token: string; origin: string }>,
    invalidated: [] as string[],
    audits: [] as Array<{ account_id: string; profile_id: string }>,
  };

  const dependencies: PortalActivationDependencies = {
    requireOwner: async () => owner,
    findAccount: async () => createAccount(),
    issueToken: async () => {
      calls.issued += 1;
      return { token: rawToken, expiresAt: new Date("2026-10-10T00:00:00.000Z") };
    },
    sendEmail: async ({ email, token, origin }) => {
      calls.sent.push({ email, token, origin });
      return { delivery: "sent" };
    },
    invalidateToken: async ({ token }) => {
      calls.invalidated.push(token);
      return true;
    },
    recordAudit: async ({ details }) => {
      calls.audits.push(details);
    },
    getOrigin: async () => "https://preview.example.test",
    ...overrides,
  };

  return { dependencies, calls };
}

describe("Portal activation administration", () => {
  it("allows an authorised owner to deliver activation without exposing the token", async () => {
    const { dependencies, calls } = createDependencies();
    const result = await executePortalActivation({ accountId }, dependencies);

    assert.deepEqual(result, {
      success: true,
      data: { delivery: "sent", auditRecorded: true },
    });
    assert.equal(calls.issued, 1);
    assert.deepEqual(calls.sent, [{
      email: "controlled-recipient@example.test",
      token: rawToken,
      origin: "https://preview.example.test",
    }]);
    assert.deepEqual(calls.audits, [{ account_id: accountId, profile_id: profileId }]);
    assert.equal(JSON.stringify(result).includes(rawToken), false);
    assert.equal(JSON.stringify(calls.audits).includes(rawToken), false);
  });

  it("rejects an unauthenticated request before loading an account", async () => {
    const { dependencies } = createDependencies({
      requireOwner: async () => {
        throw new Error("no_session");
      },
      findAccount: async () => {
        throw new Error("must_not_load_account");
      },
    });

    const result = await executePortalActivation({ accountId }, dependencies);
    assert.deepEqual(result, {
      success: false,
      error: "Não foi possível enviar a activação. A conta permanece pendente.",
    });
  });

  it("rejects an authenticated administrator without owner permission", async () => {
    const { dependencies } = createDependencies({
      requireOwner: async () => {
        throw new Error("owner_permission_required");
      },
    });

    const result = await executePortalActivation({ accountId }, dependencies);
    assert.equal(result.success, false);
  });

  it("rejects missing accounts and accounts without reconciled email", async () => {
    const missing = createDependencies({ findAccount: async () => null });
    const missingResult = await executePortalActivation({ accountId }, missing.dependencies);
    assert.deepEqual(missingResult, { success: false, error: "Conta do Portal não encontrada." });
    assert.equal(missing.calls.issued, 0);

    const withoutEmail = createDependencies({
      findAccount: async () => createAccount({ email: null }),
    });
    const emailResult = await executePortalActivation({ accountId }, withoutEmail.dependencies);
    assert.deepEqual(emailResult, {
      success: false,
      error: "A conta do Portal não tem um email reconciliado.",
    });
    assert.equal(withoutEmail.calls.issued, 0);
  });

  it("rejects active and suspended accounts", async () => {
    for (const status of ["ACTIVE", "SUSPENDED"] as const) {
      const fixture = createDependencies({
        findAccount: async () => createAccount({ status }),
      });
      const result = await executePortalActivation({ accountId }, fixture.dependencies);
      assert.deepEqual(result, {
        success: false,
        error: "A activação só está disponível para contas pendentes.",
      });
      assert.equal(fixture.calls.issued, 0);
    }
  });

  it("delegates each reissue to the canonical issuer and returns no reusable secret", async () => {
    let issued = 0;
    const fixture = createDependencies({
      issueToken: async () => {
        issued += 1;
        return {
          token: issued === 1 ? rawToken : `${rawToken}-reissued`,
          expiresAt: new Date("2026-10-10T00:00:00.000Z"),
        };
      },
    });

    const first = await executePortalActivation({ accountId }, fixture.dependencies);
    const second = await executePortalActivation({ accountId }, fixture.dependencies);

    assert.equal(issued, 2);
    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.equal(JSON.stringify(first).includes(rawToken), false);
    assert.equal(JSON.stringify(second).includes("reissued"), false);
  });

  it("invalidates the newly issued token after failed delivery without activating the account", async () => {
    const account = createAccount();
    const fixture = createDependencies({
      findAccount: async () => account,
      sendEmail: async () => ({ delivery: "failed" }),
    });

    const result = await executePortalActivation({ accountId }, fixture.dependencies);

    assert.deepEqual(result, {
      success: false,
      error: "Não foi possível enviar a activação. A conta permanece pendente.",
    });
    assert.deepEqual(fixture.calls.invalidated, [rawToken]);
    assert.equal(account.status, "PENDING_ACTIVATION");
    assert.equal(fixture.calls.audits.length, 0);
  });
});
