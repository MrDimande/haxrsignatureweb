import type { AdminOperationalDocument, Business } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { EventPipelineStatus } from "@/lib/events/pipeline";
import type { ContactInquiry } from "@/lib/contact/types";
import type {
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
import type { PaymentsBatchResult } from "@/lib/finance/repositories/payments.repository";
import {
  buildAdminAttentionFeed,
  type AdminAlert,
  type AdminAttentionSource,
} from "@/lib/admin/services/admin-alerts.service";
import {
  buildAdminClientDecisions,
  type AdminClientDecisions,
  type AdminClientDecisionItem,
  type AdminClientDecisionSummary,
  type AdminClientDecisionCoverage,
  type AdminDecisionOwner,
  type AdminClientDecisionKind,
} from "@/lib/admin/services/admin-client-decisions.service";
import {
  getEventPortfolioOperationalSnapshots,
  buildEventPortfolioHealth,
  type EventPortfolioHealthItem,
  type EventPortfolioHealthSummary,
  type EventPortfolioOperationalSnapshot,
} from "@/lib/admin/services/event-portfolio.service";
import {
  buildAdminUpcomingAgenda,
  type AdminUpcomingAgendaItem,
  type AdminUpcomingAgenda,
} from "@/lib/admin/services/admin-upcoming-agenda.service";
import {
  buildAdminCommercialPipeline,
  type AdminCommercialPipeline,
  type AdminCommercialPipelineItem,
  type AdminCommercialPipelineSummary,
  type AdminActiveCommercialStage,
  type AdminCommercialStage,
} from "@/lib/admin/services/admin-commercial-pipeline.service";
import {
  buildAdminFinancialPosition,
  type AdminFinancialPosition,
  type AdminFinancialCoverage,
  type AdminMoneyBucket,
  type AdminFinancialExposureItem,
  type AdminFinancialMovement,
} from "@/lib/admin/services/admin-financial-position.service";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import { countPendingConciergeReviews } from "@/lib/concierge/repositories/concierge.repository";
import { groupEventsByPipeline, resolveEventPipelineStatus } from "@/lib/events/pipeline";

export type { AdminAttentionSource } from "@/lib/admin/services/admin-alerts.service";
export type {
  AdminClientDecisions,
  AdminClientDecisionItem,
  AdminClientDecisionSummary,
  AdminClientDecisionCoverage,
  AdminDecisionOwner,
  AdminClientDecisionKind,
};
export type {
  EventPortfolioHealthItem,
  EventPortfolioHealthSummary,
  EventPortfolioOperationalSnapshot,
};
export type {
  AdminUpcomingAgendaItem,
  AdminUpcomingAgenda,
};
export type {
  AdminCommercialPipeline,
  AdminCommercialPipelineItem,
  AdminCommercialPipelineSummary,
  AdminActiveCommercialStage,
  AdminCommercialStage,
};
export type {
  AdminFinancialPosition,
  AdminFinancialCoverage,
  AdminMoneyBucket,
  AdminFinancialExposureItem,
  AdminFinancialMovement,
};

export type AdminAttentionItem = {
  id: string;
  label: string;
  context: string;
  href: string;
  priority: "high" | "normal";
  source: AdminAttentionSource;
};

export type AdminDocumentSummary = {
  totalProformas: number;
  totalInvoices: number;
  totalReceipts: number;
  totalDraft: number;
  totalPaid: number;
};

export type AdminDashboardSnapshot = {
  generatedAt: string;
  attention: {
    items: AdminAttentionItem[];
  };
  clientDecisions: AdminClientDecisions;
  portfolio: {
    items: EventPortfolioHealthItem[];
    summary: EventPortfolioHealthSummary;
  };
  upcoming: AdminUpcomingAgenda;
  documents: AdminDocumentSummary;
  businesses: Business[];
  events: ManagedEvent[];
  eventGroups: Record<EventPipelineStatus, ManagedEvent[]>;
  financialPosition: AdminFinancialPosition;
  commercial: AdminCommercialPipeline;
};

export type AdminDashboardSourceData = {
  operationalDocuments: AdminOperationalDocument[];
  inquiries: ContactInquiry[];
  conciergePending: number;
  paymentProofsBatch: {
    available: boolean;
    items: PortalPaymentProof[];
  };
  creativeApprovalsBatch: {
    available: boolean;
    items: PortalCreativeApproval[];
  };
  portfolioSnapshots: EventPortfolioOperationalSnapshot[];
  timelineBatch: {
    available: boolean;
    items: PortalTimelineItem[];
  };
  paymentsBatch: PaymentsBatchResult;
  businesses: Business[];
  events: ManagedEvent[];
};

/**
 * Pure transformer from canonical AdminAlerts to dashboard operational action items.
 * Defensively ensures only actionable items (requiresAction === true) enter the operational surface.
 */
export function buildAdminAttentionItems(alerts: AdminAlert[]): AdminAttentionItem[] {
  return alerts
    .filter((alert) => alert.requiresAction)
    .map((alert) => ({
      id: alert.id,
      label: alert.text,
      context: alert.time,
      href: alert.href,
      priority: alert.priority,
      source: alert.source,
    }));
}

/**
 * Builds document counts summary directly from loaded operational documents in memory.
 */
export function buildAdminDocumentSummary(
  documents: readonly AdminOperationalDocument[]
): AdminDocumentSummary {
  let totalProformas = 0;
  let totalInvoices = 0;
  let totalReceipts = 0;
  let totalDraft = 0;
  let totalPaid = 0;

  for (const doc of documents) {
    if (doc.documentType === "proforma") totalProformas++;
    else if (doc.documentType === "invoice") totalInvoices++;
    else if (doc.documentType === "receipt") totalReceipts++;

    if (doc.status === "draft") totalDraft++;
    else if (doc.status === "paid") totalPaid++;
  }

  return {
    totalProformas,
    totalInvoices,
    totalReceipts,
    totalDraft,
    totalPaid,
  };
}

/**
 * Resolves the current fiscal year according to Africa/Maputo timezone.
 */
export function getMaputoFiscalYear(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
  }).formatToParts(now);
  const yearStr = parts.find((p) => p.type === "year")?.value;
  return yearStr ? Number(yearStr) : now.getFullYear();
}

