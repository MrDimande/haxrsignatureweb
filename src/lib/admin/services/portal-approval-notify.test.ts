import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { InvoiceDocument } from "@/lib/admin/types";
import {
  buildPortalApprovalNotifyHtml,
  buildPortalApprovalNotifySubject,
} from "@/lib/admin/services/portal-approval-notify.service";

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
      eventName: "Casamento Ana & João",
      eventDate: "2026-10-01",
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
    clientApprovalStatus: "approved",
    clientApprovedAt: "2026-01-15T10:00:00.000Z",
    clientApprovalNote: null,
    ...overrides,
  };
}

describe("buildPortalApprovalNotifySubject", () => {
  it("inclui factura quando conversão automática ocorreu", () => {
    const subject = buildPortalApprovalNotifySubject({
      kind: "approved",
      document: baseDocument(),
      clientName: "Ana Silva",
      invoice: { id: "inv-1", documentNumber: "FT-2026-010" },
    });
    assert.match(subject, /aprovou proposta PF-2026-001/);
    assert.match(subject, /Factura FT-2026-010/);
  });

  it("assunto para pedido de alterações", () => {
    const subject = buildPortalApprovalNotifySubject({
      kind: "changes_requested",
      document: baseDocument({ clientApprovalStatus: "changes_requested" }),
      clientName: "Ana Silva",
      note: "Ajustar data",
    });
    assert.match(subject, /pediu alterações/);
    assert.match(subject, /PF-2026-001/);
  });
});

describe("buildPortalApprovalNotifyHtml", () => {
  it("inclui link admin e notas do cliente", () => {
    const html = buildPortalApprovalNotifyHtml({
      kind: "changes_requested",
      document: baseDocument({
        clientApprovalStatus: "changes_requested",
        clientApprovalNote: "Ajustar pacote",
      }),
      clientName: "Ana Silva",
      note: "Ajustar pacote",
    });

    assert.match(html, /admin\/documents\/doc-1/);
    assert.match(html, /Ajustar pacote/);
    assert.match(html, /Alterações pedidas no portal/);
  });
});
