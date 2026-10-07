import { NextResponse } from "next/server";
import {
  createClientEventOperationalReader,
} from "@/lib/portal/client-event-operational.neon.repository";
import {
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getRsvpModuleData } from "@/lib/event-modules/get-event-module-data";
import type { ModuleDataResult, RSVPModuleData } from "@/lib/event-modules/types";
import { handleClientEventRsvpRequest } from "@/lib/rsvp/client-event-rsvp-api";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const trimmedEventId = eventId.trim();

  if (!isRealClientEventId(trimmedEventId)) {
    const result = await getRsvpModuleData(trimmedEventId);
    const status = !result.ok ? (result.error === "not_found" ? 404 : 503) : 200;
    return NextResponse.json(result satisfies ModuleDataResult<RSVPModuleData>, { status });
  }

  const envCheck = validateClientEventAuthEnvironment();
  const serviceRoleCheck = validateClientEventOperationalEnvironment();
  const auth = await resolveClientEventReadRequestAuth(request);
  const result = await handleClientEventRsvpRequest({
    envCheck,
    serviceRoleCheck,
    user: auth.user,
    eventId: trimmedEventId,
    authClient: auth.authClient,
    operationalReader: serviceRoleCheck.ok ? createClientEventOperationalReader() : null,
  });
  return NextResponse.json(result.body satisfies ModuleDataResult<RSVPModuleData>, {
    status: result.status,
  });
}
