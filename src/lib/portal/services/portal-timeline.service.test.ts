import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";
import {
  buildPortalTimeline,
  getUpcomingPortalMilestone,
} from "@/lib/portal/services/portal-timeline.service";

const event: ManagedEvent = {
  id: "event-1",
  businessId: "haxr-signature",
  name: "Casamento Ana",
  type: "wedding",
  date: "2026-12-01",
  location: "Maputo",
  clientId: "client-1",
  clientName: "Ana Silva",
  notes: "",
  isActive: true,
  googleSheetUrl: "",
  googleSheetGid: "",
  sheetsLastSyncedAt: null,
  sheetsSyncSummary: "",
  sheetsSyncMode: "master",
  findSeatCode: "ANA2026",
  editionRegistryKey: "",
  postEventReportSentAt: null,
  dateHoldUntil: null,
  createdAt: "2026-01-05T12:00:00.000Z",
  updatedAt: "2026-01-05T12:00:00.000Z",
};

function baseDocument(
  overrides: Partial<InvoiceDocument> = {}
): InvoiceDocument {
    return {
    id: "doc-1",
    documentType: "proforma",
    documentNumber: "PF-2026-001",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "client-1",
    clientType: "individual",
    clientName: "Ana Silva",
    companyName: "",
    clientEmail: "ana@example.com",
    clientPhone: "",
    clientNuit: "",
    clientAddress: "",
    event: {
      eventId: "event-1",
      eventType: "wedding",
      eventName: "Casamento Ana",
      eventDate: "2026-06-01",
      eventLocation: "Maputo",
    },
    issueDate: "2026-01-10",
    expiryDate: "2026-02-10",
    notes: "",
    lineItems: [],
    totals: {
      subtotal: 1000,
      vatRate: 16,
      vatAmount: 160,
      grandTotal: 1160,
      includeVat: true,
      currency: "MZN",
    },
    issuerSignatureId: null,
    issuerName: "",
    issuerRole: "",
    issuerSignatureImage: "",
    pdfTemplate: "editorial_ivory",
    contactChannel: "financeiro",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
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

const payment: PaymentRecord = {
  id: "pay-1",
  businessId: "haxr-signature",
  amount: 500,
  currency: "MZN",
  paidAt: "2026-01-20T14:00:00.000Z",
  clientId: "client-1",
  clientName: "Ana Silva",
  eventId: "event-1",
  eventName: "Casamento Ana",
  documentId: "doc-1",
  documentNumber: "PF-2026-001",
  sourceDocumentId: "doc-1",
  sourceDocumentNumber: "PF-2026-001",
  paymentMethod: "bank_transfer",
  reference: "TRX-001",
  notes: "",
  createdAt: "2026-01-20T14:00:00.000Z",
};

describe("buildPortalTimeline", () => {
  it("agrega eventos, documentos, aprovações e pagamentos", () => {
    const timeline = buildPortalTimeline({
      events: [event],
      documents: [
        baseDocument({
          clientApprovalStatus: "approved",
          clientApprovedAt: "2026-01-15T10:00:00.000Z",
        }),
      ],
      payments: [payment],
    });

    const categories = timeline.map((entry) => entry.category);
    assert.ok(categories.includes("event"));
    assert.ok(categories.includes("document"));
    assert.ok(categories.includes("approval"));
    assert.ok(categories.includes("finance"));
  });

  it("ordena do mais recente para o mais antigo", () => {
    const timeline = buildPortalTimeline({
      events: [event],
      documents: [baseDocument()],
      payments: [payment],
    });

    for (let index = 1; index < timeline.length; index += 1) {
      const previous = new Date(timeline[index - 1].occurredAt).getTime();
      const current = new Date(timeline[index].occurredAt).getTime();
      assert.ok(previous >= current);
    }
  });
});

describe("getUpcomingPortalMilestone", () => {
  it("devolve o próximo evento futuro", () => {
    const futureEvent: ManagedEvent = {
      ...event,
      id: "event-future",
      name: "Evento Futuro",
      date: "2099-06-01",
    };
    const pastEvent: ManagedEvent = {
      ...event,
      id: "event-past",
      name: "Evento Passado",
      date: "2020-01-01",
    };

    const milestone = getUpcomingPortalMilestone([pastEvent, futureEvent]);
    assert.ok(milestone);
    assert.equal(milestone?.title, "Próximo evento: Evento Futuro");
  });
});
