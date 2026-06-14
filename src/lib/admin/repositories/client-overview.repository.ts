import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import type { ClientCommercialStats, Currency, InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";

export type ClientCommercialOverview = {
  events: ManagedEvent[];
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
  stats: ClientCommercialStats;
};

export async function getClientCommercialOverview(
  clientId: string
): Promise<ClientCommercialOverview> {
  const [events, documents, payments] = await Promise.all([
    eventsRepo.listEventsByClientId(clientId),
    documentsRepo.listDocuments({ clientId }),
    paymentsRepo.listPaymentsByClientId(clientId),
  ]);

  const currency: Currency = documents[0]?.totals.currency ?? "MZN";

  const invoicedTotal = documents
    .filter((doc) => doc.documentType === "invoice" || doc.documentType === "proforma")
    .reduce((sum, doc) => sum + doc.totals.grandTotal, 0);

  const receivedTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    events,
    documents,
    payments,
    stats: {
      eventCount: events.length,
      invoicedTotal,
      receivedTotal,
      pendingBalance: Math.max(0, invoicedTotal - receivedTotal),
      currency,
    },
  };
}
