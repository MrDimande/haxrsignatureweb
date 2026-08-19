import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEventPortfolioOperationalSnapshot,
  type EventPortfolioSourceData,
} from "./event-portfolio.service";
import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { InvoiceDocument } from "@/lib/admin/types";

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
    expiryDate: "2099-12-31",
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

describe("event-portfolio.service (batch data foundation)", () => {
  it("A. includes planning + active events and excludes completed events", () => {
    const events = [
      createEvent("1", { date: "2026-12-20" }), // active
      createEvent("2", { date: null }), // planning
      createEvent("3", { date: "2020-01-01" }), // completed (past date)
      createEvent("4", { isActive: false }), // completed (inactive)
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0].event.id, "1");
    assert.equal(snapshots[0].event.pipeline, "active");
    assert.equal(snapshots[1].event.id, "2");
    assert.equal(snapshots[1].event.pipeline, "planning");
  });

  it("B. guest stats map accurately to the correct event", () => {
    const events = [
      createEvent("evt-1"),
      createEvent("evt-2"),
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {
        "evt-1": createGuestStats({ totalGuests: 200, confirmed: 180, checkedIn: 50, unassigned: 5 }),
        "evt-2": createGuestStats({ totalGuests: 80, confirmed: 60, checkedIn: 0, unassigned: 0 }),
      },
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);

    assert.equal(snapshots[0].guests.totalGuests, 200);
    assert.equal(snapshots[0].guests.confirmed, 180);
    assert.equal(snapshots[0].guests.checkedIn, 50);
    assert.equal(snapshots[0].guests.unassigned, 5);

    assert.equal(snapshots[1].guests.totalGuests, 80);
    assert.equal(snapshots[1].guests.confirmed, 60);
    assert.equal(snapshots[1].guests.checkedIn, 0);
    assert.equal(snapshots[1].guests.unassigned, 0);
  });

  it("C. Concierge counts map accurately to the correct event", () => {
    const events = [createEvent("evt-1"), createEvent("evt-2")];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {
        "evt-1": 3,
        "evt-2": 0,
      },
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);
    assert.equal(snapshots[0].concierge.pendingReviewCount, 3);
    assert.equal(snapshots[1].concierge.pendingReviewCount, 0);
  });

  it("D & E. pending payment proofs map only to explicit matching eventId", () => {
    const events = [createEvent("evt-1"), createEvent("evt-2")];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {
        "evt-1": 2,
        // evt-2 has none; proofs with null eventId are not in the dictionary
      },
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);
    assert.equal(snapshots[0].paymentProofs.pendingCount, 2);
    assert.equal(snapshots[1].paymentProofs.pendingCount, 0);
  });

  it("F & G. open and overdue documents are derived canonically per event", () => {
    const events = [createEvent("evt-1"), createEvent("evt-2")];

    const docSentFuture = createInvoiceDocument("d1", "evt-1", { status: "sent", expiryDate: "2099-12-31" });
    const docSentOverdue = createInvoiceDocument("d2", "evt-1", { status: "sent", expiryDate: "2026-01-01" });
    const docPaid = createInvoiceDocument("d3", "evt-1", { status: "paid", expiryDate: "2026-01-01" });

    const docDraft = createInvoiceDocument("d4", "evt-2", { status: "draft" });

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {
        "evt-1": [docSentFuture, docSentOverdue, docPaid],
        "evt-2": [docDraft],
      },
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);

    // evt-1: 2 sent documents (openCount = 2), 1 overdue (overdueCount = 1)
    assert.equal(snapshots[0].documents.openCount, 2);
    assert.equal(snapshots[0].documents.overdueCount, 1);

    // evt-2: 1 draft document (openCount = 0, overdueCount = 0)
    assert.equal(snapshots[1].documents.openCount, 0);
    assert.equal(snapshots[1].documents.overdueCount, 0);
  });

  it("H. dateHold uses canonical isDateHoldActive semantics", () => {
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const pastDate = "2025-01-01T00:00:00.000Z";

    const events = [
      createEvent("evt-1", { dateHoldUntil: futureDate }),
      createEvent("evt-2", { dateHoldUntil: pastDate }),
      createEvent("evt-3", { dateHoldUntil: null }),
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);

    assert.equal(snapshots[0].dateHold.active, true);
    assert.equal(snapshots[0].dateHold.dateHoldUntil, futureDate);

    assert.equal(snapshots[1].dateHold.active, false);
    assert.equal(snapshots[1].dateHold.dateHoldUntil, pastDate);

    assert.equal(snapshots[2].dateHold.active, false);
    assert.equal(snapshots[2].dateHold.dateHoldUntil, null);
  });

  it("I. Sheets state is factual and does not classify no-connection as error", () => {
    const events = [
      createEvent("evt-1", {
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/abc",
        sheetsLastSyncedAt: "2026-08-19T10:00:00Z",
      }),
      createEvent("evt-2", {
        googleSheetUrl: "",
        sheetsLastSyncedAt: null,
      }),
    ];

    const source: EventPortfolioSourceData = {
      events,
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);

    assert.equal(snapshots[0].sheets.configured, true);
    assert.equal(snapshots[0].sheets.lastSyncedAt, "2026-08-19T10:00:00Z");

    assert.equal(snapshots[1].sheets.configured, false);
    assert.equal(snapshots[1].sheets.lastSyncedAt, null);
  });

  it("J. source objects are not mutated", () => {
    const event = createEvent("evt-1");
    const eventClone = { ...event };

    const source: EventPortfolioSourceData = {
      events: [event],
      guestStats: { "evt-1": createGuestStats() },
      conciergePendingByEvent: { "evt-1": 1 },
      paymentProofsPendingByEvent: { "evt-1": 1 },
      documentsByEvent: {},
    };

    buildEventPortfolioOperationalSnapshot(source);
    assert.deepEqual(event, eventClone);
  });

  it("K. empty events source returns safe empty array", () => {
    const source: EventPortfolioSourceData = {
      events: [],
      guestStats: {},
      conciergePendingByEvent: {},
      paymentProofsPendingByEvent: {},
      documentsByEvent: {},
    };

    const snapshots = buildEventPortfolioOperationalSnapshot(source);
    assert.deepEqual(snapshots, []);
  });
});