/**
 * Pure builder that deterministically compiles raw repository data into an AdminDashboardSnapshot.
 * Useful for fast and isolated unit tests.
 */
export function buildAdminDashboardSnapshot(
  source: AdminDashboardSourceData,
  options?: { now?: Date }
): AdminDashboardSnapshot {
  const now = options?.now ?? new Date();
  const generatedAt = now.toISOString();
  const eventGroups = groupEventsByPipeline(source.events, now);

  const attentionAlerts = buildAdminAttentionFeed(
    {
      inquiries: source.inquiries,
      documents: source.operationalDocuments,
      conciergePending: source.conciergePending,
      pendingProofs: source.paymentProofsBatch.available
        ? source.paymentProofsBatch.items.length
        : 0,
    },
    8,
    { now }
  );
  const attentionItems = buildAdminAttentionItems(attentionAlerts);

  const clientDecisions = buildAdminClientDecisions({
    documents: source.operationalDocuments,
    events: source.events,
    creativeApprovals: source.creativeApprovalsBatch,
    paymentProofs: source.paymentProofsBatch,
    options: { now },
  });

  const portfolio = buildEventPortfolioHealth(source.portfolioSnapshots);
  const upcoming = buildAdminUpcomingAgenda(
    {
      events: source.events,
      timeline: source.timelineBatch,
    },
    { now }
  );
  const commercial = buildAdminCommercialPipeline(source.inquiries);
  const documentsSummary = buildAdminDocumentSummary(source.operationalDocuments);
  const financialPosition = buildAdminFinancialPosition(
    {
      documents: source.operationalDocuments,
      paymentsBatch: source.paymentsBatch,
    },
    { now }
  );

  return {
    generatedAt,
    attention: {
      items: attentionItems,
    },
    clientDecisions,
    portfolio,
    upcoming,
    documents: documentsSummary,
    businesses: source.businesses,
    events: source.events,
    eventGroups,
    financialPosition,
    commercial,
  };
}

/**
 * Canonical orchestrator for fetching all admin dashboard data.
 */
export async function getAdminDashboardSnapshot(
  options?: { now?: Date }
): Promise<AdminDashboardSnapshot> {
  const now = options?.now ?? new Date();

  const [
    inquiries,
    operationalDocuments,
    conciergePending,
    paymentProofsBatch,
    businesses,
    events,
    paymentsBatch,
  ] = await Promise.all([
    inquiriesRepo.listInquiries(),
    documentsRepo.listOperationalDocuments(),
    countPendingConciergeReviews(),
    portalPremiumRepo.listPendingPaymentProofsBatch(),
    businessesRepo.listBusinesses(),
    eventsRepo.listAllEvents(),
    paymentsRepo.listPaymentsBatch(),
  ]);

  const allEventIds = events.map((e) => e.id);

  const operationalEvents = events.filter((event) => {
    const pipeline = resolveEventPipelineStatus(event, now);
    return pipeline === "planning" || pipeline === "active";
  });
  const operationalEventIds = operationalEvents.map((e) => e.id);

  const [portfolioSnapshots, timelineBatch, creativeApprovalsBatch] =
    await Promise.all([
      getEventPortfolioOperationalSnapshots(events, { now }),
      portalPremiumRepo.listTimelineByEventIds(operationalEventIds),
      portalPremiumRepo.listCreativeApprovalsByEventIds(allEventIds),
    ]);

  return buildAdminDashboardSnapshot(
    {
      operationalDocuments,
      inquiries,
      conciergePending,
      paymentProofsBatch,
      creativeApprovalsBatch,
      portfolioSnapshots,
      timelineBatch,
      paymentsBatch,
      businesses,
      events,
    },
    { now }
  );
}
