import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import InvoicePDFDocModule from "../src/components/admin/InvoicePDFDocument.tsx";
import { getBusiness } from "../src/lib/admin/businesses.ts";
import {
  resolveDocumentLogoPath,
  normalizePdfLogoPath,
} from "../src/lib/admin/pdf-assets.ts";

const InvoicePDFDocument = InvoicePDFDocModule.default || InvoicePDFDocModule;

const outputDir = path.join(process.cwd(), ".qa-pdf-output");
await fs.mkdir(outputDir, { recursive: true });

async function loadLocalLogoBase64(logoPath) {
  const normalized = normalizePdfLogoPath(logoPath);
  const relativePath = normalized.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relativePath);
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

const haxrBusiness = getBusiness("haxr-signature");
const brainyBusiness = getBusiness("brainywrite");

const baseDoc = {
  id: "doc-qa-base",
  documentType: "proforma",
  documentNumber: "HAXR-PRO-2026-0001",
  businessId: "haxr-signature",
  status: "sent",
  currency: "MZN",
  clientId: "c-1",
  clientType: "individual",
  clientName: "Carolina & Mário",
  companyName: "",
  clientNuit: "189234567",
  clientEmail: "carolina.mario@example.com",
  clientPhone: "+258 84 999 8888",
  clientAddress: "Av. Julius Nyerere, Polana, Maputo",
  event: {
    eventId: "e-1",
    eventType: "wedding",
    eventName: "Casamento Real Carolina & Mário",
    eventDate: "2026-11-28",
    eventLocation: "Hotel Polana Serena, Maputo",
  },
  issueDate: "2026-08-20",
  expiryDate: "2026-09-20",
  notes: "Proposta comercial válida por 30 dias. Agradecemos a preferência.",
  lineItems: [
    {
      id: "li-1",
      description: "Convite Digital Haute-Couture com RSVP Interativo",
      quantity: 1,
      unitPrice: 18500,
      total: 18500,
      source: "catalog",
    },
    {
      id: "li-2",
      description: "Save The Date Digital com Animação Editorial",
      quantity: 1,
      unitPrice: 4500,
      total: 4500,
      source: "catalog",
    },
    {
      id: "li-3",
      description: "Identidade Visual de Casamento & Paleta Nobre",
      quantity: 1,
      unitPrice: 15000,
      total: 15000,
      source: "catalog",
    },
  ],
  totals: {
    subtotal: 38000,
    vatRate: 0.16,
    vatAmount: 6080,
    grandTotal: 44080,
    includeVat: true,
    currency: "MZN",
  },
  issuerSignatureId: null,
  issuerName: "Directoria Comercial",
  issuerRole: "Curadoria de Assinatura",
  issuerSignatureImage: "",
  pdfTemplate: "editorial_ivory",
  contactChannel: "convites",
  createdAt: "2026-08-20T10:00:00Z",
  updatedAt: "2026-08-20T10:00:00Z",
  pdfGeneratedAt: null,
  convertedFromDocumentId: null,
  emailSentAt: null,
  whatsappSharedAt: null,
  clientApprovalStatus: null,
  clientApprovedAt: null,
  clientApprovalNote: null,
};

// ── FIXTURE 01: Proforma · Editorial Marfim (Single Page, Real Gold Logo, Wedding Event) ──
console.log("Generating 01_proforma_editorial_ivory.pdf...");
const logo01 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "editorial_ivory")
);
await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      pdfTemplate: "editorial_ivory",
      contactChannel: "convites",
      documentType: "proforma",
      documentNumber: "HAXR-PRO-2026-0001",
      notes: "Proposta comercial válida por 30 dias. Agradecemos a preferência.",
    },
    business: haxrBusiness,
    logoUrl: logo01,
  }),
  path.join(outputDir, "01_proforma_editorial_ivory.pdf")
);

// ── FIXTURE 02: Factura multipage · Signature Noir (12 items, Real Gold Logo, Intentional Closure) ──
console.log("Generating 02_factura_signature_noir_multipage.pdf...");
const logo02 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "signature_noir")
);
const multiPageLines = Array.from({ length: 12 }, (_, i) => ({
  id: `li-multi-${i + 1}`,
  description: `Produção Editorial Nº ${i + 1} — Curadoria de Alta-Costura Digital HAXR`,
  quantity: 1,
  unitPrice: 5000 + i * 1200,
  total: 5000 + i * 1200,
  source: "manual",
}));
const multiSubtotal = multiPageLines.reduce((acc, curr) => acc + curr.total, 0);

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "invoice",
      documentNumber: "HAXR-INV-2026-0042",
      pdfTemplate: "signature_noir",
      contactChannel: "financeiro",
      status: "sent",
      notes: "Agradecemos a sua preferência. Por favor indique o número desta factura no descritivo do pagamento.",
      lineItems: multiPageLines,
      totals: {
        subtotal: multiSubtotal,
        vatRate: 0.16,
        vatAmount: multiSubtotal * 0.16,
        grandTotal: multiSubtotal * 1.16,
        includeVat: true,
        currency: "MZN",
      },
    },
    business: haxrBusiness,
    logoUrl: logo02,
  }),
  path.join(outputDir, "02_factura_signature_noir_multipage.pdf")
);

