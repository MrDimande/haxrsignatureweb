import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getVendorModuleData } from "@/lib/event-modules/get-event-module-data";
import type { ModuleDataResult, VendorModuleData } from "@/lib/event-modules/types";
import { handleClientEventVendorsRequest } from "@/lib/vendors/client-event-vendors-api";
import type { ClientEventVendorsAuthClient } from "@/lib/vendors/client-event-vendors-service";
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

    const envCheck = validateClientAppAuthEnvironment();
    const serviceRoleCheck = validateClientAppServiceRoleEnvironment();
    const session = await getCurrentAppSession();
    const { user, supabase } = await resolveAuthenticatedSupabaseClient(request);

    const result = await handleClientEventVendorsRequest({
      envCheck,
      serviceRoleCheck,
      user: user ?? session.user,
      eventId: trimmedEventId,
      authClient: envCheck.ok
        ? (supabase as unknown as ClientEventVendorsAuthClient)
        : null,
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
