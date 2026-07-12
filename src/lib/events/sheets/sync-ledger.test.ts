import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyIdempotentStats,
  mergeIdempotentStats,
  resolveImportPlan,
} from "./idempotent-import";

describe("resolveImportPlan", () => {
  it("ledger com guest existente → ledger_update", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: "guest-1",
      ledgerExists: true,
      ledgerAction: "created",
      linkedGuestExists: true,
      matchGuestId: null,
    });
    assert.deepEqual(plan, { type: "ledger_update", guestId: "guest-1" });
  });

  it("ledger com guest apagado → skip_deleted", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: "guest-1",
      ledgerExists: true,
      ledgerAction: "created",
      linkedGuestExists: false,
      matchGuestId: "guest-2",
    });
    assert.equal(plan.type, "skip_deleted");
    if (plan.type === "skip_deleted") {
      assert.equal(plan.reason, "guest_deleted_or_missing");
    }
  });

  it("ledger sem guest_id após ON DELETE SET NULL → skip_deleted", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "created",
      linkedGuestExists: false,
      matchGuestId: "guest-2",
    });
    assert.equal(plan.type, "skip_deleted");
  });

  it("sem ledger mas match por email/telefone/nome → match_update", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: false,
      ledgerAction: null,
      linkedGuestExists: false,
      matchGuestId: "guest-3",
    });
    assert.deepEqual(plan, { type: "match_update", guestId: "guest-3" });
  });

  it("sem ledger nem match → create_new", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: false,
      ledgerAction: null,
      linkedGuestExists: false,
      matchGuestId: null,
    });
    assert.deepEqual(plan, { type: "create_new" });
  });

  it("ledger admin_ignored → não recriar", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "ignored",
      ledgerReason: "admin_ignored",
      linkedGuestExists: false,
      matchGuestId: "guest-99",
    });
    assert.equal(plan.type, "admin_ignored");
  });

  it("ledger admin_resolved → não recriar", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "skipped",
      ledgerReason: "admin_resolved",
      linkedGuestExists: false,
      matchGuestId: "guest-99",
    });
    assert.equal(plan.type, "admin_resolved");
  });
});

describe("mergeIdempotentStats", () => {
  it("acumula contadores por linha", () => {
    const stats = createEmptyIdempotentStats();
    mergeIdempotentStats(stats, {
      importRowsSeen: true,
      fingerprintsCreated: true,
      ledgerMatched: true,
      ledgerSkipped: false,
    });
    mergeIdempotentStats(stats, {
      importRowsSeen: true,
      fingerprintsCreated: false,
      ledgerMatched: false,
      ledgerSkipped: true,
    });
    assert.equal(stats.importRowsSeen, 2);
    assert.equal(stats.fingerprintsCreated, 1);
    assert.equal(stats.ledgerMatched, 1);
    assert.equal(stats.ledgerSkipped, 1);
  });
});
