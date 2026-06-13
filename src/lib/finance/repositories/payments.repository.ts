import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { mapPayment } from "@/lib/finance/db/mappers";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { PaymentRecord, RegisterPaymentInput } from "@/lib/finance/types";

export async function listPayments(limit = 100): Promise<PaymentRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return asTableRows<"payments">(data).map((row) => mapPayment(row));
}

export async function createPayment(
  input: Omit<RegisterPaymentInput, "generateReceipt"> & {
    documentId?: string | null;
    clientName?: string;
    eventName?: string;
    documentNumber?: string | null;
    sourceDocumentNumber?: string | null;
  }
): Promise<PaymentRecord> {
  const supabase = createAdminClient();

  const payload: TablesInsert<"payments"> = {
    business_id: input.businessId,
    client_id: input.clientId ?? null,
    event_id: input.eventId ?? null,
    document_id: input.documentId ?? null,
    source_document_id: input.sourceDocumentId ?? null,
    amount: input.amount,
    currency: input.currency,
    payment_method: input.paymentMethod,
    reference: input.reference?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    paid_at: input.paidAt ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("payments")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"payments">(data);
  if (!row) throw new Error("Falha ao registar pagamento.");

  return mapPayment(row, {
    clientName: input.clientName,
    eventName: input.eventName,
    documentNumber: input.documentNumber ?? null,
    sourceDocumentNumber: input.sourceDocumentNumber ?? null,
  });
}

export async function sumPaymentsForSourceDocument(
  sourceDocumentId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("source_document_id", sourceDocumentId);

  if (error) throw new Error(error.message);
  const rows = asTableRows<"payments">(data);
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}
