import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { InvoiceDocument } from "@/lib/admin/types";
import {
  canPortalApproveDocument,
  isPortalApprovalPending,
  portalApprovalLabel,
} from "@/lib/portal/services/portal-approval-rules";

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

describe("isPortalApprovalPending", () => {
  it("proforma enviada sem decisão está pendente", () => {
    assert.equal(isPortalApprovalPending(baseDocument()), true);
  });

  it("factura enviada não está pendente", () => {
    assert.equal(
      isPortalApprovalPending(baseDocument({ documentType: "invoice" })),
      false
    );
  });

  it("proforma aprovada não está pendente", () => {
    assert.equal(
      isPortalApprovalPending(
        baseDocument({ clientApprovalStatus: "approved" })
      ),
      false
    );
  });

  it("proforma com alterações pedidas não está pendente", () => {
    assert.equal(
      isPortalApprovalPending(
        baseDocument({ clientApprovalStatus: "changes_requested" })
      ),
      false
    );
  });
});

describe("canPortalApproveDocument", () => {
  it("só permite aprovar proforma pendente", () => {
    assert.equal(canPortalApproveDocument(baseDocument()), true);
    assert.equal(
      canPortalApproveDocument(baseDocument({ status: "draft" })),
      false
    );
  });
});

describe("portalApprovalLabel", () => {
  it("traduz estados de aprovação", () => {
    assert.equal(portalApprovalLabel("pending"), "Aguarda aprovação");
    assert.equal(portalApprovalLabel("approved"), "Aprovada");
    assert.equal(portalApprovalLabel("changes_requested"), "Alterações pedidas");
    assert.equal(portalApprovalLabel(null), "Sem aprovação");
  });
});
