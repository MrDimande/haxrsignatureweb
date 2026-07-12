import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { InvoiceDocument } from "@/lib/admin/types";
import { formatCurrency } from "@/lib/calculations";
import { buildBrandEmailHtml } from "@/lib/email/brand-shell";
import { getNotifyInbox } from "@/lib/email/addresses";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";

const BRAND = "HAXR Signature";

export type PortalApprovalNotifyKind = "approved" | "changes_requested";

export type PortalApprovalNotifyInput = {
  kind: PortalApprovalNotifyKind;
  document: InvoiceDocument;
  clientName: string;
  invoice?: { id: string; documentNumber: string };
  note?: string;
};

function adminBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Agora";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

function buildDetailRows(input: PortalApprovalNotifyInput): string[] {
  const { document, clientName, invoice, note } = input;
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];
  const total = formatCurrency(
    document.totals.grandTotal,
    document.totals.currency
  );

  const rows = [
    ["Cliente", clientName],
    ["Documento", `${typeLabel} ${document.documentNumber}`],
    ["Valor", total],
    ...(document.event.eventName
      ? [["Evento", document.event.eventName] as const]
      : []),
    ...(invoice
      ? [["Factura gerada", invoice.documentNumber] as const]
      : []),
    ...(note?.trim() ? [["Notas do cliente", note.trim()] as const] : []),
    ["Data", formatWhen(document.clientApprovedAt)],
  ];

  return rows.map(
    ([label, value]) =>
      `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;"><tr>
        <td style="padding:8px 0;border-bottom:1px solid #2a2418;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8478;vertical-align:top;width:38%;">${label}</td>
        <td style="padding:8px 0 8px 12px;border-bottom:1px solid #2a2418;color:#e8e4dc;">${value.replace(/\n/g, "<br>")}</td>
      </tr></table>`
  );
}

export function buildPortalApprovalNotifySubject(
  input: PortalApprovalNotifyInput
): string {
  const docRef = input.document.documentNumber;
  if (input.kind === "approved") {
    const invoicePart = input.invoice
      ? ` · Factura ${input.invoice.documentNumber}`
      : "";
    return `[${BRAND}] Cliente aprovou proposta ${docRef}${invoicePart}`;
  }
  return `[${BRAND}] Cliente pediu alterações em ${docRef}`;
}

export function buildPortalApprovalNotifyHtml(
  input: PortalApprovalNotifyInput
): string {
  const base = adminBaseUrl();
  const documentUrl = `${base}/admin/documents/${input.document.id}`;
  const invoiceUrl = input.invoice
    ? `${base}/admin/documents/${input.invoice.id}`
    : null;

  const title =
    input.kind === "approved"
      ? "Proposta aprovada no portal"
      : "Alterações pedidas no portal";

  const preheader =
    input.kind === "approved"
      ? `${input.clientName} aprovou ${input.document.documentNumber}.`
      : `${input.clientName} pediu alterações em ${input.document.documentNumber}.`;

  const intro =
    input.kind === "approved"
      ? `<p style="margin:0 0 20px;color:#8a8478;">O cliente aprovou a proposta comercial no portal. ${
          input.invoice
            ? "A factura foi emitida automaticamente."
            : "Revise o documento e avance com o sinal."
        }</p>`
      : `<p style="margin:0 0 20px;color:#8a8478;">O cliente pediu alterações à proposta no portal. Responda com uma versão actualizada.</p>`;

  return buildBrandEmailHtml({
    title,
    editionTag: "Portal cliente",
    preheader,
    body: `${intro}${buildDetailRows(input).join("")}`,
    cta: {
      label: "Abrir documento no admin",
      href: documentUrl,
    },
    secondaryCta: invoiceUrl
      ? {
          label: "Ver factura gerada",
          href: invoiceUrl,
        }
      : undefined,
  });
}

export async function notifyAdminPortalApproval(
  input: PortalApprovalNotifyInput
): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    console.warn(
      "[portal-approval] RESEND_API_KEY não configurada — email admin omitido."
    );
    return { sent: false, error: "RESEND_API_KEY não configurada" };
  }

  const notifyEmail = getNotifyInbox();
  const result = await sendHaxrEmail({
    channel: "financeiro",
    to: notifyEmail,
    replyTo: input.document.clientEmail.trim() || undefined,
    subject: buildPortalApprovalNotifySubject(input),
    html: buildPortalApprovalNotifyHtml(input),
  });

  if (!result.ok) {
    console.error("[portal-approval] Falha email admin:", result.error);
    return { sent: false, error: result.error };
  }

  return { sent: true };
}
