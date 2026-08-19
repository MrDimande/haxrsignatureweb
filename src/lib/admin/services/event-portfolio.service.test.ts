import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEventPortfolioOperationalSnapshot,
  buildEventPortfolioHealth,
  type EventPortfolioSourceData,
  type EventPortfolioOperationalSnapshot,
} from "./event-portfolio.service";
import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { InvoiceDocument } from "@/lib/admin/types";

const REFERENCE_NOW = new Date("2026-08-19T12:00:00.000Z");

function createEvent(id: string, overrides?: Partial<ManagedEvent>): ManagedEvent {
  return {
    id,
    businessId: "haxr-signature",
    clientId: `cli-${id}`,
    clientName: `Cliente ${id}`,
    name: `Evento ${id}`,
    type: "wedding",
    date: "2026-12-20",
    location: "Maputo",
    notes: "",
    isActive: true,
    googleSheetUrl: "",
    googleSheetGid: "0",
    sheetsLastSyncedAt: null,
    sheetsSyncSummary: "",
    sheetsSyncMode: "master",
    findSeatCode: `EVT${id}`,
    editionRegistryKey: `key-${id}`,
    postEventReportSentAt: null,
    dateHoldUntil: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createGuestStats(overrides?: Partial<EventListGuestStats>): EventListGuestStats {
  return {
    totalGuests: 150,
    confirmed: 120,
    checkedIn: 0,
    unassigned: 10,
    ...overrides,
  };
}

function createInvoiceDocument(
  id: string,
  eventId: string,
  overrides?: Partial<InvoiceDocument>
): InvoiceDocument {
  return {
    id,
    documentNumber: `INV-${id}`,
    documentType: "invoice",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "cli-1",
    clientType: "individual",
    clientName: "Cliente Teste",
    companyName: "",
    clientNuit: "123456789",
    clientEmail: "cliente@example.com",
    clientPhone: "+258840000000",
    clientAddress: "Maputo",
    event: {
      eventId,
      eventType: "wedding",
      eventName: "Casamento Teste",
      eventDate: "2026-12-20",
      eventLocation: "Maputo",
    },
    issueDate: "2026-07-01",
    expiryDate: "2026-12-31",
    notes: "",
    lineItems: [],
    totals: {
      subtotal: 100000,
      vatRate: 0,
      vatAmount: 0,
      grandTotal: 100000,
      includeVat: false,
      currency: "MZN",
    },
    issuerSignatureId: null,
    issuerName: "HAXR",
    issuerRole: "Director",
    issuerSignatureImage: "",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    pdfGeneratedAt: null,
    convertedFromDocumentId: null,
    emailSentAt: null,
    whatsappSharedAt: null,
    clientApprovalStatus: null,
    clientApprovedAt: null,
    clientApprovalNote: null,
    ...overrides,
  };
}

function createOperationalSnapshot(
  id: string,
  overrides?: Partial<EventPortfolioOperationalSnapshot>
): EventPortfolioOperationalSnapshot {
  return {
    event: {
      id,
      businessId: "haxr-signature",
      type: "wedding",
      name: `Evento ${id}`,
      clientName: `Cliente ${id}`,
      date: "2026-12-20",
      pipeline: "active",
    },
    guests: {
      totalGuests: 150,
      confirmed: 120,
      checkedIn: 0,
      unassigned: 0,
    },
    concierge: {
      available: true,
      pendingReviewCount: 0,
    },
    paymentProofs: {
      available: true,
      pendingCount: 0,
    },
    documents: {
      openCount: 0,
      overdueCount: 0,
    },
    dateHold: {
      active: false,
      dateHoldUntil: null,
    },
    sheets: {
      configured: true,
      lastSyncedAt: "2026-08-19T10:00:00Z",
    },
    ...overrides,
  };
}

describe("event-portfolio.service (temporal determinism & data availability)", () => {
  it("A & B. Portfolio builder is deterministic and returns identical output for same input + now", () => {
    const events = [createEvent("1", { date: "2026-09-01" })];
    const source: EventPortfolioSourceData = {
      events,
      guestStats: { "1": createGuestStats() },
      conciergeReviews: { available: true, counts: { "1": 2 } },
      paymentProofs: { available: true, counts: { "1": 1 } },
      documentsByEvent: { "1": [createInvoiceDocument("d1", "1", { expiryDate: "2026-08-10" })] },
    };

    const run1 = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });
    const run2 = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });

    assert.deepEqual(run1, run2);
    assert.equal(run1.length, 1);
    assert.equal(run1[0].event.pipeline, "active");
    assert.equal(run1[0].documents.overdueCount, 1);
  });

  it("C & D. event after injected now is active; event before injected now is completed", () => {
    const events = [
      createEvent("future", { date: "2026-09-01" }),
      createEvent("planning", { date: null }),
      createEvent("past", { date: "2026-08-01" }),
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0].event.id, "future");
    assert.equal(snapshots[0].event.pipeline, "active");
    assert.equal(snapshots[1].event.id, "planning");
    assert.equal(snapshots[1].event.pipeline, "planning");
  });

  it("E & F. date hold evaluated relative to injected now (future = active, past = inactive)", () => {
    const futureHold = "2026-08-25T12:00:00.000Z";
    const pastHold = "2026-08-10T12:00:00.000Z";

    const events = [
      createEvent("1", { dateHoldUntil: futureHold }),
      createEvent("2", { dateHoldUntil: pastHold }),
      createEvent("3", { dateHoldUntil: null }),
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });

    assert.equal(snapshots[0].dateHold.active, true);
    assert.equal(snapshots[0].dateHold.dateHoldUntil, futureHold);

    assert.equal(snapshots[1].dateHold.active, false);
    assert.equal(snapshots[1].dateHold.dateHoldUntil, pastHold);

    assert.equal(snapshots[2].dateHold.active, false);
    assert.equal(snapshots[2].dateHold.dateHoldUntil, null);
  });

  it("G. overdue document semantics use injected now", () => {
    const docOverdue = createInvoiceDocument("d1", "1", {
      status: "sent",
      expiryDate: "2026-08-10",
    });
    const docNotOverdue = createInvoiceDocument("d2", "1", {
      status: "sent",
      expiryDate: "2026-08-25",
    });

    const source: EventPortfolioSourceData = {
      events: [createEvent("1")],
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: { "1": [docOverdue, docNotOverdue] },
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });
    assert.equal(snapshots[0].documents.openCount, 2);
    assert.equal(snapshots[0].documents.overdueCount, 1);
  });

  it("H & I. Concierge: available=true + zero rows -> 0; available=false -> null", () => {
    const events = [createEvent("1"), createEvent("2")];

    // Case 1: Concierge module is available
    const sourceAvailable: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: true, counts: { "1": 3, "2": 0 } },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: {},
    };

    const snapAvailable = buildEventPortfolioOperationalSnapshot(sourceAvailable, { now: REFERENCE_NOW });
    assert.equal(snapAvailable[0].concierge.available, true);
    assert.equal(snapAvailable[0].concierge.pendingReviewCount, 3);
    assert.equal(snapAvailable[1].concierge.available, true);
    assert.equal(snapAvailable[1].concierge.pendingReviewCount, 0);

    // Case 2: Concierge module is unavailable (e.g. table not migrated)
    const sourceUnavailable: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: false, counts: {} },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: {},
    };

    const snapUnavailable = buildEventPortfolioOperationalSnapshot(sourceUnavailable, { now: REFERENCE_NOW });
    assert.equal(snapUnavailable[0].concierge.available, false);
    assert.equal(snapUnavailable[0].concierge.pendingReviewCount, null);
    assert.equal(snapUnavailable[1].concierge.available, false);
    assert.equal(snapUnavailable[1].concierge.pendingReviewCount, null);
  });

  it("J & K. Payment proofs: available=true + zero -> 0; available=false -> null", () => {
    const events = [createEvent("1"), createEvent("2")];

    // Case 1: Payment proofs available
    const sourceAvailable: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: true, counts: { "1": 2, "2": 0 } },
      documentsByEvent: {},
    };

    const snapAvailable = buildEventPortfolioOperationalSnapshot(sourceAvailable, { now: REFERENCE_NOW });
    assert.equal(snapAvailable[0].paymentProofs.available, true);
    assert.equal(snapAvailable[0].paymentProofs.pendingCount, 2);
    assert.equal(snapAvailable[1].paymentProofs.available, true);
    assert.equal(snapAvailable[1].paymentProofs.pendingCount, 0);

    // Case 2: Payment proofs unavailable
    const sourceUnavailable: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: false, counts: {} },
      documentsByEvent: {},
    };

    const snapUnavailable = buildEventPortfolioOperationalSnapshot(sourceUnavailable, { now: REFERENCE_NOW });
    assert.equal(snapUnavailable[0].paymentProofs.available, false);
    assert.equal(snapUnavailable[0].paymentProofs.pendingCount, null);
    assert.equal(snapUnavailable[1].paymentProofs.available, false);
    assert.equal(snapUnavailable[1].paymentProofs.pendingCount, null);
  });

  it("L. businessId and event type pass through accurately", () => {
    const event = createEvent("1", {
      businessId: "brainywrite",
      type: "corporate",
    });

    const source: EventPortfolioSourceData = {
      events: [event],
      guestStats: {},
      conciergeReviews: { available: true, counts: {} },
      paymentProofs: { available: true, counts: {} },
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });
    assert.equal(snapshots[0].event.businessId, "brainywrite");
    assert.equal(snapshots[0].event.type, "corporate");
  });

  it("M. source objects are not mutated", () => {
    const event = createEvent("evt-1");
    const eventClone = JSON.parse(JSON.stringify(event));

    const source: EventPortfolioSourceData = {
      events: [event],
      guestStats: { "evt-1": createGuestStats() },
      conciergeReviews: { available: true, counts: { "evt-1": 1 } },
      paymentProofs: { available: true, counts: { "evt-1": 1 } },
      documentsByEvent: {},
    };

    buildEventPortfolioOperationalSnapshot(source, { now: REFERENCE_NOW });
    assert.deepEqual(event, eventClone);
  });
});

