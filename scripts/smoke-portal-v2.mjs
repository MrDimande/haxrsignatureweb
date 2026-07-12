/**
 * Smoke test Portal V2 — rotas, alertas e integração básica.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;

function ok(message) {
  console.log(`OK    ${message}`);
}

function fail(message) {
  failed += 1;
  console.log(`FAIL  ${message}`);
}

const requiredFiles = [
  "src/app/portal/[token]/page.tsx",
  "src/app/portal/[token]/layout.tsx",
  "src/app/portal/[token]/financeiro/page.tsx",
  "src/app/portal/[token]/documentos/page.tsx",
  "src/app/portal/[token]/aprovacoes/page.tsx",
  "src/components/portal/PortalShell.tsx",
  "src/components/portal/PortalApprovalCard.tsx",
  "src/lib/portal/portal-routes.ts",
  "src/lib/admin/services/portal-approval-notify.service.ts",
  "src/lib/admin/services/convert-proforma.service.ts",
  "src/app/api/portal/[token]/documents/[documentId]/approve/route.ts",
  "src/app/api/portal/[token]/documents/[documentId]/request-changes/route.ts",
  "src/lib/admin/services/portal-approval-alerts.ts",
  "src/lib/admin/services/admin-alerts.service.ts",
  "src/components/admin/Sidebar.tsx",
];

for (const file of requiredFiles) {
  if (existsSync(join(root, file))) {
    ok(`ficheiro ${file}`);
  } else {
    fail(`ficheiro em falta: ${file}`);
  }
}

const { buildPortalApprovalAlerts } = await import(
  "../src/lib/admin/services/portal-approval-alerts.ts"
);

const alerts = buildPortalApprovalAlerts({
  documents: [
    {
      id: "doc-smoke",
      documentType: "proforma",
      documentNumber: "PF-SMOKE",
      businessId: "haxr",
      status: "sent",
      currency: "MZN",
      clientId: "client-1",
      clientType: "individual",
      clientName: "Cliente Smoke",
      companyName: "",
      clientEmail: "smoke@example.com",
      clientPhone: "",
      clientNuit: "",
      clientAddress: "",
      eventId: null,
      eventName: "",
      eventType: "wedding",
      eventDate: null,
      eventLocation: "",
      issueDate: "2026-01-01",
      dueDate: null,
      validityDate: null,
      notes: "",
      terms: "",
      includeVat: true,
      lineItems: [],
      totals: {
        subtotal: 100,
        vatAmount: 16,
        grandTotal: 116,
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
      clientApprovalStatus: "approved",
      clientApprovedAt: "2026-01-15T10:00:00.000Z",
      clientApprovalNote: null,
    },
  ],
  relativeTime: () => "Agora",
});

if (alerts.length === 1 && alerts[0].id === "portal-approved-doc-smoke") {
  ok("buildPortalApprovalAlerts gera alerta de aprovação");
} else {
  fail("buildPortalApprovalAlerts não gerou alerta esperado");
}

const baseUrl = process.env.SMOKE_BASE_URL?.trim() || "http://localhost:3000";
const portalToken = process.env.SMOKE_PORTAL_TOKEN?.trim();
const portalDocumentId = process.env.SMOKE_PORTAL_DOCUMENT_ID?.trim();

if (portalToken && portalDocumentId) {
  try {
    const health = await fetch(`${baseUrl}/portal/${portalToken}`, {
      redirect: "manual",
    });
    if (health.status === 200 || health.status === 307) {
      ok(`portal page responde (${health.status})`);
    } else {
      fail(`portal page status inesperado: ${health.status}`);
    }

    const approve = await fetch(
      `${baseUrl}/api/portal/${portalToken}/documents/${portalDocumentId}/approve`,
      { method: "POST" }
    );
    if (approve.status === 200 || approve.status === 400) {
      ok(`approve route responde (${approve.status})`);
    } else {
      fail(`approve route status inesperado: ${approve.status}`);
    }
  } catch (error) {
    fail(
      `API smoke falhou (${error instanceof Error ? error.message : String(error)})`
    );
  }
} else {
  ok(
    "API smoke omitido (defina SMOKE_PORTAL_TOKEN e SMOKE_PORTAL_DOCUMENT_ID para teste live)"
  );
}

if (failed) {
  console.log(`\n${failed} problema(s)`);
  process.exit(1);
}

console.log("\nSmoke Portal V2 concluído.");
