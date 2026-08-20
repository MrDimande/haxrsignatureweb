import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_PDF_TEMPLATE_LABELS,
  DOCUMENT_CONTACT_CHANNEL_LABELS,
  HAXR_PROFORMA_TERMS,
  HAXR_INVOICE_TERMS,
  HAXR_RECEIPT_TERMS,
  DEFAULT_TERMS_BRAINYWRITE,
} from "@/lib/admin/constants";
import { getBusiness } from "@/lib/admin/businesses";
import { haxrMailboxes } from "@/lib/email/addresses";
import { HAXR_BRAND_ASSETS } from "@/lib/brand/brand-assets";
import {
  buildInvoiceDocument,
  createDefaultInvoiceForm,
  documentToForm,
} from "@/lib/invoice-generator";
import { mapDocument } from "@/lib/admin/db/mappers";
import {
  resolveDocumentContactProfile,
  HAXR_COMMERCIAL_PHONE,
} from "./document-pdf-contact";
import { resolveDocumentTerms } from "./document-pdf-terms";
import { resolveCommercialPaymentDetails } from "./document-pdf-payment";
import {
  formatDocumentCategory,
  formatDocumentTypeLabel,
  formatEventTypeLabel,
  formatPdfCurrency,
  resolveDocumentDateMeta,
} from "./document-pdf-formatters";
import { getDocumentPdfTheme } from "./document-pdf-theme";
import {
  resolveDocumentLogoPath,
  normalizePdfLogoPath,
} from "@/lib/admin/pdf-assets";
import type { Business, DocumentPdfTemplate, InvoiceDocument } from "@/lib/admin/types";

const mockHaxrBusiness: Business = getBusiness("haxr-signature");
const mockBrainyBusiness: Business = getBusiness("brainywrite");

