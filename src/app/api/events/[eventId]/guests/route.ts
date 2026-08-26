import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getGuestModuleData } from "@/lib/event-modules/get-event-module-data";
import type { GuestModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventGuestsRequest } from "@/lib/guests/client-event-guests-api";
import type { ClientEventGuestsRpcClient } from "@/lib/guests/client-event-guests-rpc";
import type { ClientEventGuestsAuthClient } from "@/lib/guests/client-event-guests-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getGuestModuleData(trimmedEventId);
      const status = !mockResult.ok
        ? mockResult.error === "not_found"
          ? 404
          : 503
        : 200;
      return NextResponse.json(mockResult satisfies ModuleDataResult<GuestModuleData>, {
        status,
      });
    }

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventGuestsAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventGuestsRpcClient>()
      : null;

    const result = await handleClientEventGuestsRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
    });

    return NextResponse.json(result.body satisfies ModuleDataResult<GuestModuleData>, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar os convidados.",
      } satisfies ModuleDataResult<GuestModuleData>,
      { status: 500 },
    );
  }
}
