import { formatCurrency } from "@/lib/calculations";
import { getBusiness } from "@/lib/admin/businesses";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { InvoiceDocument } from "@/lib/admin/types";

export function buildWhatsAppMessage(document: InvoiceDocument): string {
  const business = getBusiness(document.businessId);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType];
  const total = formatCurrency(
    document.totals.grandTotal,
    document.totals.currency
  );
  const greeting = document.clientName
    ? `Olá ${document.clientName}.`
    : "Olá.";

  return [
    greeting,
    "",
    `Segue em anexo a sua ${typeLabel} ${document.documentNumber}.`,
    "",
    `Valor Total: ${total}`,
    "",
    business.name,
  ].join("\n");
}

export function buildWhatsAppUrl(
  phone: string,
  message: string
): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function getWhatsAppShareUrl(document: InvoiceDocument): string {
  const business = getBusiness(document.businessId);
  const message = buildWhatsAppMessage(document);
  const phone =
    document.clientPhone.replace(/\D/g, "") || business.whatsapp;
  return buildWhatsAppUrl(phone, message);
}
