import { NextResponse } from "next/server";
import {
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { createClientEventFromPayloadNeon } from "@/lib/events/client-event.neon.service";
import { handleCreateEventRequest } from "@/lib/events/create-event-api";

export async function POST(request: Request) {
  const envCheck = validateClientEventAuthEnvironment();
  const serviceRoleCheck = validateClientEventOperationalEnvironment();

  let user: { id: string } | null = null;

  if (envCheck.ok) {
    const resolved = await resolveClientEventReadRequestAuth(request);
    user = resolved.user;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = undefined;
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || null;

  const result = await handleCreateEventRequest({
    envCheck,
    serviceRoleCheck,
    user,
    rawBody: raw,
    idempotencyKey,
    createDeps: null,
    createEvent: serviceRoleCheck.ok ? createClientEventFromPayloadNeon : null,
  });

  return NextResponse.json(result.body, { status: result.status });
}
