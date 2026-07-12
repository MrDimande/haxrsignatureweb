import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildClientTimeline } from "@/lib/admin/services/client-timeline.service";
import type { Client, InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";

const client: Client = {
  id: "client-1",
  fullName: "Ana Silva",
  clientType: "individual",
  companyName: "",
  nuit: "",
  email: "ana@example.com",
  phone: "",
  address: "",
  portalToken: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

const event: ManagedEvent = {
  id: "event-1",
  businessId: "haxr",
  name: "Casamento Ana",
  type: "wedding",
  date: "2026-06-01",
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
  createdAt: "2026-01-05T12:00:00.000Z",
  updatedAt: "2026-01-05T12:00:00.000Z",
};

function baseDocument(
  overrides: Partial<InvoiceDocument> = {}
): InvoiceDocument {
  return {
    id: "doc-1",
    documentType: "invoice",
    documentNumber: "FT-2026-001",
    businessId: "haxr",
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
    eventId: "event-1",
    eventName: "Casamento Ana",
    eventType: "wedding",
    eventDate: "2026-06-01",
    eventLocation: "Maputo",
    issueDate: "2026-01-10",
    dueDate: "2026-01-31",
    validityDate: null,
    notes: "",
    terms: "",
    includeVat: true,
    lineItems: [],
    totals: {
      subtotal: 1000,
      vatAmount: 160,
      grandTotal: 1160,
      currency: "MZN",
    },
    issuerName: "",
    issuerRole: "",
    issuerSignatureImage: null,
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-01-12T08:00:00.000Z",
    pdfGeneratedAt: null,
    convertedFromDocumentId: null,
    emailSentAt: "2026-01-12T09:00:00.000Z",
    whatsappSharedAt: null,
    clientApprovalStatus: null,
    clientApprovedAt: null,
    clientApprovalNote: null,
    ...overrides,
  };
}

const payment: PaymentRecord = {
  id: "pay-1",
  businessId: "haxr",
  amount: 500,
  currency: "MZN",
  paidAt: "2026-01-20T14:00:00.000Z",
  clientId: "client-1",
  clientName: "Ana Silva",
  eventId: "event-1",
  eventName: "Casamento Ana",
  documentId: "doc-1",
  documentNumber: "FT-2026-001",
  sourceDocumentId: "doc-1",
  sourceDocumentNumber: "FT-2026-001",
  paymentMethod: "transfer",
  reference: "TRX-001",
  notes: "",
  createdAt: "2026-01-20T14:00:00.000Z",
};

describe("buildClientTimeline", () => {
  it("agrega eventos, documentos, envios e pagamentos", () => {
    const timeline = buildClientTimeline({
      client,
      events: [event],
      documents: [baseDocument()],
      payments: [payment],
    });

    const kinds = timeline.map((entry) => entry.kind);
    assert.ok(kinds.includes("client_created"));
    assert.ok(kinds.includes("event_created"));
    assert.ok(kinds.includes("document_created"));
    assert.ok(kinds.includes("email_sent"));
    assert.ok(kinds.includes("payment_received"));
  });

  it("ordena do mais recente para o mais antigo", () => {
    const timeline = buildClientTimeline({
      client,
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

  it("inclui conversão de proforma", () => {
    const timeline = buildClientTimeline({
      client,
      events: [],
      documents: [
        baseDocument({
          id: "doc-2",
          documentNumber: "FT-2026-002",
          convertedFromDocumentId: "doc-1",
        }),
      ],
      payments: [],
    });

    assert.ok(
      timeline.some((entry) => entry.kind === "proforma_converted")
    );
  });
});