// ── FIXTURE 03: Recibo partial payment · Executive (No Event, No Mobile, No Validade field) ──
console.log("Generating 03_recibo_executive_partial_payment.pdf...");
const logo03 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "executive")
);
const receiptPartialDoc = {
  ...baseDoc,
  documentType: "receipt",
  documentNumber: "HAXR-REC-2026-0015",
  pdfTemplate: "executive",
  contactChannel: "geral",
  status: "paid",
  event: { eventId: null, eventType: null, eventName: "", eventDate: null, eventLocation: "" },
  notes: "Liquidação parcial de 30.000 MZN referente à Factura HAXR-INV-2026-0042.",
  lineItems: [
    {
      id: "li-rec-1",
      description: "Pagamento Parcial (Tranche 1/3) — Factura HAXR-INV-2026-0042",
      quantity: 1,
      unitPrice: 30000,
      total: 30000,
      source: "manual",
    },
  ],
  totals: {
    subtotal: 30000,
    vatRate: 0,
    vatAmount: 0,
    grandTotal: 30000,
    includeVat: false,
    currency: "MZN",
  },
  issuerSignatureImage: "",
};

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: receiptPartialDoc,
    business: {
      ...haxrBusiness,
      mobilePayments: [],
    },
    logoUrl: logo03,
  }),
  path.join(outputDir, "03_recibo_executive_partial_payment.pdf")
);

// ── FIXTURE 04: Factura · Atelier Blanc (Pure White Luxury Stationery, Hairlines) ──
console.log("Generating 04_factura_atelier_blanc.pdf...");
const logo04 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "atelier_blanc")
);
await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "invoice",
      documentNumber: "HAXR-INV-2026-0099",
      pdfTemplate: "atelier_blanc",
      contactChannel: "financeiro",
      status: "sent",
      notes: "Agradecemos a sua preferência. Documento emitido nos termos contratuais acordados.",
    },
    business: haxrBusiness,
    logoUrl: logo04,
  }),
  path.join(outputDir, "04_factura_atelier_blanc.pdf")
);

// ── FIXTURE 05: Proforma multipage · Maison Signature (Alabaster, Asymmetric, Vertical Logo) ──
console.log("Generating 05_proforma_maison_signature_multipage.pdf...");
const logo05 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "maison_signature")
);
const maisonLines = Array.from({ length: 16 }, (_, i) => ({
  id: `li-maison-${i + 1}`,
  description: `Elemento de Alta-Costura e Design Editorial Nº ${i + 1} — Suite Real`,
  quantity: 1,
  unitPrice: 8500 + i * 1500,
  total: 8500 + i * 1500,
  source: "catalog",
}));
const maisonSubtotal = maisonLines.reduce((acc, curr) => acc + curr.total, 0);

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "proforma",
      documentNumber: "HAXR-PRO-2026-0077",
      pdfTemplate: "maison_signature",
      contactChannel: "convites",
      status: "sent",
      notes: "Proposta exclusiva de alta curadoria editorial. Válida por 30 dias.",
      lineItems: maisonLines,
      totals: {
        subtotal: maisonSubtotal,
        vatRate: 0.16,
        vatAmount: maisonSubtotal * 0.16,
        grandTotal: maisonSubtotal * 1.16,
        includeVat: true,
        currency: "MZN",
      },
    },
    business: haxrBusiness,
    logoUrl: logo05,
    watermarkUrl: await loadLocalLogoBase64("/images/brand/haxr-mark-gold.png"),
  }),
  path.join(outputDir, "05_proforma_maison_signature_multipage.pdf")
);

// ── FIXTURE 06: Factura · Editorial Marfim (Pagination Boundary Case) ──
console.log("Generating 06_factura_editorial_ivory_pagination_boundary.pdf...");
const boundaryLines = Array.from({ length: 6 }, (_, i) => ({
  id: `li-bound-${i + 1}`,
  description: `Serviço Especializado de Assessoria & Produção Nº ${i + 1}`,
  quantity: 1,
  unitPrice: 7500,
  total: 7500,
  source: "catalog",
}));
const boundSubtotal = boundaryLines.reduce((acc, curr) => acc + curr.total, 0);

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "invoice",
      documentNumber: "HAXR-INV-2026-0088",
      pdfTemplate: "editorial_ivory",
      contactChannel: "financeiro",
      status: "sent",
      notes: "Agradecemos a sua preferência. Por favor indique o número desta factura no descritivo do pagamento.",
      lineItems: boundaryLines,
      totals: {
        subtotal: boundSubtotal,
        vatRate: 0.16,
        vatAmount: boundSubtotal * 0.16,
        grandTotal: boundSubtotal * 1.16,
        includeVat: true,
        currency: "MZN",
      },
    },
    business: haxrBusiness,
    logoUrl: logo01,
  }),
  path.join(outputDir, "06_factura_editorial_ivory_pagination_boundary.pdf")
);

