import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import { generateInvoicePDFBuffer } from "@/lib/admin/pdf-server";
import { getBusiness } from "@/lib/admin/businesses";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { formatCurrency } from "@/lib/calculations";
import { getPdfFilename } from "@/lib/admin/pdf-assets";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import type { InvoiceDocument } from "@/lib/admin/types";

function buildDocumentEmailHtml(document: InvoiceDocument): string {
  const business = getBusiness(document.businessId);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];
  const total = formatCurrency(
    document.totals.grandTotal,
    document.totals.currency
  );

  return `
    <div style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.6;">
      <p>Olá ${document.clientName || "Cliente"},</p>
      <p>Segue em anexo a sua <strong>${typeLabel}</strong> <strong>${document.documentNumber}</strong>.</p>
      <p>Valor total: <strong>${total}</strong></p>
      <p>Com os melhores cumprimentos,<br/>${business.name}</p>
    </div>
  `.trim();
}

export async function sendDocumentByEmail(
  documentId: string
): Promise<InvoiceDocument> {
  if (!isResendConfigured()) {
    throw new Error(
      "Resend não configurado — não foi possível enviar o documento por email."
    );
  }

  const document = await documentsRepo.getDocumentById(documentId);
  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  const email = document.clientEmail.trim();
  if (!email) {
    throw new Error("O cliente não tem email registado.");
  }

  const business = getBusiness(document.businessId);
  const pdfBuffer = await generateInvoicePDFBuffer(document, business);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];

  const sent = await sendHaxrEmail({
    channel: "financeiro",
    to: email,
    subject: `${typeLabel} ${document.documentNumber} — ${business.name}`,
    html: buildDocumentEmailHtml(document),
    replyTo: business.email,
    attachments: [
      {
        filename: getPdfFilename(document),
        content: pdfBuffer,
      },
    ],
  });

  if (!sent.ok) {
    throw new Error(sent.error ?? "Falha ao enviar email.");
  }

  await documentsRepo.markPdfGenerated(document.id);
  await documentsRepo.markEmailSent(document.id);

  if (document.documentType === "proforma") {
    await documentsRepo.markClientApprovalPending(document.id);
  }

  if (document.status === "draft") {
    const updated = await documentsRepo.updateDocumentStatus(document.id, "sent");
    return updated;
  }

  const latest = await documentsRepo.getDocumentById(document.id);
  if (!latest) {
    throw new Error("Documento não encontrado após envio.");
  }
  return latest;
}
