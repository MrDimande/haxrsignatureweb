import type { AdminOperationalDocument, Business, DashboardStats } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { EventPipelineStatus } from "@/lib/events/pipeline";
import type { FinanceOverview } from "@/lib/finance/types";
import type { ContactInquiry } from "@/lib/contact/types";
import type {
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
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
import * as analyticsRepo from "@/lib/admin/repositories/analytics.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as financeRepo from "@/lib/finance/repositories/overview.repository";
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

export type RevenueByBusiness = Awaited<ReturnType<typeof analyticsRepo.getRevenueByBusiness>>;
export type RevenueByMonth = Awaited<ReturnType<typeof analyticsRepo.getRevenueByMonth>>;

export type AdminAttentionItem = {
  id: string;
  label: string;
  context: string;
  href: string;
  priority: "high" | "normal";
  source: AdminAttentionSource;
};

export type AdminDashboardSnapshot = {
  generatedAt: string;
  fiscalYear: number;
  attention: {
    items: AdminAttentionItem[];
  };
  clientDecisions: AdminClientDecisions;
  portfolio: {
    items: EventPortfolioHealthItem[];
    summary: EventPortfolioHealthSummary;
  };
  upcoming: AdminUpcomingAgenda;
  documents: DashboardStats;
  businesses: Business[];
  events: ManagedEvent[];
  eventGroups: Record<EventPipelineStatus, ManagedEvent[]>;
  finance: FinanceOverview;
  commercial: AdminCommercialPipeline;
  analytics: {
    revenueByBusiness: RevenueByBusiness;
    revenueByMonth: RevenueByMonth;
  };
};

export type AdminDashboardSourceData = {
  fiscalYear: number;
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
  documents: DashboardStats;
  businesses: Business[];
  events: ManagedEvent[];
  finance: FinanceOverview;
  revenueByBusiness: RevenueByBusiness;
  revenueByMonth: RevenueByMonth;
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

  return {
    generatedAt,
    fiscalYear: source.fiscalYear,
    attention: {
      items: attentionItems,
    },
    clientDecisions,
    portfolio,
    upcoming,
    documents: source.documents,
    businesses: source.businesses,
    events: source.events,
    eventGroups,
    finance: source.finance,
    commercial,
    analytics: {
      revenueByBusiness: source.revenueByBusiness,
      revenueByMonth: source.revenueByMonth,
    },
  };
}

/**
 * Canonical orchestrator for fetching all admin dashboard data.
 */
export async function getAdminDashboardSnapshot(
  options?: { now?: Date }
): Promise<AdminDashboardSnapshot> {
  const now = options?.now ?? new Date();
  const fiscalYear = getMaputoFiscalYear(now);

  const [
    inquiries,
    operationalDocuments,
    conciergePending,
    paymentProofsBatch,
    documents,
    businesses,
    events,
    finance,
    revenueByBusiness,
    revenueByMonth,
  ] = await Promise.all([
    inquiriesRepo.listInquiries(),
    documentsRepo.listOperationalDocuments(),
    countPendingConciergeReviews(),
    portalPremiumRepo.listPendingPaymentProofsBatch(),
    documentsRepo.getDashboardStats(),
    businessesRepo.listBusinesses(),
    eventsRepo.listAllEvents(),
    financeRepo.getFinanceOverview(),
    analyticsRepo.getRevenueByBusiness(fiscalYear),
    analyticsRepo.getRevenueByMonth(fiscalYear),
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
      fiscalYear,
      operationalDocuments,
      inquiries,
      conciergePending,
      paymentProofsBatch,
      creativeApprovalsBatch,
      portfolioSnapshots,
      timelineBatch,
      documents,
      businesses,
      events,
      finance,
      revenueByBusiness,
      revenueByMonth,
    },
    { now }
  );
}
