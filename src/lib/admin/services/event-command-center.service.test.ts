import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { InvoiceDocument } from "@/lib/admin/types";
import type { EventStats, ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";
import {
  buildEventCommandCenterData,
  buildEventHealthSignals,
} from "@/lib/admin/services/event-command-center.service";

const event: ManagedEvent = {
  id: "event-1",
  businessId: "haxr-signature",
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
  sheetsLastSyncedAt: "2026-01-10T08:00:00.000Z",
  sheetsSyncSummary: "",
  sheetsSyncMode: "master",
  findSeatCode: "ANA2026",
  editionRegistryKey: "",
  postEventReportSentAt: null,
  dateHoldUntil: null,
  createdAt: "2026-01-05T12:00:00.000Z",
  updatedAt: "2026-01-05T12:00:00.000Z",
};

const guestStats: EventStats = {
  totalGuests: 100,
  invited: 20,
  confirmed: 60,
  checkedIn: 10,
  declined: 10,
  plusOnesTotal: 0,
  expectedAttendance: 70,
  unassignedGuests: 0,
  duplicateGuests: 0,
  assignedSeats: 50,
  totalSeats: 80,
  uniqueTables: 8,
  confirmationRate: 70,
  capacityUsed: 50,
  capacityAvailable: 30,
  groupCount: 2,
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
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-01-12T08:00:00.000Z",
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

describe("buildEventCommandCenterData", () => {
  it("calcula métricas financeiras e contagens operacionais", () => {
    const command = buildEventCommandCenterData({
      event,
      guestStats,
      documents: [baseDocument()],
      payments: [payment],
      conciergePending: 2,
      reviewOpen: 5,
    });

    assert.equal(command.financial.invoiced, 1160);
    assert.equal(command.financial.received, 500);
    assert.equal(command.financial.pending, 660);
    assert.equal(command.openInvoices, 1);
    assert.equal(command.conciergePending, 2);
    assert.equal(command.reviewOpen, 5);
  });
});

describe("buildEventHealthSignals", () => {
  it("gera sinais de saúde do evento", () => {
    const command = buildEventCommandCenterData({
      event,
      guestStats,
      documents: [baseDocument()],
      payments: [payment],
      conciergePending: 0,
      reviewOpen: 0,
    });

    const signals = buildEventHealthSignals(event, guestStats, command);
    assert.equal(signals.length, 6);
    assert.equal(signals[0].label, "Confirmação RSVP");
    assert.equal(signals[0].value, "70%");
    assert.equal(signals[0].tone, "good");
  });
});
