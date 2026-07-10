import type { DashboardData } from "@/lib/dashboard/types";
import type { ClientEventGuestsRpcPayload } from "@/lib/guests/client-event-guests-rpc";

/** Guest KPIs shared by the guests module and client dashboard. */
export type ClientEventDashboardGuestMetrics = {
  guestsTotal: number;
  guestsConfirmed: number;
  guestsPending: number;
  guestsDeclined: number;
  guestsPlusOnes: number;
  tablesAssigned: number;
  tablesTotal: number;
  guestSnapshot: DashboardData["guestSnapshot"];
};

export function mapRpcPayloadToDashboardGuestMetrics(
  payload: ClientEventGuestsRpcPayload,
): ClientEventDashboardGuestMetrics {
  const { summary } = payload;
  const guestSnapshot: DashboardData["guestSnapshot"] = {
    total: summary.total,
    confirmed: summary.confirmed,
    pending: summary.pending,
    declined: summary.declined,
    plusOnes: summary.plusOnes,
    tablesAssigned: summary.tablesAssigned,
    tablesTotal: summary.tablesTotal,
  };

  return {
    guestsTotal: summary.total,
    guestsConfirmed: summary.confirmed,
    guestsPending: summary.pending,
    guestsDeclined: summary.declined,
    guestsPlusOnes: summary.plusOnes,
    tablesAssigned: summary.tablesAssigned,
    tablesTotal: summary.tablesTotal,
    guestSnapshot,
  };
}
