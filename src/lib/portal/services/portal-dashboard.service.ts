import { getClientCommercialOverview } from "@/lib/admin/repositories/client-overview.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { ClientCommercialStats, InvoiceDocument } from "@/lib/admin/types";
import type { EventStats } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";
import {
  buildPortalTimeline,
  getUpcomingPortalMilestone,
  type PortalTimelineEntry,
} from "@/lib/portal/services/portal-timeline.service";
import { isPortalApprovalPending } from "@/lib/portal/services/portal-approval-rules";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import {
  calculateEventProgress,
  getNextOperationalDecision,
} from "@/lib/portal/services/operational-timeline.service";
import { PORTAL_PAYMENT_INSTRUCTIONS } from "@/lib/portal/services/portal-payment.service";
import { isDateHoldActive } from "@/lib/portal/date-hold";
import type {
  PortalContract,
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTeamMessage,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";

export type PortalEventSummary = {
  id: string;
  name: string;
  typeLabel: string;
  date: string | null;
  location: string;
  isActive: boolean;
  dateHoldUntil: string | null;
  stats: EventStats;
  progressPercent: number;
  operationalPhases: PortalTimelineItem[];
};

export type PortalDashboardData = {
  clientName: string;
  financial: ClientCommercialStats;
  events: PortalEventSummary[];
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
  timeline: PortalTimelineEntry[];
  pendingApprovals: InvoiceDocument[];
  creativeApprovals: PortalCreativeApproval[];
  pendingCreativeApprovals: PortalCreativeApproval[];
  messages: PortalTeamMessage[];
  contracts: PortalContract[];
  paymentProofs: PortalPaymentProof[];
  paymentInstructions: typeof PORTAL_PAYMENT_INSTRUCTIONS;
  operationalTimeline: PortalTimelineItem[];
  nextDecision: PortalTimelineItem | null;
  upcomingMilestone: PortalTimelineEntry | null;
  overallProgressPercent: number;
  activeDateHoldUntil: string | null;
};

export async function getPortalDashboardData(
  token: string
): Promise<PortalDashboardData | null> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) return null;

  const overview = await getClientCommercialOverview(client);
  const visibleDocuments = overview.documents.filter(
    (doc) => doc.status === "sent" || doc.status === "paid"
  );

  const eventsWithStats = await Promise.all(
    overview.events.map(async (event) => {
      const stats = await guestsRepo.getEventStats(event.id).catch(() => ({
        totalGuests: 0,
        invited: 0,
        confirmed: 0,
        checkedIn: 0,
        declined: 0,
        plusOnesTotal: 0,
        expectedAttendance: 0,
        unassignedGuests: 0,
        duplicateGuests: 0,
        assignedSeats: 0,
        totalSeats: 0,
        uniqueTables: 0,
        confirmationRate: 0,
        capacityUsed: 0,
        capacityAvailable: 0,
        groupCount: 0,
      }));

      const operationalPhases =
        await portalPremiumRepo.upsertOperationalTimelineForEvent(
          event.id,
          client.id
        );
      const progress = calculateEventProgress(operationalPhases);

      return {
        id: event.id,
        name: event.name,
        typeLabel: EVENT_TYPE_LABELS[event.type],
        date: event.date,
        location: event.location,
        isActive: event.isActive,
        dateHoldUntil: event.dateHoldUntil,
        stats,
        progressPercent: progress.percent,
        operationalPhases,
      } satisfies PortalEventSummary;
    })
  );

  const [
    creativeApprovals,
    messages,
    contracts,
    paymentProofs,
    operationalTimeline,
  ] = await Promise.all([
    portalPremiumRepo.listCreativeApprovalsForClient(client.id),
    portalPremiumRepo.listMessagesForClient(client.id),
    portalPremiumRepo.listContractsForClient(client.id),
    portalPremiumRepo.listPaymentProofsForClient(client.id),
    portalPremiumRepo.listTimelineForClient(client.id),
  ]);

  const timeline = buildPortalTimeline({
    events: overview.events,
    documents: visibleDocuments,
    payments: overview.payments,
  });

  const overallProgressPercent =
    eventsWithStats.length > 0
      ? Math.round(
          eventsWithStats.reduce((sum, event) => sum + event.progressPercent, 0) /
            eventsWithStats.length
        )
      : 0;

  const activeDateHoldUntil =
    overview.events
      .map((event) => event.dateHoldUntil)
      .filter((hold): hold is string => isDateHoldActive(hold))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  return {
    clientName: client.fullName,
    financial: overview.stats,
    events: eventsWithStats,
    documents: visibleDocuments,
    payments: overview.payments,
    timeline: timeline.slice(0, 12),
    pendingApprovals: visibleDocuments.filter(isPortalApprovalPending),
    creativeApprovals,
    pendingCreativeApprovals: creativeApprovals.filter(
      (item) => item.status === "pending"
    ),
    messages,
    contracts,
    paymentProofs,
    paymentInstructions: PORTAL_PAYMENT_INSTRUCTIONS,
    operationalTimeline,
    nextDecision: getNextOperationalDecision(operationalTimeline),
    upcomingMilestone: getUpcomingPortalMilestone(overview.events),
    overallProgressPercent,
    activeDateHoldUntil,
  };
}
