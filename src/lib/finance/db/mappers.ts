import type { Tables } from "@/lib/supabase/database.types";
import type { BusinessId, Currency } from "@/lib/admin/types";
import type { PaymentMethod, PaymentRecord } from "@/lib/finance/types";

export function mapPayment(
  row: Tables<"payments">,
  extras?: {
    clientName?: string;
    eventName?: string;
    documentNumber?: string | null;
    sourceDocumentNumber?: string | null;
  }
): PaymentRecord {
  return {
    id: row.id,
    businessId: row.business_id as BusinessId,
    clientId: row.client_id,
    clientName: extras?.clientName ?? "",
    eventId: row.event_id,
    eventName: extras?.eventName ?? "",
    documentId: row.document_id,
    documentNumber: extras?.documentNumber ?? null,
    sourceDocumentId: row.source_document_id,
    sourceDocumentNumber: extras?.sourceDocumentNumber ?? null,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    paymentMethod: row.payment_method as PaymentMethod,
    reference: row.reference,
    notes: row.notes,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}
