import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { BusinessId, EventType, InvoiceDocument } from "@/lib/admin/types";
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
    businessId: BusinessId;
    type: EventType;
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
    available: boolean;
    pendingReviewCount: number | null;
  };
  paymentProofs: {
    available: boolean;
    pendingCount: number | null;
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
  conciergeReviews: {
    available: boolean;
    counts: Record<string, number>;
  };
  paymentProofs: {
    available: boolean;
    counts: Record<string, number>;
  };
  documentsByEvent: Record<string, InvoiceDocument[]>;
};

export type BuildEventPortfolioOptions = {
  now?: Date;
};

export type EventPortfolioHealthStatus = "priority" | "attention" | "clear";

export type EventPortfolioCoverage = "complete" | "partial";

export type EventPortfolioHealthReasonCode =
  | "overdue_documents"
  | "pending_payment_proofs"
  | "active_date_hold"
  | "concierge_pending";

export type EventPortfolioHealthReason = {
  code: EventPortfolioHealthReasonCode;
  priority: "high" | "medium";
  label: string;
};

export type EventPortfolioHealthItem = {
  operational: EventPortfolioOperationalSnapshot;
  status: EventPortfolioHealthStatus;
  coverage: EventPortfolioCoverage;
  reasons: EventPortfolioHealthReason[];
};

export type EventPortfolioHealthSummary = {
  total: number;
  priority: number;
  attention: number;
  clear: number;
  partialCoverage: number;
};

export type EventPortfolioHealthResult = {
  items: EventPortfolioHealthItem[];
  summary: EventPortfolioHealthSummary;
};

/**
 * Pure interpretation layer transforming factual operational snapshots into
 * explainable, ranked Portfolio Health items.
 *
 * Free of side-effects, deterministic and without fake numeric scores.
 */
export function buildEventPortfolioHealth(
  snapshots: EventPortfolioOperationalSnapshot[]
): EventPortfolioHealthResult {
  const items: EventPortfolioHealthItem[] = snapshots.map((operational) => {
    const reasons: EventPortfolioHealthReason[] = [];

    // Coverage is complete only if all optional evaluated domains are available
    const coverage: EventPortfolioCoverage =
      operational.concierge.available && operational.paymentProofs.available
        ? "complete"
        : "partial";

    // 1. High-priority checks (status = "priority")
    if (operational.documents.overdueCount > 0) {
      reasons.push({
        code: "overdue_documents",
        priority: "high",
        label:
          operational.documents.overdueCount === 1
            ? "1 documento vencido"
            : `${operational.documents.overdueCount} documentos vencidos`,
      });
    }

    if (
      operational.paymentProofs.available &&
      (operational.paymentProofs.pendingCount ?? 0) > 0
    ) {
      const count = operational.paymentProofs.pendingCount!;
      reasons.push({
        code: "pending_payment_proofs",
        priority: "high",
        label:
          count === 1
            ? "1 comprovativo por validar"
            : `${count} comprovativos por validar`,
      });
    }

    if (operational.dateHold.active) {
      reasons.push({
        code: "active_date_hold",
        priority: "high",
        label: "Reserva de data activa",
      });
    }

    // 2. Medium-priority checks (status = "attention" if no high reasons)
    if (
      operational.concierge.available &&
      (operational.concierge.pendingReviewCount ?? 0) > 0
    ) {
      const count = operational.concierge.pendingReviewCount!;
      reasons.push({
        code: "concierge_pending",
        priority: "medium",
        label:
          count === 1
            ? "1 item Concierge por rever"
            : `${count} itens Concierge por rever`,
      });
    }

    // Status resolution
    let status: EventPortfolioHealthStatus = "clear";
    if (reasons.some((r) => r.priority === "high")) {
      status = "priority";
    } else if (reasons.some((r) => r.priority === "medium")) {
      status = "attention";
    }

    return {
      operational,
      status,
      coverage,
      reasons,
    };
  });

  // Deterministic sorting:
  // 1. Priority > Attention > Clear
  // 2. Nearest event date first (dated before planning)
  // 3. Name tie-breaker
  const statusRank: Record<EventPortfolioHealthStatus, number> = {
    priority: 0,
    attention: 1,
    clear: 2,
  };

  items.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;

    const dateA = a.operational.event.date;
    const dateB = b.operational.event.date;

    if (dateA && dateB) {
      const dateDiff = dateA.localeCompare(dateB);
      if (dateDiff !== 0) return dateDiff;
    } else if (dateA && !dateB) {
      return -1;
    } else if (!dateA && dateB) {
      return 1;
    }

    return a.operational.event.name.localeCompare(b.operational.event.name);
  });

  const summary: EventPortfolioHealthSummary = {
    total: items.length,
    priority: items.filter((i) => i.status === "priority").length,
    attention: items.filter((i) => i.status === "attention").length,
    clear: items.filter((i) => i.status === "clear").length,
    partialCoverage: items.filter((i) => i.coverage === "partial").length,
  };

  return { items, summary };
}

