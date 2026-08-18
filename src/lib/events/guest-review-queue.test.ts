import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDuplicateClusters } from "@/lib/events/deduplication";
import { resolveImportPlan } from "@/lib/events/sheets/idempotent-import";
import {
  buildLedgerReviewItem,
  buildResolutionReviewItem,
  buildReviewQueueSummary,
  isLedgerQueueCandidate,
  isQueueClosedReason,
  mapLedgerReasonToType,
} from "@/lib/events/services/guest-review-queue.service";
import type { EventGuest } from "@/lib/events/types";
import type { Tables } from "@/lib/supabase/database.types";

const EVENT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function makeLedgerRow(
  overrides: Partial<Tables<"event_sheet_sync_ledger">> = {}
): Tables<"event_sheet_sync_ledger"> {
  return {
    id: "ledger-1",
    event_id: EVENT_ID,
    source: "google_sheet",
    row_fingerprint: "fp-abc",
    guest_id: null,
    action: "skipped",
    reason: "guest_deleted_or_missing",
    row_payload: {
      name: "Helio Matola",
      email: "helio@example.com",
      phone: "+258840000000",
      clientType: "individual",
      rowNumber: 2,
    },
    sync_batch_id: "batch-1",
    last_seen_at: "2026-07-06T10:00:00.000Z",
    created_at: "2026-07-06T09:00:00.000Z",
    updated_at: "2026-07-06T10:00:00.000Z",
    ...overrides,
  };
}

function makeResolutionRow(
  overrides: Partial<Tables<"guest_duplicate_resolutions">> = {}
): Tables<"guest_duplicate_resolutions"> {
  return {
    id: "res-1",
    event_id: EVENT_ID,
    primary_guest_id: "guest-primary",
    duplicate_guest_id: null,
    duplicate_fingerprint: "fp-dup",
    duplicate_name: "Helio",
    duplicate_name_normalized: "helio",
    duplicate_email: null,
    duplicate_phone: null,
    source: "google_sheet",
    resolution_status: "needs_review",
    resolved_by: null,
    notes: null,
    metadata: null,
    created_at: "2026-07-06T09:00:00.000Z",
    updated_at: "2026-07-06T10:00:00.000Z",
    resolved_at: "2026-07-06T10:00:00.000Z",
    ...overrides,
  };
}

describe("guest review queue — ledger", () => {
  it("skipped guest_deleted_or_missing aparece na fila", () => {
    const row = makeLedgerRow();
    assert.ok(isLedgerQueueCandidate(row.action, row.reason));
    const item = buildLedgerReviewItem(EVENT_ID, row);
    assert.ok(item);
    assert.equal(item?.type, "missing_guest");
    assert.equal(item?.displayName, "Helio Matola");
  });

  it("ledger matched/updated limpo não aparece na fila", () => {
    const row = makeLedgerRow({
      action: "matched",
      reason: "findGuestMatch",
      guest_id: "guest-1",
    });
    assert.equal(isLedgerQueueCandidate(row.action, row.reason), false);
    assert.equal(buildLedgerReviewItem(EVENT_ID, row), null);
  });

  it("ledger ignored admin_ignored aparece como ignorado", () => {
    const row = makeLedgerRow({
      action: "ignored",
      reason: "admin_ignored",
    });
    assert.ok(isLedgerQueueCandidate(row.action, row.reason));
    const item = buildLedgerReviewItem(EVENT_ID, row);
    assert.equal(item?.type, "ignored_import_row");
  });

  it("ledger admin_resolved fechado não aparece", () => {
    const row = makeLedgerRow({
      action: "skipped",
      reason: "admin_resolved",
    });
    assert.ok(isQueueClosedReason(row.reason));
    assert.equal(buildLedgerReviewItem(EVENT_ID, row), null);
  });

  it("primary_guest_missing é exposto na fila", () => {
    const row = makeLedgerRow({
      reason: "primary_guest_missing",
    });
    const item = buildLedgerReviewItem(EVENT_ID, row);
    assert.equal(item?.type, "primary_guest_missing");
    assert.equal(mapLedgerReasonToType(row.action, row.reason), "primary_guest_missing");
  });
});