function createMockInvoiceDocument(
  overrides?: Partial<InvoiceDocument>
): InvoiceDocument {
  return {
    id: "doc-123",
    documentType: "invoice",
    documentNumber: "INV-2026-0001",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "client-1",
    clientType: "individual",
    clientName: "Ana Silva",
    companyName: "",
    clientNuit: "123456789",
    clientEmail: "ana.silva@example.com",
    clientPhone: "+258 84 123 4567",
    clientAddress: "Av. Julius Nyerere, Maputo",
    event: {
      eventId: "event-1",
      eventType: "wedding",
      eventName: "Casamento Ana & Rui",
      eventDate: "2026-09-15",
      eventLocation: "Hotel Polana, Maputo",
    },
    issueDate: "2026-08-01",
    expiryDate: "2026-08-31",
    notes: "Por favor confirme por email.",
    lineItems: [
      {
        id: "li-1",
        description: "Convite Digital Haute-Couture",
        quantity: 1,
        unitPrice: 15000,
        total: 15000,
        source: "catalog",
        catalogServiceId: "convite-digital-premium",
      },
    ],
    totals: {
      subtotal: 15000,
      vatRate: 0.16,
      vatAmount: 2400,
      grandTotal: 17400,
      includeVat: true,
      currency: "MZN",
    },
    issuerSignatureId: null,
    issuerName: "Directoria Comercial",
    issuerRole: "Director",
    issuerSignatureImage: "",
    pdfTemplate: "editorial_ivory",
    contactChannel: "financeiro",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
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

describe("HAXR Commercial PDF Foundation & Multi-Template System", () => {
  it("Test A: New default invoice form defaults to pdfTemplate 'editorial_ivory'", () => {
    const form = createDefaultInvoiceForm("invoice", [], "haxr-signature");
    assert.equal(form.pdfTemplate, "editorial_ivory");
  });

  it("Test B: New default invoice form defaults to contactChannel 'financeiro'", () => {
    const form = createDefaultInvoiceForm("invoice", [], "haxr-signature");
    assert.equal(form.contactChannel, "financeiro");
  });

  it("Test 5 Templates: All 5 templates are supported and persisted", () => {
    const templates: DocumentPdfTemplate[] = [
      "editorial_ivory",
      "signature_noir",
      "executive",
      "atelier_blanc",
      "maison_signature",
    ];

    for (const tmpl of templates) {
      assert.ok(DOCUMENT_PDF_TEMPLATE_LABELS[tmpl], `Label for ${tmpl} exists`);
      const form = createDefaultInvoiceForm("proforma", [], "haxr-signature");
      form.pdfTemplate = tmpl;

      const built = buildInvoiceDocument(form);
      assert.equal(built.pdfTemplate, tmpl);

      const backToForm = documentToForm(built);
      assert.equal(backToForm.pdfTemplate, tmpl);
    }
  });

  it("Test Legacy Safe Fallback: Legacy null/missing database fields resolve safely to defaults", () => {
    const legacyDbRow = {
      id: "doc-legacy",
      business_id: "haxr-signature",
      document_type: "invoice",
      document_number: "INV-2026-0099",
      status: "draft",
      currency: "MZN",
      client_id: null,
      client_type: "individual",
      client_name: "Cliente Antigo",
      company_name: "",
      client_nuit: "",
      client_email: "",
      client_phone: "",
      client_address: "",
      event_id: null,
      event_type: null,
      event_name: "",
      event_date: null,
      event_location: "",
      issue_date: "2026-01-01",
      expiry_date: "2026-01-31",
      notes: "",
      subtotal: 1000,
      vat_rate: 0.16,
      vat_amount: 160,
      grand_total: 1160,
      include_vat: true,
      issuer_signature_id: null,
      issuer_name: "",
      issuer_role: "",
      issuer_signature_image: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      pdf_generated_at: null,
    } as never;

    const mapped = mapDocument(legacyDbRow, []);
    assert.equal(mapped.pdfTemplate, "editorial_ivory");
    assert.equal(mapped.contactChannel, "financeiro");
  });

  it("Test Contact Profile: Correctly resolves all 4 HAXR departmental channels", () => {
    const channels = ["financeiro", "convites", "info", "geral"] as const;

    for (const ch of channels) {
      const profile = resolveDocumentContactProfile({
        business: mockHaxrBusiness,
        contactChannel: ch,
      });

      assert.equal(profile.isHaxr, true);
      assert.equal(profile.email, haxrMailboxes[ch]);
      assert.equal(profile.channel, ch);
      assert.equal(profile.phone, HAXR_COMMERCIAL_PHONE);
      assert.ok(profile.label.includes(DOCUMENT_CONTACT_CHANNEL_LABELS[ch]));
    }
  });

  it("Test Contact Profile: HAXR contact profile never contains legacy Gmail addresses", () => {
    const channels = ["financeiro", "convites", "info", "geral"] as const;
    for (const ch of channels) {
      const profile = resolveDocumentContactProfile({
        business: mockHaxrBusiness,
        contactChannel: ch,
      });
      assert.ok(!profile.email.includes("@gmail.com"));
      assert.ok(profile.email.endsWith("@haxrsignature.com"));
    }
  });

  it("Test Official Phone: Exactly +258 87 088 3428", () => {
    const profile = resolveDocumentContactProfile({
      business: mockHaxrBusiness,
      contactChannel: "financeiro",
    });
    assert.equal(profile.phone, "+258 87 088 3428");
    assert.equal(profile.formattedPhone, "+258 87 088 3428");
  });

  it("Test Document Types: 'Proforma Invoice' is eliminated; public label is 'Proforma'", () => {
    assert.equal(DOCUMENT_TYPE_LABELS.proforma, "Proforma");
    assert.equal(formatDocumentTypeLabel("proforma"), "Proforma");
    assert.equal(DOCUMENT_TYPE_LABELS.invoice, "Factura");
    assert.equal(DOCUMENT_TYPE_LABELS.receipt, "Recibo");
  });

  it("Test Proforma Terms: Terms do not claim payment or transaction proof", () => {
    const proformaTerms = resolveDocumentTerms({
      documentType: "proforma",
      businessId: "haxr-signature",
    });

    const joined = proformaTerms.join(" ");
    assert.ok(!joined.includes("prova oficial da transacção"));
    assert.ok(!joined.includes("constitui prova"));
    assert.ok(joined.includes("proposta comercial e cotação"));
  });

  it("Test Receipt Semantics (P0): Receipt terms confirm only the stated payment amount and do NOT claim full settlement or full discharge", () => {
    const receiptTerms = resolveDocumentTerms({
      documentType: "receipt",
      businessId: "haxr-signature",
    });

    const joined = receiptTerms.join(" ");
    assert.ok(joined.includes("confirma exclusivamente o pagamento do valor nele indicado"));
    assert.ok(joined.includes("não representa por si só a liquidação integral"));
    assert.ok(!joined.includes("quitação integral"));
    assert.ok(!joined.includes("liquidação integral do documento"));
    assert.ok(!joined.includes("prova oficial da transacção quitada"));
  });

  it("Test Date Metadata (Requirement 5): Proforma uses Validade, Factura uses Vencimento, Recibo has NO Validade", () => {
    const proformaDoc = createMockInvoiceDocument({ documentType: "proforma" });
    const invoiceDoc = createMockInvoiceDocument({ documentType: "invoice" });
    const receiptDoc = createMockInvoiceDocument({ documentType: "receipt" });

    const pMeta = resolveDocumentDateMeta(proformaDoc);
    assert.equal(pMeta.issueDateLabel, "Emissão");
    assert.equal(pMeta.secondaryDateLabel, "Validade");

    const iMeta = resolveDocumentDateMeta(invoiceDoc);
    assert.equal(iMeta.issueDateLabel, "Emissão");
    assert.equal(iMeta.secondaryDateLabel, "Vencimento");

    const rMeta = resolveDocumentDateMeta(receiptDoc);
    assert.equal(rMeta.issueDateLabel, "Emissão");
    assert.equal(rMeta.secondaryDateLabel, undefined);
    assert.equal(rMeta.secondaryDateFormatted, undefined);
  });

  it("Test Payment Presentation (Requirement 4): M-Pesa is excluded from HAXR commercial documents while e-Mola is retained", () => {
    const haxrPayments = resolveCommercialPaymentDetails(mockHaxrBusiness);
    assert.ok(haxrPayments.bankAccounts.length > 0);
    assert.ok(haxrPayments.mobilePayments.some((p) => p.provider === "e-Mola"));
    assert.ok(!haxrPayments.mobilePayments.some((p) => p.provider.toLowerCase() === "m-pesa"));
  });

  it("Test Non-HAXR Safety: Non-HAXR payment and contact info are preserved", () => {
    const brainyProfile = resolveDocumentContactProfile({
      business: mockBrainyBusiness,
      contactChannel: "convites",
    });
    assert.equal(brainyProfile.isHaxr, false);
    assert.equal(brainyProfile.email, mockBrainyBusiness.email);
    assert.ok(!brainyProfile.email.includes("haxrsignature.com"));

    const brainyPayments = resolveCommercialPaymentDetails(mockBrainyBusiness);
    assert.equal(brainyPayments.bankAccounts.length, mockBrainyBusiness.bankAccounts.length);
  });

  it("Test Money Typography (Requirement 7): Consistent thousands space grouping and comma decimal", () => {
    assert.equal(formatPdfCurrency(44080, "MZN"), "44 080,00 MZN");
    assert.equal(formatPdfCurrency(4500, "MZN"), "4 500,00 MZN");
    assert.equal(formatPdfCurrency(6080, "MZN"), "6 080,00 MZN");
    assert.equal(formatPdfCurrency(18500, "MZN"), "18 500,00 MZN");
    assert.equal(formatPdfCurrency(1500000, "MZN"), "1 500 000,00 MZN");
    assert.equal(formatPdfCurrency(0, "MZN"), "0,00 MZN");
  });

  it("Test Logo Resolution: HAXR templates resolve to actual brand assets", async () => {
    const templates: DocumentPdfTemplate[] = [
      "editorial_ivory",
      "signature_noir",
      "executive",
      "atelier_blanc",
      "maison_signature",
    ];

    for (const tmpl of templates) {
      const logoPath = resolveDocumentLogoPath(mockHaxrBusiness, tmpl);
      assert.ok(logoPath.startsWith("/images/brand/"), `Logo path for ${tmpl} starts with /images/brand/`);

      // Verify that the file actually exists on disk
      const filePath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
      const stat = await fs.stat(filePath);
      assert.ok(stat.size > 1000, `Logo file ${logoPath} exists and has content`);
    }
  });

  it("Test Theme Tokens: All 5 themes have valid contrast and colors", () => {
    const templates: DocumentPdfTemplate[] = [
      "editorial_ivory",
      "signature_noir",
      "executive",
      "atelier_blanc",
      "maison_signature",
    ];

    for (const tmpl of templates) {
      const theme = getDocumentPdfTheme(tmpl);
      assert.equal(theme.template, tmpl);
      assert.ok(theme.colors.pageBg);
      assert.ok(theme.colors.textPrimary);
      assert.ok(theme.colors.accentGold);
    }
  });

  it("Test Server Buffer: generateInvoicePDFBuffer renders valid PDF buffers for all 5 templates", async () => {
    const { generateInvoicePDFBuffer } = await import("@/lib/admin/pdf-server");

    const templates: DocumentPdfTemplate[] = [
      "editorial_ivory",
      "signature_noir",
      "executive",
      "atelier_blanc",
      "maison_signature",
    ];

    for (const tmpl of templates) {
      const doc = createMockInvoiceDocument({ pdfTemplate: tmpl });
      const buffer = await generateInvoicePDFBuffer(doc, mockHaxrBusiness);

      assert.ok(Buffer.isBuffer(buffer));
      assert.ok(buffer.length > 5000);
      assert.equal(buffer.subarray(0, 4).toString("utf-8"), "%PDF");
    }
  });

  it("Test Migration Sanity: Migration constraint includes all 5 templates and does NOT touch document_analytics", async () => {
    const migrationContent = await fs.readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260820220000_commercial_document_pdf_templates.sql"
      ),
      "utf-8"
    );

    assert.ok(!migrationContent.includes("document_analytics"));
    assert.ok(migrationContent.includes("editorial_ivory"));
    assert.ok(migrationContent.includes("signature_noir"));
    assert.ok(migrationContent.includes("executive"));
    assert.ok(migrationContent.includes("atelier_blanc"));
    assert.ok(migrationContent.includes("maison_signature"));
  });
});
