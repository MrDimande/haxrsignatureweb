import type { InvoiceDocument } from "@/lib/admin/types";
import type {
  ClientBalance,
  PaymentMethodBreakdown,
  PaymentRecord,
} from "@/lib/finance/types";
import { PAYMENT_METHODS } from "@/lib/finance/constants";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPaymentMethodBreakdown(
  payments: PaymentRecord[]
): PaymentMethodBreakdown[] {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return PAYMENT_METHODS.map((method) => {
    const methodPayments = payments.filter(
      (payment) => payment.paymentMethod === method
    );
    const amount = round(
      methodPayments.reduce((sum, payment) => sum + payment.amount, 0)
    );
    return {
      method,
      amount,
      count: methodPayments.length,
      share: total > 0 ? round((amount / total) * 100) : 0,
    };
  }).filter((item) => item.count > 0);
}

export function buildClientBalances(
  documents: InvoiceDocument[],
  payments: PaymentRecord[]
): ClientBalance[] {
  const map = new Map<
    string,
    ClientBalance & { invoicedDocs: Set<string> }
  >();

  function getKey(clientId: string | null, clientName: string): string {
    return clientId ?? `name:${clientName.trim() || "Sem nome"}`;
  }

  function ensureBalance(clientId: string | null, clientName: string) {
    const key = getKey(clientId, clientName);
    if (!map.has(key)) {
      map.set(key, {
        clientId,
        clientName: clientName.trim() || "Sem nome",
        invoiced: 0,
        received: 0,
        outstanding: 0,
        paymentCount: 0,
        invoicedDocs: new Set<string>(),
      });
    }
    return map.get(key)!;
  }

  for (const doc of documents) {
    if (doc.documentType === "receipt") continue;
    if (doc.status !== "sent" && doc.status !== "paid") continue;

    const balance = ensureBalance(doc.clientId, doc.clientName);
    if (!balance.invoicedDocs.has(doc.id)) {
      balance.invoiced += doc.totals.grandTotal;
      balance.invoicedDocs.add(doc.id);
    }
  }

  for (const payment of payments) {
    const balance = ensureBalance(payment.clientId, payment.clientName);
    balance.received += payment.amount;
    balance.paymentCount += 1;
  }

  return Array.from(map.values())
    .map(({ invoicedDocs: _ignored, ...balance }) => ({
      ...balance,
      invoiced: round(balance.invoiced),
      received: round(balance.received),
      outstanding: round(Math.max(balance.invoiced - balance.received, 0)),
    }))
    .filter((balance) => balance.invoiced > 0 || balance.received > 0)
    .sort((a, b) => b.outstanding - a.outstanding || b.received - a.received)
    .slice(0, 12);
}

export async function enrichPayments(
  payments: PaymentRecord[],
  documents: InvoiceDocument[]
): Promise<PaymentRecord[]> {
  const docMap = new Map(documents.map((doc) => [doc.id, doc]));

  return payments.map((payment) => ({
    ...payment,
    documentNumber:
      payment.documentNumber ??
      (payment.documentId
        ? (docMap.get(payment.documentId)?.documentNumber ?? null)
        : null),
    sourceDocumentNumber:
      payment.sourceDocumentNumber ??
      (payment.sourceDocumentId
        ? (docMap.get(payment.sourceDocumentId)?.documentNumber ?? null)
        : null),
    clientName:
      payment.clientName ||
      (payment.clientId
        ? (documents.find((doc) => doc.clientId === payment.clientId)
            ?.clientName ?? "")
        : ""),
  }));
}
