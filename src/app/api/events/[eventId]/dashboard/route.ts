import { NextResponse } from "next/server";
import {
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { handleClientEventDashboardRequest } from "@/lib/dashboard/client-event-dashboard-api";
import type { ClientEventDashboardAuthClient } from "@/lib/dashboard/client-event-dashboard-service";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { DashboardDataResult } from "@/lib/dashboard/types";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getDashboardData(trimmedEventId);
      if (!mockResult.ok) {
        const status = mockResult.error === "not_found" ? 404 : 503;
        return NextResponse.json(mockResult satisfies DashboardDataResult, { status });
      }
      return NextResponse.json(mockResult satisfies DashboardDataResult);
    }

    const envCheck = validateClientEventAuthEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventDashboardAuthClient>(request);

    const result = await handleClientEventDashboardRequest({
      envCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      profile: auth.profile,
    });

    return NextResponse.json(result.body satisfies DashboardDataResult, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar o painel.",
      } satisfies DashboardDataResult,
      { status: 500 },
    );
  }
}
