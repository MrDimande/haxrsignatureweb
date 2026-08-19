import type { Business, DashboardStats } from "@/lib/admin/types";
import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { EventPipelineStatus } from "@/lib/events/pipeline";
import type { FinanceOverview } from "@/lib/finance/types";
import type { ContactInquiry } from "@/lib/contact/types";
import {
  getAdminAlerts,
  type AdminAlert,
  type AdminAttentionSource,
} from "@/lib/admin/services/admin-alerts.service";
import * as analyticsRepo from "@/lib/admin/repositories/analytics.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as financeRepo from "@/lib/finance/repositories/overview.repository";
import { groupEventsByPipeline } from "@/lib/events/pipeline";

export type { AdminAttentionSource } from "@/lib/admin/services/admin-alerts.service";

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
  documents: DashboardStats;
  businesses: Business[];
  events: ManagedEvent[];
  eventGroups: Record<EventPipelineStatus, ManagedEvent[]>;
  guestStats: Record<string, EventListGuestStats>;
  finance: FinanceOverview;
  commercial: {
    newLeads: number;
    recentInquiries: ContactInquiry[];
  };
  analytics: {
    revenueByBusiness: RevenueByBusiness;
    revenueByMonth: RevenueByMonth;
  };
};

export type AdminDashboardSourceData = {
  fiscalYear: number;
  alerts: AdminAlert[];
  documents: DashboardStats;
  businesses: Business[];
  events: ManagedEvent[];
  guestStats: Record<string, EventListGuestStats>;
  finance: FinanceOverview;
  inquiries: ContactInquiry[];
  revenueByBusiness: RevenueByBusiness;
  revenueByMonth: RevenueByMonth;
};

/**
 * Resolves the operational source domain for an AdminAlert.
 */
export function resolveAttentionSource(alert: AdminAlert): AdminAttentionSource {
  if (alert.source) return alert.source;
  if (alert.id.startsWith("lead-") || alert.href === "/admin/leads") return "commercial";
  if (alert.id.startsWith("portal-approved-") || alert.id.startsWith("portal-changes-")) return "portal";
  if (alert.id.startsWith("overdue-") || alert.id === "portal-payment-proofs" || alert.href.startsWith("/admin/cash")) {
    return "finance";
  }
  if (alert.id === "concierge-pending" || alert.href === "/admin/events") return "operations";
  return "operations";
}

/**
 * Pure transformer from canonical AdminAlerts to dashboard operational action items.
 */
export function buildAdminAttentionItems(alerts: AdminAlert[]): AdminAttentionItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    label: alert.text,
    context: alert.time,
    href: alert.href,
    priority: alert.priority,
    source: resolveAttentionSource(alert),
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
  const generatedAt = (options?.now ?? new Date()).toISOString();
  const eventGroups = groupEventsByPipeline(source.events);

  const newLeads = source.inquiries.filter((inquiry) => inquiry.status === "new").length;
  const recentInquiries = source.inquiries.slice(0, 3);
  const attentionItems = buildAdminAttentionItems(source.alerts);

  return {
    generatedAt,
    fiscalYear: source.fiscalYear,
    attention: {
      items: attentionItems,
    },
    documents: source.documents,
    businesses: source.businesses,
    events: source.events,
    eventGroups,
    guestStats: source.guestStats,
    finance: source.finance,
    commercial: {
      newLeads,
      recentInquiries,
    },
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
    alerts,
    documents,
    businesses,
    events,
    finance,
    revenueByBusiness,
    revenueByMonth,
    inquiries,
  ] = await Promise.all([
    getAdminAlerts(8),
    documentsRepo.getDashboardStats(),
    businessesRepo.listBusinesses(),
    eventsRepo.listAllEvents(),
    financeRepo.getFinanceOverview(),
    analyticsRepo.getRevenueByBusiness(fiscalYear),
    analyticsRepo.getRevenueByMonth(fiscalYear),
    inquiriesRepo.listInquiries(),
  ]);

  const guestStats =
    events.length > 0
      ? await guestsRepo.listGuestStatsByEventIds(events.map((event) => event.id))
      : {};

  return buildAdminDashboardSnapshot(
    {
      fiscalYear,
      alerts,
      documents,
      businesses,
      events,
      guestStats,
      finance,
      inquiries,
      revenueByBusiness,
      revenueByMonth,
    },
    { now }
  );
}
