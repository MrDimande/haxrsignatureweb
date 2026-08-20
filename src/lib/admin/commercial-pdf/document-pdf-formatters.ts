import { formatDateShort } from "@/lib/calculations";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from "@/lib/admin/constants";
import type {
  Currency,
  DocumentStatus,
  DocumentType,
  EventType,
  InvoiceDocument,
} from "@/lib/admin/types";

/**
 * Deterministic money formatting for commercial PDFs:
 * - Always includes thousands space separator: e.g. "44 080,00 MZN", "4 500,00 MZN"
 * - Always uses comma as decimal separator
 * - Avoids unformatted outputs like "4500,00" or "6080,00"
 */
export function formatPdfCurrency(
  amount: number | null | undefined,
  currency: Currency = "MZN"
): string {
  const val = amount == null || !Number.isFinite(amount) ? 0 : amount;
  const fixed = (Math.round(val * 100) / 100).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${groupedInt},${decPart} ${currency}`;
}

export function formatPdfDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return formatDateShort(dateStr);
}

export interface DocumentDateMeta {
  issueDateLabel: string;
  issueDateFormatted: string;
  secondaryDateLabel?: string;
  secondaryDateFormatted?: string;
  currency: string;
}

/**
 * Resolves type-specific date metadata:
 * - PROFORMA: Emissão, Validade, Moeda
 * - FACTURA: Emissão, Vencimento, Moeda
 * - RECIBO: Emissão, Moeda (Validade is never rendered on Recibo)
 */
export function resolveDocumentDateMeta(doc: InvoiceDocument): DocumentDateMeta {
  const issueDateFormatted = formatPdfDate(doc.issueDate);
  const currency = doc.totals.currency;

  if (doc.documentType === "proforma") {
    return {
      issueDateLabel: "Emissão",
      issueDateFormatted,
      secondaryDateLabel: "Validade",
      secondaryDateFormatted: formatPdfDate(doc.expiryDate),
      currency,
    };
  }

  if (doc.documentType === "invoice") {
    return {
      issueDateLabel: "Emissão",
      issueDateFormatted,
      secondaryDateLabel: "Vencimento",
      secondaryDateFormatted: formatPdfDate(doc.expiryDate),
      currency,
    };
  }

  // Recibo: Only emission and currency!
  return {
    issueDateLabel: "Emissão",
    issueDateFormatted,
    currency,
  };
}

export function formatDocumentCategory(
  type: DocumentType,
  isHaxr = true
): string {
  if (!isHaxr) {
    return type === "receipt" ? "REGISTO DE PAGAMENTO" : "DOCUMENTO COMERCIAL";
  }
  return type === "receipt"
    ? "HAXR SIGNATURE · REGISTO DE PAGAMENTO"
    : "HAXR SIGNATURE · DOCUMENTO COMERCIAL";
}

export function formatDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] || "Documento";
}

export function formatDocumentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_LABELS[status] || status;
}

export function formatEventTypeLabel(
  eventType: EventType | null | undefined
): string {
  if (!eventType) return "";
  return EVENT_TYPE_LABELS[eventType] || eventType;
}
