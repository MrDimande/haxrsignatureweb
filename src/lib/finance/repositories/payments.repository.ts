import * as neonPayments from "@/lib/finance/repositories/payments.neon.repository";
import type { PaymentRecord, RegisterPaymentInput } from "@/lib/finance/types";

import type { PaymentsBatchResult } from "@/lib/finance/repositories/payments.neon.repository";

export type { PaymentsBatchResult } from "@/lib/finance/repositories/payments.neon.repository";

type CreatePaymentInput = Omit<RegisterPaymentInput, "generateReceipt"> & {
  documentId?: string | null;
  clientName?: string;
  eventName?: string;
  documentNumber?: string | null;
  sourceDocumentNumber?: string | null;
};

export function listPaymentsBatch(): Promise<PaymentsBatchResult> {
  return neonPayments.listPaymentsBatch();
}

export function listPaymentsByClientId(
  clientId: string,
  limit = 100,
): Promise<PaymentRecord[]> {
  return neonPayments.listPaymentsByClientId(clientId, limit);
}

export function listPaymentsByEventId(
  eventId: string,
  limit = 50,
): Promise<PaymentRecord[]> {
  return neonPayments.listPaymentsByEventId(eventId, limit);
}

export function listPayments(limit = 100): Promise<PaymentRecord[]> {
  return neonPayments.listPayments(limit);
}

export function createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
  return neonPayments.createPayment(input);
}

export function sumPaymentsForSourceDocument(
  sourceDocumentId: string,
): Promise<number> {
  return neonPayments.sumPaymentsForSourceDocument(sourceDocumentId);
}
