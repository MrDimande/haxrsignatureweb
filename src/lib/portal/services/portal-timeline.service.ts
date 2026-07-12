import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";

export type PortalTimelineCategory =
  | "event"
  | "finance"
  | "document"
  | "approval";

export type PortalTimelineEntry = {
  id: string;
  category: PortalTimelineCategory;
  title: string;
  description?: string;
  occurredAt: string;
};

type BuildPortalTimelineInput = {
  events: ManagedEvent[];
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
};

function sortTimeline(entries: PortalTimelineEntry[]): PortalTimelineEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

export function buildPortalTimeline({
  events,
  documents,
  payments,
}: BuildPortalTimelineInput): PortalTimelineEntry[] {
  const entries: PortalTimelineEntry[] = [];

  for (const event of events) {
    entries.push({
      id: `event-${event.id}`,
      category: "event",
      title: `Evento: ${event.name}`,
      description: event.location || undefined,
      occurredAt: event.createdAt,
    });

    if (event.date) {
      entries.push({
        id: `event-date-${event.id}`,
        category: "event",
        title: `Data do evento: ${event.name}`,
        occurredAt: `${event.date}T12:00:00.000Z`,
      });
    }
  }

  for (const document of documents) {
    entries.push({
      id: `doc-${document.id}`,
      category: "document",
      title: `${DOCUMENT_TYPE_LABELS[document.documentType]} ${document.documentNumber}`,
      occurredAt: document.createdAt,
    });

    if (document.emailSentAt) {
      entries.push({
        id: `doc-email-${document.id}`,
        category: "document",
        title: `Documento enviado: ${document.documentNumber}`,
        occurredAt: document.emailSentAt,
      });
    }

    if (document.clientApprovalStatus === "approved" && document.clientApprovedAt) {
      entries.push({
        id: `doc-approved-${document.id}`,
        category: "approval",
        title: `Proposta aprovada: ${document.documentNumber}`,
        occurredAt: document.clientApprovedAt,
      });
    }

    if (
      document.clientApprovalStatus === "changes_requested" &&
      document.clientApprovedAt
    ) {
      entries.push({
        id: `doc-changes-${document.id}`,
        category: "approval",
        title: `Alterações pedidas: ${document.documentNumber}`,
        description: document.clientApprovalNote || undefined,
        occurredAt: document.clientApprovedAt,
      });
    }
  }

  for (const payment of payments) {
    entries.push({
      id: `payment-${payment.id}`,
      category: "finance",
      title: "Pagamento registado",
      description: payment.sourceDocumentNumber || payment.eventName || undefined,
      occurredAt: payment.paidAt,
    });
  }

  return sortTimeline(entries);
}

export function getUpcomingPortalMilestone(
  events: ManagedEvent[]
): PortalTimelineEntry | null {
  const now = Date.now();
  const upcoming = events
    .filter((event) => event.date && new Date(event.date).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
    )[0];

  if (!upcoming?.date) return null;

  return {
    id: `upcoming-${upcoming.id}`,
    category: "event",
    title: `Próximo evento: ${upcoming.name}`,
    description: upcoming.location || undefined,
    occurredAt: `${upcoming.date}T12:00:00.000Z`,
  };
}
