import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getVendorModuleData } from "@/lib/event-modules/get-event-module-data";
import type { ModuleDataResult, VendorModuleData } from "@/lib/event-modules/types";
import { handleClientEventVendorsRequest } from "@/lib/vendors/client-event-vendors-api";
import type { ClientEventVendorsRpcClient } from "@/lib/vendors/client-event-vendors-rpc";
import type { ClientEventVendorsAuthClient } from "@/lib/vendors/client-event-vendors-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getVendorModuleData(trimmedEventId);
      const status = !mockResult.ok
        ? mockResult.error === "not_found"
          ? 404
          : 503
        : 200;
      return NextResponse.json(mockResult satisfies ModuleDataResult<VendorModuleData>, {
        status,
      });
    }

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventVendorsAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventVendorsRpcClient>()
      : null;

    const result = await handleClientEventVendorsRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
    });

    return NextResponse.json(result.body satisfies ModuleDataResult<VendorModuleData>, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar os fornecedores.",
      } satisfies ModuleDataResult<VendorModuleData>,
      { status: 500 },
    );
  }
}
