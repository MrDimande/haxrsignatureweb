import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canClientAccessPortalDocument } from "@/lib/portal/services/portal-client-match";
import type { Client, InvoiceDocument } from "@/lib/admin/types";
import {
  documentBelongsToPortalClient,
  normalizePortalClientName,
} from "@/lib/portal/services/portal-client-match";

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
    clientName: "Cliente Teste",
    companyName: "",
    clientEmail: "cliente@example.com",
    clientPhone: "",
    clientNuit: "",
    clientAddress: "",
    eventId: null,
    eventName: "",
    eventType: "wedding",
    eventDate: null,
    eventLocation: "",
    issueDate: "2026-01-01",
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

describe("canClientAccessPortalDocument", () => {
  const client = { id: "client-1", fullName: "Cliente Teste" };

  it("permite documento enviado do próprio cliente", () => {
    assert.equal(
      canClientAccessPortalDocument(client, baseDocument()),
      true
    );
  });

  it("permite documento pago do próprio cliente", () => {
    assert.equal(
      canClientAccessPortalDocument(
        client,
        baseDocument({ status: "paid" })
      ),
      true
    );
  });

  it("permite documento legado sem client_id mas com nome igual", () => {
    assert.equal(
      canClientAccessPortalDocument(
        client,
        baseDocument({ clientId: null, clientName: "Cliente Teste" })
      ),
      true
    );
  });

  it("bloqueia documento de outro cliente", () => {
    assert.equal(
      canClientAccessPortalDocument(
        { id: "client-2", fullName: "Outro" },
        baseDocument()
      ),
      false
    );
  });

  it("bloqueia rascunho mesmo do mesmo cliente", () => {
    assert.equal(
      canClientAccessPortalDocument(
        client,
        baseDocument({ status: "draft" })
      ),
      false
    );
  });

  it("bloqueia documento cancelado", () => {
    assert.equal(
      canClientAccessPortalDocument(
        client,
        baseDocument({ status: "cancelled" })
      ),
      false
    );
  });
});

describe("documentBelongsToPortalClient", () => {
  it("normaliza nomes para comparação", () => {
    assert.equal(
      documentBelongsToPortalClient(
        baseDocument({ clientId: null, clientName: "  CLIENTE teste " }),
        { id: "client-1", fullName: "cliente teste" }
      ),
      true
    );
    assert.equal(
      normalizePortalClientName("  A B "),
      "a b"
    );
  });
});
