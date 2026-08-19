import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { InvoiceDocument } from "@/lib/admin/types";
import {
  buildPortalApprovalAlerts,
  countPortalApprovalsPending,
  countPortalClientResponses,
} from "@/lib/admin/services/portal-approval-alerts";

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
    issueDate: "2026-01-01",
    expiryDate: "2026-01-31",
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

describe("buildPortalApprovalAlerts", () => {
  it("cria alerta com requiresAction=true quando cliente aprova proposta ainda não convertida", () => {
    const alerts = buildPortalApprovalAlerts({
      documents: [
        baseDocument({
          clientApprovalStatus: "approved",
          clientApprovedAt: "2026-01-15T10:00:00.000Z",
        }),
      ],
      relativeTime: () => "Há 1 h",
    });

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].id, "portal-approved-doc-1");
    assert.match(alerts[0].text, /aprovou a proposta/);
    assert.equal(alerts[0].href, "/admin/documents/doc-1");
    assert.equal(alerts[0].source, "portal");
    assert.equal(alerts[0].requiresAction, true);
  });

  it("cria alerta com requiresAction=false quando proposta aprovada já tem factura convertida", () => {
    const alerts = buildPortalApprovalAlerts({
      documents: [
        baseDocument({
          id: "doc-proforma-1",
          documentType: "proforma",
          clientApprovalStatus: "approved",
          clientApprovedAt: "2026-01-15T10:00:00.000Z",
        }),
        baseDocument({
          id: "doc-invoice-1",
          documentType: "invoice",
          convertedFromDocumentId: "doc-proforma-1",
          clientApprovalStatus: null,
          clientApprovedAt: null,
        }),
      ],
      relativeTime: () => "Há 2 h",
    });

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].id, "portal-approved-doc-proforma-1");
    assert.equal(alerts[0].requiresAction, false);
  });

  it("cria alerta com requiresAction=true quando cliente pede alterações", () => {
    const alerts = buildPortalApprovalAlerts({
      documents: [
        baseDocument({
          clientApprovalStatus: "changes_requested",
          clientApprovedAt: "2026-01-15T10:00:00.000Z",
          clientApprovalNote: "Ajustar data",
        }),
      ],
      relativeTime: () => "Agora",
    });

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].id, "portal-changes-doc-1");
    assert.match(alerts[0].text, /pediu alterações/);
    assert.match(alerts[0].text, /Ajustar data/);
    assert.equal(alerts[0].source, "portal");
    assert.equal(alerts[0].requiresAction, true);
  });
});

describe("portal approval badge counts", () => {
  it("conta propostas aguardando cliente", () => {
    assert.equal(
      countPortalApprovalsPending([
        baseDocument({ clientApprovalStatus: "pending" }),
        baseDocument({ id: "doc-2", clientApprovalStatus: "approved" }),
      ]),
      1
    );
  });

  it("conta respostas do cliente para follow-up admin", () => {
    assert.equal(
      countPortalClientResponses([
        baseDocument({ clientApprovalStatus: "approved" }),
        baseDocument({
          id: "doc-2",
          clientApprovalStatus: "changes_requested",
        }),
        baseDocument({ id: "doc-3", clientApprovalStatus: "pending" }),
      ]),
      2
    );
  });
});
