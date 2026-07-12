import type { Client, Currency, InvoiceDocument } from "@/lib/admin/types";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/admin/constants";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";

export type ClientTimelineKind =
  | "client_created"
  | "event_created"
  | "document_created"
  | "document_status"
  | "email_sent"
  | "whatsapp_shared"
  | "payment_received"
  | "proforma_converted"
  | "portal_proposal_approved"
  | "portal_proposal_changes";

export interface ClientTimelineEntry {
  id: string;
  kind: ClientTimelineKind;
  title: string;
  description?: string;
  occurredAt: string;
  href?: string;
  amount?: number;
  currency?: Currency;
}

type BuildClientTimelineInput = {
  client: Client;
  events: ManagedEvent[];
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
};

function sortNewestFirst(entries: ClientTimelineEntry[]): ClientTimelineEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

export function buildClientTimeline({
  client,
  events,
  documents,
  payments,
}: BuildClientTimelineInput): ClientTimelineEntry[] {
  const entries: ClientTimelineEntry[] = [
    {
      id: `client-created-${client.id}`,
      kind: "client_created",
      title: "Cliente criado no CRM",
      description: client.fullName,
      occurredAt: client.createdAt,
    },
  ];

  for (const event of events) {
    entries.push({
      id: `event-${event.id}`,
      kind: "event_created",
      title: `Evento: ${event.name}`,
      description: event.location || undefined,
      occurredAt: event.createdAt,
      href: `/admin/events/${event.id}`,
    });
  }

  for (const document of documents) {
    entries.push({
      id: `document-${document.id}`,
      kind: "document_created",
      title: `${DOCUMENT_TYPE_LABELS[document.documentType]} ${document.documentNumber}`,
      description: DOCUMENT_STATUS_LABELS[document.status],
      occurredAt: document.createdAt,
      href: `/admin/documents/${document.id}`,
      amount: document.totals.grandTotal,
      currency: document.totals.currency,
    });

    if (document.status === "sent" || document.status === "paid") {
      entries.push({
        id: `document-status-${document.id}-${document.status}`,
        kind: "document_status",
        title:
          document.status === "paid"
            ? `Documento pago: ${document.documentNumber}`
            : `Documento enviado: ${document.documentNumber}`,
        occurredAt: document.updatedAt,
        href: `/admin/documents/${document.id}`,
        amount: document.totals.grandTotal,
        currency: document.totals.currency,
      });
    }

    if (document.emailSentAt) {
      entries.push({
        id: `email-${document.id}`,
        kind: "email_sent",
        title: `Email enviado: ${document.documentNumber}`,
        occurredAt: document.emailSentAt,
        href: `/admin/documents/${document.id}`,
      });
    }

    if (document.whatsappSharedAt) {
      entries.push({
        id: `whatsapp-${document.id}`,
        kind: "whatsapp_shared",
        title: `Partilhado no WhatsApp: ${document.documentNumber}`,
        occurredAt: document.whatsappSharedAt,
        href: `/admin/documents/${document.id}`,
      });
    }

    if (document.convertedFromDocumentId) {
      entries.push({
        id: `converted-${document.id}`,
        kind: "proforma_converted",
        title: `Proforma convertida em ${document.documentNumber}`,
        occurredAt: document.createdAt,
        href: `/admin/documents/${document.id}`,
      });
    }

    if (
      document.clientApprovalStatus === "approved" &&
      document.clientApprovedAt
    ) {
      entries.push({
        id: `portal-approved-${document.id}`,
        kind: "portal_proposal_approved",
        title: `Proposta aprovada no portal: ${document.documentNumber}`,
        occurredAt: document.clientApprovedAt,
        href: `/admin/documents/${document.id}`,
      });
    }

    if (
      document.clientApprovalStatus === "changes_requested" &&
      document.clientApprovedAt
    ) {
      entries.push({
        id: `portal-changes-${document.id}`,
        kind: "portal_proposal_changes",
        title: `Alterações pedidas no portal: ${document.documentNumber}`,
        description: document.clientApprovalNote || undefined,
        occurredAt: document.clientApprovedAt,
        href: `/admin/documents/${document.id}`,
      });
    }
  }

  for (const payment of payments) {
    entries.push({
      id: `payment-${payment.id}`,
      kind: "payment_received",
      title: "Pagamento registado",
      description:
        payment.sourceDocumentNumber ||
        payment.documentNumber ||
        payment.eventName ||
        undefined,
      occurredAt: payment.paidAt,
      amount: payment.amount,
      currency: payment.currency,
      href: payment.documentId
        ? `/admin/documents/${payment.documentId}`
        : "/admin/cash",
    });
  }

  return sortNewestFirst(entries);
}