/**
 * Pure builder that transforms batch source data into EventPortfolioOperationalSnapshot[]
 * for all planning and active events.
 *
 * Deterministic and free of side-effects. Supports time injection for full temporal determinism.
 */
export function buildEventPortfolioOperationalSnapshot(
  source: EventPortfolioSourceData,
  options?: BuildEventPortfolioOptions
): EventPortfolioOperationalSnapshot[] {
  const now = options?.now ?? new Date();
  const snapshots: EventPortfolioOperationalSnapshot[] = [];

  for (const event of source.events) {
    const pipeline = resolveEventPipelineStatus(event, now);
    if (pipeline === "completed") {
      continue;
    }

    const eventGuests = source.guestStats[event.id] ?? {
      totalGuests: 0,
      confirmed: 0,
      checkedIn: 0,
      unassigned: 0,
    };

    const conciergeAvailable = source.conciergeReviews.available;
    const pendingConcierge = conciergeAvailable
      ? source.conciergeReviews.counts[event.id] ?? 0
      : null;

    const paymentProofsAvailable = source.paymentProofs.available;
    const pendingProofs = paymentProofsAvailable
      ? source.paymentProofs.counts[event.id] ?? 0
      : null;

    const eventDocs = source.documentsByEvent[event.id] ?? [];

    const openCount = eventDocs.filter(
      (doc) =>
        doc.status === "sent" &&
        (doc.documentType === "invoice" || doc.documentType === "proforma")
    ).length;

    const overdueCount = buildOverdueAlerts(eventDocs, now).length;
    const isDateHold = isDateHoldActive(event.dateHoldUntil, now);
    const sheetsConfigured = Boolean(
      event.googleSheetUrl && event.googleSheetUrl.trim()
    );

    snapshots.push({
      event: {
        id: event.id,
        businessId: event.businessId,
        type: event.type,
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
        available: conciergeAvailable,
        pendingReviewCount: pendingConcierge,
      },
      paymentProofs: {
        available: paymentProofsAvailable,
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
 * Uses a single unified clock for filtering and snapshot building.
 */
export async function getEventPortfolioOperationalSnapshots(
  targetEvents?: ManagedEvent[],
  options?: BuildEventPortfolioOptions
): Promise<EventPortfolioOperationalSnapshot[]> {
  const now = options?.now ?? new Date();
  const events = targetEvents ?? (await eventsRepo.listAllEvents());
  const operationalEvents = events.filter((event) => {
    const pipeline = resolveEventPipelineStatus(event, now);
    return pipeline === "planning" || pipeline === "active";
  });

  if (operationalEvents.length === 0) {
    return [];
  }

  const eventIds = operationalEvents.map((e) => e.id);

  const [guestStats, conciergeBatch, proofBatch, documents] = await Promise.all([
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

  return buildEventPortfolioOperationalSnapshot(
    {
      events: operationalEvents,
      guestStats,
      conciergeReviews: conciergeBatch,
      paymentProofs: proofBatch,
      documentsByEvent,
    },
    { now }
  );
}
