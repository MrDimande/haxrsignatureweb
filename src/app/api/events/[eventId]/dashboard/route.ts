import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { handleClientEventDashboardRequest } from "@/lib/dashboard/client-event-dashboard-api";
import type { ClientEventDashboardAuthClient } from "@/lib/dashboard/client-event-dashboard-service";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { DashboardDataResult } from "@/lib/dashboard/types";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";
import { validateClientAppAuthEnvironment } from "@/lib/supabase/config";

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

    const envCheck = validateClientAppAuthEnvironment();
    const session = await getCurrentAppSession();
    const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);

    const result = await handleClientEventDashboardRequest({
      envCheck,
      user: user ?? session.user,
      eventId: trimmedEventId,
      authClient: envCheck.ok
        ? (supabase as unknown as ClientEventDashboardAuthClient)
        : null,
      profile: session.profile,
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
