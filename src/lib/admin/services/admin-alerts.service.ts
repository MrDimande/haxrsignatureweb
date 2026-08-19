import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import { buildOverdueAlerts } from "@/lib/finance/extended-analytics";
import { countPendingConciergeReviews } from "@/lib/concierge/repositories/concierge.repository";
import {
  buildPortalApprovalAlerts,
} from "@/lib/admin/services/portal-approval-alerts";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";

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
  source?: AdminAttentionSource;
};

export type AdminBadgeCounts = {
  newLeads: number;
  overdueDocuments: number;
  conciergePending: number;
  portalApprovalsPending: number;
  portalClientResponses: number;
  portalPaymentProofsPending: number;
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
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
    documentsRepo.listDocuments({ limit: 200 }),
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

export async function getAdminAlerts(limit = 8): Promise<AdminAlert[]> {
  const [inquiries, documents, conciergePending] = await Promise.all([
    inquiriesRepo.listInquiries(),
    documentsRepo.listDocuments({ limit: 100 }),
    countPendingConciergeReviews(),
  ]);

  const alerts: AdminAlert[] = [];

  for (const inquiry of inquiries.filter((i) => i.status === "new").slice(0, 3)) {
    alerts.push({
      id: `lead-${inquiry.id}`,
      text: `Novo lead: ${inquiry.name}`,
      time: relativeTime(inquiry.createdAt),
      read: false,
      href: "/admin/leads",
      priority: "high",
      source: "commercial",
    });
  }

  alerts.push(
    ...buildPortalApprovalAlerts({
      documents,
      relativeTime,
      limit: 4,
    })
  );

  for (const alert of buildOverdueAlerts(documents).slice(0, 3)) {
    alerts.push({
      id: `overdue-${alert.documentId}`,
      text: `${alert.documentNumber} em atraso (${alert.daysOverdue} dias)`,
      time: relativeTime(alert.dueDate),
      read: false,
      href: `/admin/documents/${alert.documentId}`,
      priority: "high",
      source: "finance",
    });
  }

  if (conciergePending > 0) {
    alerts.push({
      id: "concierge-pending",
      text: `${conciergePending} documento(s) Concierge por rever`,
      time: "Operações",
      read: false,
      href: "/admin/events",
      priority: "normal",
      source: "operations",
    });
  }

  const pendingProofs = await portalPremiumRepo.countPendingPaymentProofs();
  if (pendingProofs > 0) {
    alerts.push({
      id: "portal-payment-proofs",
      text: `${pendingProofs} comprovativo(s) do portal por validar`,
      time: "Financeiro",
      read: false,
      href: "/admin/cash",
      priority: "high",
      source: "finance",
    });
  }

  const priorityOrder = { high: 0, normal: 1 } as const;
  return alerts
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, limit);
}
