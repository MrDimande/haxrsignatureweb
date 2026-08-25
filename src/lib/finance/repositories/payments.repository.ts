import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neonPayments from "@/lib/finance/repositories/payments.neon.repository";
import * as supabasePayments from "@/lib/finance/repositories/payments.supabase.repository";
import type { PaymentRecord, RegisterPaymentInput } from "@/lib/finance/types";

export type PaymentsBatchResult = {
  available: boolean;
  items: PaymentRecord[];
};

type CreatePaymentInput = Omit<RegisterPaymentInput, "generateReceipt"> & {
  documentId?: string | null;
  clientName?: string;
  eventName?: string;
  documentNumber?: string | null;
  sourceDocumentNumber?: string | null;
};

export function listPaymentsBatch(): Promise<PaymentsBatchResult> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.listPaymentsBatch()
    : supabasePayments.listPaymentsBatch();
}

export function listPaymentsByClientId(
  clientId: string,
  limit = 100,
): Promise<PaymentRecord[]> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.listPaymentsByClientId(clientId, limit)
    : supabasePayments.listPaymentsByClientId(clientId, limit);
}

export function listPaymentsByEventId(
  eventId: string,
  limit = 50,
): Promise<PaymentRecord[]> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.listPaymentsByEventId(eventId, limit)
    : supabasePayments.listPaymentsByEventId(eventId, limit);
}

export function listPayments(limit = 100): Promise<PaymentRecord[]> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.listPayments(limit)
    : supabasePayments.listPayments(limit);
}

export function createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.createPayment(input)
    : supabasePayments.createPayment(input);
}

export function sumPaymentsForSourceDocument(
  sourceDocumentId: string,
): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? neonPayments.sumPaymentsForSourceDocument(sourceDocumentId)
    : supabasePayments.sumPaymentsForSourceDocument(sourceDocumentId);
}
