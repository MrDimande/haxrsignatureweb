import { adaptDashboardData } from "@/lib/dashboard/dashboard-adapter";
import {
  DEFAULT_DASHBOARD_EVENT_ID,
  getMockDashboardData,
} from "@/lib/dashboard/mock-dashboard-data";
import type { DashboardDataResult } from "@/lib/dashboard/types";

/**
 * Loads dashboard data for an event.
 *
 * Current: mock data layer.
 * Future: replace internals with Supabase / Prisma / REST without changing UI.
 *
 * @param eventId - Optional event id; defaults to the demo event when omitted.
 */
export async function getDashboardData(eventId?: string): Promise<DashboardDataResult> {
  try {
    // TODO: Resolve active event from authenticated session when portal auth exists.
    // TODO: const session = await getPortalSession();
    // TODO: const resolvedId = eventId ?? session.activeEventId;

    const resolvedId = eventId?.trim() || DEFAULT_DASHBOARD_EVENT_ID;
    const mock = getMockDashboardData(resolvedId);

    if (!mock) {
      return {
        ok: false,
        error: "not_found",
        message: "Evento não encontrado.",
      };
    }

    // Simulate network latency in development for skeleton testing.
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    return adaptDashboardData(mock);
  } catch {
    return {
      ok: false,
      error: "unavailable",
      message: "Não foi possível carregar o painel.",
    };
  }
}
