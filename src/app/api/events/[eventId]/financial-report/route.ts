import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { handleClientEventFinancialReportRequest } from "@/lib/payments/client-event-payments-api";
import type { ClientEventPaymentsRpcClient } from "@/lib/payments/client-event-payments-rpc";
import type { ClientEventPaymentsAuthClient } from "@/lib/payments/client-event-payments-service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

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

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventPaymentsAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventPaymentsRpcClient>()
      : null;

    const result = await handleClientEventFinancialReportRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
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
  } catch {
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
