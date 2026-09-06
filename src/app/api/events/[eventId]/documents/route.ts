import { NextResponse } from "next/server";
import {
  createClientEventOperationalRpcClient,
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getDocumentModuleData } from "@/lib/event-modules/get-event-module-data";
import type { DocumentModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventDocumentsRequest } from "@/lib/documents/client-event-documents-api";
import type { ClientEventDocumentsRpcClient } from "@/lib/documents/client-event-documents-rpc";
import type { ClientEventDocumentsAuthClient } from "@/lib/documents/client-event-documents-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const trimmedEventId = eventId.trim();

    if (!isRealClientEventId(trimmedEventId)) {
      const mockResult = await getDocumentModuleData(trimmedEventId);
      const status = !mockResult.ok
        ? mockResult.error === "not_found"
          ? 404
          : 503
        : 200;
      return NextResponse.json(mockResult satisfies ModuleDataResult<DocumentModuleData>, {
        status,
      });
    }

    const envCheck = validateClientEventAuthEnvironment();
    const serviceRoleCheck = validateClientEventOperationalEnvironment();
    const auth = await resolveClientEventReadRequestAuth<ClientEventDocumentsAuthClient>(request);
    const rpcClient = serviceRoleCheck.ok
      ? createClientEventOperationalRpcClient<ClientEventDocumentsRpcClient>()
      : null;

    const result = await handleClientEventDocumentsRequest({
      envCheck,
      serviceRoleCheck,
      user: auth.user,
      eventId: trimmedEventId,
      authClient: auth.authClient,
      rpcClient,
    });

    return NextResponse.json(result.body satisfies ModuleDataResult<DocumentModuleData>, {
      status: result.status,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar os documentos.",
      } satisfies ModuleDataResult<DocumentModuleData>,
      { status: 500 },
    );
  }
}
