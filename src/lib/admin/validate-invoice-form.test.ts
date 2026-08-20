import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePdfLogoPath,
  PDF_LOGO_FALLBACK,
  resolvePublicAssetUrl,
} from "./pdf-assets";
import {
  validateDocumentEmail,
  validateDocumentWhatsApp,
  validateInvoiceForm,
} from "./validate-invoice-form";
import { createEmptyLineItem } from "@/lib/invoice-generator";
import type { InvoiceFormData } from "@/lib/admin/types";

function baseForm(overrides: Partial<InvoiceFormData> = {}): InvoiceFormData {
  return {
    documentType: "invoice",
    documentNumber: "INV-2026-0001",
    businessId: "haxr-signature",
    status: "draft",
    currency: "MZN",
    pdfTemplate: "editorial_ivory",
    contactChannel: "financeiro",
    clientId: null,
    clientType: "individual",
    clientName: "Cliente Teste",
    companyName: "",
    clientNuit: "",
    clientEmail: "cliente@example.com",
    clientPhone: "258870883428",
    clientAddress: "",
    eventId: null,
    eventType: null,
    eventName: "",
    eventDate: null,
    eventLocation: "",
    issueDate: "2026-07-01",
    expiryDate: "2026-08-01",
    notes: "",
    lineItems: [
      {
        ...createEmptyLineItem(),
        description: "Serviço",
        quantity: 1,
        unitPrice: 1000,
        total: 1000,
      },
    ],
    includeVat: true,
    issuerSignatureId: null,
    issuerName: "",
    issuerRole: "",
    issuerSignatureImage: "",
    ...overrides,
  };
}

describe("pdf-assets", () => {
  it("usa fallback quando o logo horizontal não existe", () => {
    assert.equal(
      normalizePdfLogoPath(""),
      PDF_LOGO_FALLBACK
    );
  });

  it("resolve URL absoluta para assets relativos", () => {
    assert.equal(
      resolvePublicAssetUrl("/images/brand/haxr-horizontal-gold.png", "http://localhost:3000"),
      "http://localhost:3000/images/brand/haxr-horizontal-gold.png"
    );
  });
});

describe("validate-invoice-form", () => {
  it("aceita formulário válido", () => {
    assert.equal(validateInvoiceForm(baseForm()).ok, true);
  });

  it("rejeita cliente em branco", () => {
    const result = validateInvoiceForm(baseForm({ clientName: "  " }));
    assert.equal(result.ok, false);
  });

  it("rejeita linhas vazias", () => {
    const result = validateInvoiceForm(
      baseForm({
        lineItems: [createEmptyLineItem()],
      })
    );
    assert.equal(result.ok, false);
  });

  it("valida email para envio", () => {
    assert.equal(validateDocumentEmail(baseForm()).ok, true);
    assert.equal(
      validateDocumentEmail(baseForm({ clientEmail: "" })).ok,
      false
    );
  });

  it("valida telefone para WhatsApp", () => {
    assert.equal(
      validateDocumentWhatsApp(baseForm(), "258870883428").ok,
      true
    );
    assert.equal(
      validateDocumentWhatsApp(baseForm({ clientPhone: "" }), "").ok,
      false
    );
  });
});
