import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import { getBusiness } from "@/lib/admin/businesses";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { formatCurrency, formatDateShort } from "@/lib/calculations";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import type { InvoiceDocument } from "@/lib/admin/types";

function buildReminderHtml(document: InvoiceDocument): string {
  const business = getBusiness(document.businessId);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];
  const total = formatCurrency(
    document.totals.grandTotal,
    document.totals.currency
  );
  const due = formatDateShort(document.expiryDate);

  return `
    <div style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.6;">
      <p>Olá ${document.clientName || "Cliente"},</p>
      <p>Este é um lembrete amigável sobre a <strong>${typeLabel} ${document.documentNumber}</strong>.</p>
      <p>Valor em aberto: <strong>${total}</strong></p>
      <p>Validade: <strong>${due}</strong></p>
      <p>Se já efectuou o pagamento, por favor ignore este email ou envie o comprovativo.</p>
      <p>Com os melhores cumprimentos,<br/>${business.name}<br/>${business.email}</p>
    </div>
  `.trim();
}

export async function sendPaymentReminder(
  documentId: string
): Promise<InvoiceDocument> {
  if (!isResendConfigured()) {
    throw new Error(
      "Resend não configurado — não foi possível enviar o lembrete."
    );
  }

  const document = await documentsRepo.getDocumentById(documentId);
  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  if (
    document.documentType !== "invoice" &&
    document.documentType !== "proforma"
  ) {
    throw new Error("Lembretes aplicam-se apenas a proformas e facturas.");
  }

  if (document.status !== "sent") {
    throw new Error("O documento deve estar no estado «Enviado».");
  }

  const email = document.clientEmail.trim();
  if (!email) {
    throw new Error("O cliente não tem email registado.");
  }

  const business = getBusiness(document.businessId);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];

  const sent = await sendHaxrEmail({
    channel: "financeiro",
    to: email,
    subject: `Lembrete: ${typeLabel} ${document.documentNumber} — ${business.name}`,
    html: buildReminderHtml(document),
    replyTo: business.email,
  });

  if (!sent.ok) {
    throw new Error(sent.error ?? "Falha ao enviar lembrete.");
  }

  return documentsRepo.markEmailSent(document.id);
}
