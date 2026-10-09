import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inspectPortalAccountToken } from "./portal-auth.server";
import type { neonQuery } from "@/lib/neon/server-db";

const valid43Token = "1234567890123456789012345678901234567890123";

function createMockQuery(row?: Record<string, unknown>): typeof neonQuery {
  return (async () => ({
    rows: row ? [row] : [],
    rowCount: row ? 1 : 0,
    fields: [],
    command: "SELECT",
  })) as unknown as typeof neonQuery;
}

describe("inspectPortalAccountToken", () => {
  it("rejects missing or empty token with missing_token", async () => {
    const emptyResult = await inspectPortalAccountToken("", "activation");
    assert.deepEqual(emptyResult, { valid: false, reason: "missing_token" });

    const whitespaceResult = await inspectPortalAccountToken("   ", "activation");
    assert.deepEqual(whitespaceResult, { valid: false, reason: "missing_token" });
  });

  it("rejects invalid format tokens with invalid_format", async () => {
    const shortResult = await inspectPortalAccountToken("too-short", "activation");
    assert.deepEqual(shortResult, { valid: false, reason: "invalid_format" });

    const malformedResult = await inspectPortalAccountToken(
      "123456789012345678901234567890123456789012!", // 43 chars but contains '!'
      "activation",
    );
    assert.deepEqual(malformedResult, { valid: false, reason: "invalid_format" });
  });

  it("returns not_found when token hash does not exist in db", async () => {
    const mockQuery = createMockQuery(undefined);
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "not_found" });
  });

  it("returns already_consumed when token has consumed_at set", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "ACTIVE",
      is_expired: false,
      is_consumed: true,
      is_invalidated: false,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "already_consumed" });
  });

  it("returns invalidated when token has invalidated_at set", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "PENDING_ACTIVATION",
      is_expired: false,
      is_consumed: false,
      is_invalidated: true,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "invalidated" });
  });

  it("returns expired when token is past expiration time", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "PENDING_ACTIVATION",
      is_expired: true,
      is_consumed: false,
      is_invalidated: false,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "expired" });
  });

  it("returns account_suspended when bound account is SUSPENDED", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "SUSPENDED",
      is_expired: false,
      is_consumed: false,
      is_invalidated: false,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "account_suspended" });
  });

  it("returns account_already_active when account is already ACTIVE for activation token", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "ACTIVE",
      is_expired: false,
      is_consumed: false,
      is_invalidated: false,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, { valid: false, reason: "account_already_active" });
  });

  it("returns valid with account details when token is fresh, pending and valid", async () => {
    const mockQuery = createMockQuery({
      token_id: "tok-1",
      account_id: "acc-1",
      email: "client@example.com",
      account_status: "PENDING_ACTIVATION",
      is_expired: false,
      is_consumed: false,
      is_invalidated: false,
    });
    const result = await inspectPortalAccountToken(valid43Token, "activation", mockQuery);
    assert.deepEqual(result, {
      valid: true,
      accountId: "acc-1",
      email: "client@example.com",
      accountStatus: "PENDING_ACTIVATION",
    });
  });
});