// ── FIXTURE 07: BrainyWrite (Non-HAXR Business Safety) ──
console.log("Generating 07_brainywrite_invoice_non_haxr.pdf...");
const logo07 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(brainyBusiness, "editorial_ivory")
);
await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      businessId: "brainywrite",
      documentType: "invoice",
      documentNumber: "BW-INV-2026-0008",
      pdfTemplate: "editorial_ivory",
      contactChannel: "financeiro",
      notes: "Trabalhos de redacção e consultoria técnica.",
    },
    business: brainyBusiness,
    logoUrl: logo07,
  }),
  path.join(outputDir, "07_brainywrite_invoice_non_haxr.pdf")
);

// ── FIXTURE 08: Stress Multipage Pagination Safety Gate ──
console.log("Generating 08_stress_multipage_long_terms_notes.pdf...");
const logo08 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "signature_noir")
);
const stressLines = Array.from({ length: 14 }, (_, i) => ({
  id: `li-stress-${i + 1}`,
  description: `Serviço de Produção e Consultoria de Alta-Costura Digital Nº ${i + 1} — Especificação Detalhada e Revisão Contínua`,
  quantity: 1,
  unitPrice: 6500 + i * 850,
  total: 6500 + i * 850,
  source: "catalog",
}));
const stressSubtotal = stressLines.reduce((acc, curr) => acc + curr.total, 0);

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "invoice",
      documentNumber: "HAXR-INV-2026-STRESS-01",
      pdfTemplate: "signature_noir",
      contactChannel: "financeiro",
      status: "sent",
      notes:
        "ESTRESSE DE OBSERVAÇÕES: Agradecemos sinceramente a preferência pela HAXR Signature. Todos os serviços incluídos nesta proposta seguem rigorosos padrões institucionais de curadoria e produção. Por favor certifique-se de validar os dados bancários antes da transferência. Em caso de dúvidas, contacte directamente a nossa directoria comercial.",
      lineItems: stressLines,
      totals: {
        subtotal: stressSubtotal,
        vatRate: 0.16,
        vatAmount: stressSubtotal * 0.16,
        grandTotal: stressSubtotal * 1.16,
        includeVat: true,
        currency: "MZN",
      },
    },
    business: haxrBusiness,
    logoUrl: logo08,
  }),
  path.join(outputDir, "08_stress_multipage_long_terms_notes.pdf")
);

// ── FIXTURE 09: Long Observations Flow Proof (Pagination Stress Gate) ──
console.log("Generating 09_stress_long_observations_flow.pdf...");
const logo09 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "editorial_ivory")
);
const longObsParagraphs = Array.from({ length: 8 }, (_, i) => 
  `Cláusula Operacional Nº ${i + 1}: Esta proposta contempla curadoria e direção de arte completa para o evento, integrando design gráfico de alta distinção, consultoria de materiais nobres, tipografia refinada e acabamentos manuais personalizados. Todos os detalhes foram concebidos sob medida para garantir a máxima excelência institucional e conformidade com as diretrizes acordadas.`
).join("\n\n");

await renderToFile(
  React.createElement(InvoicePDFDocument, {
    document: {
      ...baseDoc,
      documentType: "proforma",
      documentNumber: "HAXR-PRO-2026-LONG-OBS-01",
      pdfTemplate: "editorial_ivory",
      contactChannel: "financeiro",
      status: "sent",
      notes: longObsParagraphs,
      lineItems: Array.from({ length: 8 }, (_, i) => ({
        id: `li-obs-${i + 1}`,
        description: `Serviço de Curadoria Editorial e Direção de Arte Nº ${i + 1}`,
        quantity: 1,
        unitPrice: 15000,
        total: 15000,
        source: "catalog",
      })),
      totals: {
        subtotal: 120000,
        vatRate: 0.16,
        vatAmount: 19200,
        grandTotal: 139200,
        includeVat: true,
        currency: "MZN",
      },
    },
    business: haxrBusiness,
    logoUrl: logo09,
  }),
  path.join(outputDir, "09_stress_long_observations_flow.pdf")
);

console.log("All 9 PDF fixtures generated successfully in .qa-pdf-output/!");
