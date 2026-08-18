import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { handleClientEventFinancialReportRequest } from "@/lib/payments/client-event-payments-api";
import type { ClientEventPaymentsAuthClient } from "@/lib/payments/client-event-payments-service";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
} from "@/lib/supabase/config";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    // Rejeição estrita de eventos demo/mock para relatórios oficiais
    if (!isRealClientEventId(trimmedEventId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "not_found",
          message: "Relatórios oficiais apenas disponíveis para eventos reais autenticados.",
        },
        { status: 404 },
      );
    }

    const envCheck = validateClientAppAuthEnvironment();
    const serviceRoleCheck = validateClientAppServiceRoleEnvironment();
    const session = await getCurrentAppSession();
    const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);

    const result = await handleClientEventFinancialReportRequest({
      envCheck,
      serviceRoleCheck,
      user: user ?? session.user,
      eventId: trimmedEventId,
      authClient: envCheck.ok
        ? (supabase as unknown as ClientEventPaymentsAuthClient)
        : null,
    });

    if (result.status !== 200 || !result.buffer) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "unavailable",
          message: result.error || "Não foi possível gerar o relatório financeiro.",
        },
        { status: result.status },
      );
    }

    const filename = result.filename || `HAXR_Wedding_Financial_Report_${trimmedEventId}.pdf`;

    return new Response(result.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Ocorreu um erro inesperado ao gerar o relatório financeiro.",
      },
      { status: 500 },
    );
  }
}
