import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { InvoiceDocument } from "@/lib/admin/types";
import { resolveEventPipelineStatus } from "@/lib/events/pipeline";
import { isDateHoldActive } from "@/lib/portal/date-hold";
import { buildOverdueAlerts } from "@/lib/finance/extended-analytics";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as conciergeRepo from "@/lib/concierge/repositories/concierge.repository";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";

export type EventPortfolioOperationalSnapshot = {
  event: {
    id: string;
    name: string;
    clientName: string | null;
    date: string | null;
    pipeline: "planning" | "active";
  };
  guests: {
    totalGuests: number;
    confirmed: number;
    checkedIn: number;
    unassigned: number;
  };
  concierge: {
    pendingReviewCount: number;
  };
  paymentProofs: {
    pendingCount: number;
  };
  documents: {
    openCount: number;
    overdueCount: number;
  };
  dateHold: {
    active: boolean;
    dateHoldUntil: string | null;
  };
  sheets: {
    configured: boolean;
    lastSyncedAt: string | null;
  };
};

export type EventPortfolioSourceData = {
  events: ManagedEvent[];
  guestStats: Record<string, EventListGuestStats>;
  conciergePendingByEvent: Record<string, number>;
  paymentProofsPendingByEvent: Record<string, number>;
  documentsByEvent: Record<string, InvoiceDocument[]>;
};

/**
 * Pure builder that transforms batch source data into EventPortfolioOperationalSnapshot[]
 * for all planning and active events.
 *
 * Deterministic and free of side-effects.
 */
export function buildEventPortfolioOperationalSnapshot(
  source: EventPortfolioSourceData
): EventPortfolioOperationalSnapshot[] {
  const snapshots: EventPortfolioOperationalSnapshot[] = [];

  for (const event of source.events) {
    const pipeline = resolveEventPipelineStatus(event);
    if (pipeline === "completed") {
      continue;
    }

    const eventGuests = source.guestStats[event.id] ?? {
      totalGuests: 0,
      confirmed: 0,
      checkedIn: 0,
      unassigned: 0,
    };

    const pendingConcierge = source.conciergePendingByEvent[event.id] ?? 0;
    const pendingProofs = source.paymentProofsPendingByEvent[event.id] ?? 0;
    const eventDocs = source.documentsByEvent[event.id] ?? [];

    const openCount = eventDocs.filter(
      (doc) =>
        doc.status === "sent" &&
        (doc.documentType === "invoice" || doc.documentType === "proforma")
    ).length;

    const overdueCount = buildOverdueAlerts(eventDocs).length;
    const isDateHold = isDateHoldActive(event.dateHoldUntil);
    const sheetsConfigured = Boolean(
      event.googleSheetUrl && event.googleSheetUrl.trim()
    );

    snapshots.push({
      event: {
        id: event.id,
        name: event.name,
        clientName: event.clientName,
        date: event.date,
        pipeline,
      },
      guests: {
        totalGuests: eventGuests.totalGuests,
        confirmed: eventGuests.confirmed,
        checkedIn: eventGuests.checkedIn,
        unassigned: eventGuests.unassigned,
      },
      concierge: {
        pendingReviewCount: pendingConcierge,
      },
      paymentProofs: {
        pendingCount: pendingProofs,
      },
      documents: {
        openCount,
        overdueCount,
      },
      dateHold: {
        active: isDateHold,
        dateHoldUntil: event.dateHoldUntil ?? null,
      },
      sheets: {
        configured: sheetsConfigured,
        lastSyncedAt: event.sheetsLastSyncedAt ?? null,
      },
    });
  }

  return snapshots;
}

/**
 * Loads batch operational data for events and builds operational snapshots.
 * Guaranteed O(1) database queries relative to the number of events.
 */
export async function getEventPortfolioOperationalSnapshots(
  targetEvents?: ManagedEvent[]
): Promise<EventPortfolioOperationalSnapshot[]> {
  const events = targetEvents ?? (await eventsRepo.listAllEvents());
  const operationalEvents = events.filter((event) => {
    const pipeline = resolveEventPipelineStatus(event);
    return pipeline === "planning" || pipeline === "active";
  });

  if (operationalEvents.length === 0) {
    return [];
  }

  const eventIds = operationalEvents.map((e) => e.id);

  const [guestStats, conciergeCounts, proofCounts, documents] = await Promise.all([
    guestsRepo.listGuestStatsByEventIds(eventIds),
    conciergeRepo.countPendingConciergeReviewsByEventIds(eventIds),
    portalPremiumRepo.countPendingPaymentProofsByEventIds(eventIds),
    documentsRepo.listDocumentsByEventIds(eventIds),
  ]);

  const documentsByEvent: Record<string, InvoiceDocument[]> = {};
  for (const id of eventIds) {
    documentsByEvent[id] = [];
  }
  for (const doc of documents) {
    if (doc.event.eventId && doc.event.eventId in documentsByEvent) {
      documentsByEvent[doc.event.eventId].push(doc);
    }
  }

  return buildEventPortfolioOperationalSnapshot({
    events: operationalEvents,
    guestStats,
    conciergePendingByEvent: conciergeCounts,
    paymentProofsPendingByEvent: proofCounts,
    documentsByEvent,
  });
}
