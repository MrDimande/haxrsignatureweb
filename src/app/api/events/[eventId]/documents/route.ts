import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getDocumentModuleData } from "@/lib/event-modules/get-event-module-data";
import type { DocumentModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventDocumentsRequest } from "@/lib/documents/client-event-documents-api";
import type { ClientEventDocumentsAuthClient } from "@/lib/documents/client-event-documents-service";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
} from "@/lib/supabase/config";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";

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

    const envCheck = validateClientAppAuthEnvironment();
    const serviceRoleCheck = validateClientAppServiceRoleEnvironment();
    const session = await getCurrentAppSession();
    const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);

    const result = await handleClientEventDocumentsRequest({
      envCheck,
      serviceRoleCheck,
      user: user ?? session.user,
      eventId: trimmedEventId,
      authClient: envCheck.ok
        ? (supabase as unknown as ClientEventDocumentsAuthClient)
        : null,
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
