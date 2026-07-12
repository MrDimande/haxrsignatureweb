import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getChecklistModuleData } from "@/lib/event-modules/get-event-module-data";
import type { ChecklistModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import { handleClientEventChecklistRequest } from "@/lib/checklist/client-event-checklist-api";
import type { ClientEventChecklistAuthClient } from "@/lib/checklist/client-event-checklist-service";
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

    const envCheck = validateClientAppAuthEnvironment();
    const serviceRoleCheck = validateClientAppServiceRoleEnvironment();
    const session = await getCurrentAppSession();
    const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);

    const result = await handleClientEventChecklistRequest({
      envCheck,
      serviceRoleCheck,
      user: user ?? session.user,
      eventId: trimmedEventId,
      authClient: envCheck.ok
        ? (supabase as unknown as ClientEventChecklistAuthClient)
        : null,
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
