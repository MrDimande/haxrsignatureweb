import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEventPortfolioOperationalSnapshot,
  type EventPortfolioSourceData,
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