describe("event-portfolio.service (buildEventPortfolioHealth)", () => {
  it("A. overdue documents -> priority status", () => {
    const snapshot = createOperationalSnapshot("1", {
      documents: { openCount: 1, overdueCount: 2 },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "priority");
    assert.equal(result.items[0].reasons.length, 1);
    assert.equal(result.items[0].reasons[0].code, "overdue_documents");
    assert.equal(result.items[0].reasons[0].label, "2 documentos vencidos");
  });

  it("B. pending payment proof -> priority status", () => {
    const snapshot = createOperationalSnapshot("1", {
      paymentProofs: { available: true, pendingCount: 1 },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "priority");
    assert.equal(result.items[0].reasons[0].code, "pending_payment_proofs");
    assert.equal(result.items[0].reasons[0].label, "1 comprovativo por validar");
  });

  it("C. active date hold -> priority status", () => {
    const snapshot = createOperationalSnapshot("1", {
      dateHold: { active: true, dateHoldUntil: "2026-09-01" },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "priority");
    assert.equal(result.items[0].reasons[0].code, "active_date_hold");
    assert.equal(result.items[0].reasons[0].label, "Reserva de data activa");
  });

  it("D. Concierge pending with no high reason -> attention status", () => {
    const snapshot = createOperationalSnapshot("1", {
      concierge: { available: true, pendingReviewCount: 3 },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "attention");
    assert.equal(result.items[0].reasons[0].code, "concierge_pending");
    assert.equal(result.items[0].reasons[0].label, "3 itens Concierge por rever");
  });

  it("E. high reason + Concierge pending -> priority wins", () => {
    const snapshot = createOperationalSnapshot("1", {
      documents: { openCount: 1, overdueCount: 1 },
      concierge: { available: true, pendingReviewCount: 2 },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "priority");
    assert.equal(result.items[0].reasons.length, 2);
  });

  it("F. no reasons + complete coverage -> clear status", () => {
    const snapshot = createOperationalSnapshot("1", {
      concierge: { available: true, pendingReviewCount: 0 },
      paymentProofs: { available: true, pendingCount: 0 },
      documents: { openCount: 0, overdueCount: 0 },
      dateHold: { active: false, dateHoldUntil: null },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "clear");
    assert.equal(result.items[0].coverage, "complete");
    assert.equal(result.items[0].reasons.length, 0);
  });

  it("G. no reasons + partial coverage -> clear status with partial coverage", () => {
    const snapshot = createOperationalSnapshot("1", {
      concierge: { available: false, pendingReviewCount: null },
      paymentProofs: { available: true, pendingCount: 0 },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "clear");
    assert.equal(result.items[0].coverage, "partial");
  });

  it("H, I, J. unassigned guests, open sent documents, and unconfigured sheets alone do NOT create attention", () => {
    const snapshot = createOperationalSnapshot("1", {
      guests: { totalGuests: 200, confirmed: 150, checkedIn: 0, unassigned: 50 },
      documents: { openCount: 3, overdueCount: 0 },
      sheets: { configured: false, lastSyncedAt: null },
      concierge: { available: true, pendingReviewCount: 0 },
      paymentProofs: { available: true, pendingCount: 0 },
      dateHold: { active: false, dateHoldUntil: null },
    });
    const result = buildEventPortfolioHealth([snapshot]);

    assert.equal(result.items[0].status, "clear");
    assert.equal(result.items[0].reasons.length, 0);
  });

  it("K & L. sorting: priority > attention > clear, and nearest dated event first within same status", () => {
    const snap1 = createOperationalSnapshot("clear-distant", {
      event: { id: "1", businessId: "haxr-signature", type: "wedding", name: "Evt 1", clientName: "Cli 1", date: "2026-12-25", pipeline: "active" },
    });
    const snap2 = createOperationalSnapshot("priority-late", {
      event: { id: "2", businessId: "haxr-signature", type: "wedding", name: "Evt 2", clientName: "Cli 2", date: "2026-11-20", pipeline: "active" },
      documents: { openCount: 1, overdueCount: 1 },
    });
    const snap3 = createOperationalSnapshot("priority-early", {
      event: { id: "3", businessId: "haxr-signature", type: "wedding", name: "Evt 3", clientName: "Cli 3", date: "2026-09-10", pipeline: "active" },
      dateHold: { active: true, dateHoldUntil: "2026-08-30" },
    });
    const snap4 = createOperationalSnapshot("attention-mid", {
      event: { id: "4", businessId: "haxr-signature", type: "wedding", name: "Evt 4", clientName: "Cli 4", date: "2026-10-15", pipeline: "active" },
      concierge: { available: true, pendingReviewCount: 1 },
    });
    const snap5 = createOperationalSnapshot("clear-early", {
      event: { id: "5", businessId: "haxr-signature", type: "wedding", name: "Evt 5", clientName: "Cli 5", date: "2026-08-30", pipeline: "active" },
    });

    const result = buildEventPortfolioHealth([snap1, snap2, snap3, snap4, snap5]);

    assert.equal(result.items[0].operational.event.id, "3"); // priority early
    assert.equal(result.items[1].operational.event.id, "2"); // priority late
    assert.equal(result.items[2].operational.event.id, "4"); // attention
    assert.equal(result.items[3].operational.event.id, "5"); // clear early
    assert.equal(result.items[4].operational.event.id, "1"); // clear distant
  });

  it("M. summary counts reflect full dataset accurately with clearComplete", () => {
    const snapshots = [
      createOperationalSnapshot("1", { documents: { openCount: 0, overdueCount: 1 } }), // priority, complete
      createOperationalSnapshot("2", { concierge: { available: true, pendingReviewCount: 1 } }), // attention, complete
      createOperationalSnapshot("3", {}), // clear, complete
      createOperationalSnapshot("4", { concierge: { available: false, pendingReviewCount: null } }), // clear, partial
    ];

    const result = buildEventPortfolioHealth(snapshots);

    assert.equal(result.summary.total, 4);
    assert.equal(result.summary.priority, 1);
    assert.equal(result.summary.attention, 1);
    assert.equal(result.summary.clearComplete, 1); // Only snapshot 3 (clear + complete)
    assert.equal(result.summary.partialCoverage, 1); // Snapshot 4 (partial)
  });

  it("N. partial coverage semantics across statuses (clear+partial, priority+partial, attention+partial)", () => {
    const clearComplete = createOperationalSnapshot("1", {});
    const clearPartial = createOperationalSnapshot("2", { concierge: { available: false, pendingReviewCount: null } });
    const priorityPartial = createOperationalSnapshot("3", {
      documents: { openCount: 0, overdueCount: 1 },
      paymentProofs: { available: false, pendingCount: null },
    });
    const attentionPartial = createOperationalSnapshot("4", {
      concierge: { available: true, pendingReviewCount: 2 },
      paymentProofs: { available: false, pendingCount: null },
    });

    const result = buildEventPortfolioHealth([clearComplete, clearPartial, priorityPartial, attentionPartial]);

    // A. clear + complete contributes to clearComplete
    // B. clear + partial does NOT contribute to clearComplete
    assert.equal(result.summary.clearComplete, 1);

    // C. clear + partial contributes to partialCoverage
    // D. priority + partial remains priority and contributes to partialCoverage
    // E. attention + partial remains attention and contributes to partialCoverage
    assert.equal(result.summary.priority, 1);
    assert.equal(result.summary.attention, 1);
    assert.equal(result.summary.partialCoverage, 3); // clearPartial, priorityPartial, attentionPartial
  });

  it("O. input operational snapshots are not mutated", () => {
    const snapshot = createOperationalSnapshot("1", {
      documents: { openCount: 1, overdueCount: 1 },
    });
    const clone = JSON.parse(JSON.stringify(snapshot));

    buildEventPortfolioHealth([snapshot]);
    assert.deepEqual(snapshot, clone);
  });
});
