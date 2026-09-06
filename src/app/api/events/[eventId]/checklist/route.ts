import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getChecklistModuleData } from "@/lib/event-modules/get-event-module-data";
import type { ChecklistModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventChecklistRequest } from "@/lib/checklist/client-event-checklist-api";
import type { ClientEventChecklistRpcClient } from "@/lib/checklist/client-event-checklist-rpc";
import type { ClientEventChecklistAuthClient } from "@/lib/checklist/client-event-checklist-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getChecklistModuleData(trimmedEventId);
      const status = !mockResult.ok
        ? mockResult.error === "not_found"
          ? 404
          : 503
        : 200;
      return NextResponse.json(mockResult satisfies ModuleDataResult<ChecklistModuleData>, {
        status,
      });
    }

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventChecklistAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventChecklistRpcClient>()
      : null;

    const result = await handleClientEventChecklistRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
    });

    return NextResponse.json(result.body satisfies ModuleDataResult<ChecklistModuleData>, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar a checklist.",
      } satisfies ModuleDataResult<ChecklistModuleData>,
      { status: 500 },
    );
  }
}
