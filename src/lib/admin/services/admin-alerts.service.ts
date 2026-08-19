import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import { buildOverdueAlerts } from "@/lib/finance/extended-analytics";
import { countPendingConciergeReviews } from "@/lib/concierge/repositories/concierge.repository";
import {
  buildPortalApprovalAlerts,
} from "@/lib/admin/services/portal-approval-alerts";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import type { AdminOperationalDocument, InvoiceDocument } from "@/lib/admin/types";
import type { ContactInquiry } from "@/lib/contact/types";

export type AdminAttentionSource =
  | "commercial"
  | "finance"
  | "portal"
  | "operations";

export type AdminAlert = {
  id: string;
  text: string;
  time: string;
  read: boolean;
  href: string;
  priority: "high" | "normal";
  source: AdminAttentionSource;
  requiresAction: boolean;
};

export type AdminBadgeCounts = {
  newLeads: number;
  overdueDocuments: number;
  conciergePending: number;
  portalApprovalsPending: number;
  portalClientResponses: number;
  portalPaymentProofsPending: number;
};

function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ontem" : `Há ${days} dias`;
}

export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  const [
    newLeads,
    documents,
    conciergePending,
    portalApprovalsPending,
    portalClientResponses,
    portalPaymentProofsPending,
  ] = await Promise.all([
    inquiriesRepo.countNewInquiries(),
    documentsRepo.listOperationalDocuments(),
    countPendingConciergeReviews(),
    documentsRepo.countPortalApprovalsPending(),
    documentsRepo.countPortalClientResponses(),
    portalPremiumRepo.countPendingPaymentProofs(),
  ]);

  const overdueDocuments = buildOverdueAlerts(documents).length;

  return {
    newLeads,
    overdueDocuments,
    conciergePending,
    portalApprovalsPending,
    portalClientResponses,
    portalPaymentProofsPending,
  };
}

export type BuildCanonicalAdminAlertsInput = {
  inquiries: ContactInquiry[];
  documents: readonly AdminOperationalDocument[];
  conciergePending: number;
  pendingProofs: number;
  options?: {
    maxLeads?: number;
    maxPortalApprovals?: number;
    maxOverdue?: number;
    now?: Date;
  };
};

/**
 * Pure builder that generates all canonical alerts from loaded source data.
 * When options are omitted, produces the uncapped set of all canonical operational signals.
 */
export function buildCanonicalAdminAlerts(
  input: BuildCanonicalAdminAlertsInput
): AdminAlert[] {
  const now = input.options?.now ?? new Date();
  const formatTime = (iso: string) => relativeTime(iso, now);
  const alerts: AdminAlert[] = [];

  const newInquiries = input.inquiries.filter((i) => i.status === "new");
  const filteredInquiries =
    typeof input.options?.maxLeads === "number"
      ? newInquiries.slice(0, input.options.maxLeads)
      : newInquiries;

  for (const inquiry of filteredInquiries) {
    alerts.push({
      id: `lead-${inquiry.id}`,
      text: `Novo lead: ${inquiry.name}`,
      time: formatTime(inquiry.createdAt),
      read: false,
      href: "/admin/leads",
      priority: "high",
      source: "commercial",
      requiresAction: true,
    });
  }

  alerts.push(
    ...buildPortalApprovalAlerts({
      documents: input.documents,
      relativeTime: formatTime,
      limit: input.options?.maxPortalApprovals,
    })
  );

  const overdueAlerts = buildOverdueAlerts(input.documents, now);
  const filteredOverdue =
    typeof input.options?.maxOverdue === "number"
      ? overdueAlerts.slice(0, input.options.maxOverdue)
      : overdueAlerts;

  for (const alert of filteredOverdue) {
    alerts.push({
      id: `overdue-${alert.documentId}`,
      text: `${alert.documentNumber} em atraso (${alert.daysOverdue} dias)`,
      time: formatTime(alert.dueDate),
      read: false,
      href: `/admin/documents/${alert.documentId}`,
      priority: "high",
      source: "finance",
      requiresAction: true,
    });
  }

  if (input.conciergePending > 0) {
    alerts.push({
      id: "concierge-pending",
      text: `${input.conciergePending} documento(s) Concierge por rever`,
      time: "Operações",
      read: false,
      href: "/admin/events",
      priority: "normal",
      source: "operations",
      requiresAction: true,
    });
  }

  if (input.pendingProofs > 0) {
    alerts.push({
      id: "portal-payment-proofs",
      text: `${input.pendingProofs} comprovativo(s) do portal por validar`,
      time: "Financeiro",
      read: false,
      href: "/admin/cash",
      priority: "high",
      source: "finance",
      requiresAction: true,
    });
  }

  return alerts;
}

/**
 * Builds canonical alerts with standard per-category feed caps for the Header notification drawer.
 */
export function buildAdminAlerts(
  input: {
    inquiries: ContactInquiry[];
    documents: readonly AdminOperationalDocument[];
    conciergePending: number;
    pendingProofs: number;
  },
  options?: { now?: Date }
): AdminAlert[] {
  return buildCanonicalAdminAlerts({
    ...input,
    options: {
      maxLeads: 3,
      maxPortalApprovals: 4,
      maxOverdue: 3,
      ...(options?.now ? { now: options.now } : {}),
    },
  });
}

const PRIORITY_ORDER = { high: 0, normal: 1 } as const;

/**
 * Pure builder that builds canonical alerts, filters requiresAction === true,
 * ranks by operational priority (high before normal with stable ordering),
 * and applies the display limit.
 */
export function buildAdminAttentionFeed(
  source: BuildCanonicalAdminAlertsInput,
  limit = 8,
  options?: { now?: Date }
): AdminAlert[] {
  const resolvedNow = options?.now ?? source.options?.now;
  const canonicalAlerts = buildCanonicalAdminAlerts({
    ...source,
    options: {
      ...source.options,
      ...(resolvedNow ? { now: resolvedNow } : {}),
    },
  });
  return canonicalAlerts
    .filter((alert) => alert.requiresAction)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, limit);
}

/**
 * Loads all canonical admin alerts for the Header notification drawer (with category feed caps).
 */
export async function getAdminAlerts(limit = 8): Promise<AdminAlert[]> {
  const [inquiries, documents, conciergePending, pendingProofs] = await Promise.all([
    inquiriesRepo.listInquiries(),
    documentsRepo.listOperationalDocuments(),
    countPendingConciergeReviews(),
    portalPremiumRepo.countPendingPaymentProofs(),
  ]);

  const alerts = buildAdminAlerts({
    inquiries,
    documents,
    conciergePending,
    pendingProofs,
  });

  return alerts
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, limit);
}

/**
 * Loads actionable admin alerts for the Attention Required operational surface.
 * Performs UNCAPPED canonical signal construction, filters requiresAction === true,
 * ranks by operational priority (high before normal with stable ordering), and applies the display limit.
 */
export async function getAdminAttentionAlerts(limit = 8): Promise<AdminAlert[]> {
  const [inquiries, documents, conciergePending, pendingProofs] = await Promise.all([
    inquiriesRepo.listInquiries(),
    documentsRepo.listOperationalDocuments(),
    countPendingConciergeReviews(),
    portalPremiumRepo.countPendingPaymentProofs(),
  ]);

  return buildAdminAttentionFeed(
    {
      inquiries,
      documents,
      conciergePending,
      pendingProofs,
    },
    limit
  );
}