describe("guest review queue — duplicate resolutions", () => {
  it("needs_review aparece na fila", () => {
    const row = makeResolutionRow();
    const item = buildResolutionReviewItem(EVENT_ID, row, true);
    assert.ok(item);
    assert.equal(item?.type, "duplicate_needs_review");
    assert.equal(item?.source, "duplicate_resolution");
  });

  it("merged com primary existente não aparece", () => {
    const row = makeResolutionRow({ resolution_status: "merged" });
    assert.equal(buildResolutionReviewItem(EVENT_ID, row, true), null);
  });

  it("primary ausente → primary_guest_missing", () => {
    const row = makeResolutionRow({ resolution_status: "needs_review" });
    const item = buildResolutionReviewItem(EVENT_ID, row, false);
    assert.equal(item?.type, "primary_guest_missing");
  });
});

describe("guest review queue — import memory", () => {
  it("admin_ignored impede recreate no plano de import", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "ignored",
      ledgerReason: "admin_ignored",
      linkedGuestExists: false,
      matchGuestId: "guest-new",
    });
    assert.equal(plan.type, "admin_ignored");
  });

  it("admin_attached fecha fila mas mantém ledger_update se guest existe", () => {
    assert.ok(isQueueClosedReason("admin_attached"));
    const plan = resolveImportPlan({
      ledgerGuestId: "guest-1",
      ledgerExists: true,
      ledgerAction: "matched",
      ledgerReason: "admin_attached",
      linkedGuestExists: true,
      matchGuestId: null,
    });
    assert.equal(plan.type, "ledger_update");
  });

  it("admin_resolved impede recreate", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "skipped",
      ledgerReason: "admin_resolved",
      linkedGuestExists: false,
      matchGuestId: "guest-2",
    });
    assert.equal(plan.type, "admin_resolved");
  });
});

describe("guest review queue — deduplication clusters", () => {
  it("clusters de nomes iguais continuam a ser detectados", () => {
    const guests = [
      {
        id: "g1",
        eventId: EVENT_ID,
        name: "Ana Silva",
        nameNormalized: "ana silva",
        email: "",
        phone: "",
        status: "invited",
        clientType: "individual",
        plusOnes: 0,
        dietaryNotes: "",
        guestNotes: "",
        label: "none",
        groupId: null,
        groupName: null,
        seatId: null,
        qrToken: "qr1",
        guestSource: "manual",
        importBatchId: null,
        archivedAt: null,
        archiveReason: "",
        isIncorrect: false,
        deletedAt: null,
        inviteSentAt: null,
        checkedInAt: null,
        createdAt: "",
        updatedAt: "",
        seat: null,
      },
      {
        id: "g2",
        eventId: EVENT_ID,
        name: "Ana Silva",
        nameNormalized: "ana silva",
        email: "ana@example.com",
        phone: "",
        status: "invited",
        clientType: "individual",
        plusOnes: 0,
        dietaryNotes: "",
        guestNotes: "",
        label: "none",
        groupId: null,
        groupName: null,
        seatId: null,
        qrToken: "qr2",
        guestSource: "manual",
        importBatchId: null,
        archivedAt: null,
        archiveReason: "",
        isIncorrect: false,
        deletedAt: null,
        inviteSentAt: null,
        checkedInAt: null,
        createdAt: "",
        updatedAt: "",
        seat: null,
      },
    ] satisfies EventGuest[];

    const clusters = buildDuplicateClusters(guests);
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0]?.guestIds.length, 2);

    const summary = buildReviewQueueSummary([
      {
        id: "deduplication:ana silva",
        eventId: EVENT_ID,
        type: "possible_duplicate",
        source: "deduplication",
        sourceId: "ana silva",
        displayName: "Ana Silva",
        reason: "2 registos",
      },
    ]);
    assert.equal(summary.possibleDuplicates, 1);
  });
});

describe("guest review queue — restore policy", () => {
  it("restore só é válido para ledger missing_guest (contrato UI)", () => {
    const row = makeLedgerRow({ reason: "guest_deleted_or_missing" });
    const item = buildLedgerReviewItem(EVENT_ID, row);
    assert.equal(item?.source, "ledger");
    assert.equal(item?.type, "missing_guest");
    assert.ok(item?.rowPayload);
  });
});
