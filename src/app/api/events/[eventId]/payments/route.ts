import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getBudgetModuleData } from "@/lib/event-modules/get-event-module-data";
import type { BudgetModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventPaymentsRequest } from "@/lib/payments/client-event-payments-api";
import type { ClientEventPaymentsRpcClient } from "@/lib/payments/client-event-payments-rpc";
import type { ClientEventPaymentsAuthClient } from "@/lib/payments/client-event-payments-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getBudgetModuleData(trimmedEventId);
      const status = !mockResult.ok
        ? mockResult.error === "not_found"
          ? 404
          : 503
        : 200;
      return NextResponse.json(mockResult satisfies ModuleDataResult<BudgetModuleData>, {
        status,
      });
    }

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventPaymentsAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventPaymentsRpcClient>()
      : null;

    const result = await handleClientEventPaymentsRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
    });

    return NextResponse.json(result.body satisfies ModuleDataResult<BudgetModuleData>, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar os pagamentos.",
      } satisfies ModuleDataResult<BudgetModuleData>,
      { status: 500 },
    );
  }
}
