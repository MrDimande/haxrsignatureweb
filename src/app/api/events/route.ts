import { NextResponse } from "next/server";
import {
  resolveClientEventReadRequestAuth,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { createClientEventFromPayloadNeon } from "@/lib/events/client-event.neon.service";
import { handleCreateEventRequest } from "@/lib/events/create-event-api";
import type { CreateClientEventDeps } from "@/lib/events/client-event-service";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { createAdminClient } from "@/lib/supabase/server";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
} from "@/lib/supabase/config";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";

export async function POST(request: Request) {
  const useNeon = shouldUseNeonServerDatabase();
  const envCheck = useNeon
    ? validateClientEventAuthEnvironment()
    : validateClientAppAuthEnvironment();
  const serviceRoleCheck = useNeon
    ? validateClientEventOperationalEnvironment()
    : validateClientAppServiceRoleEnvironment();

  let user: { id: string } | null = null;
  let authSupabase: Awaited<
    ReturnType<typeof resolveAuthenticatedSupabaseClient>
  >["supabase"] | null = null;

  if (envCheck.ok) {
    if (useNeon) {
      const resolved = await resolveClientEventReadRequestAuth<unknown>(request);
      user = resolved.user;
    } else {
      const resolved = await resolveAuthenticatedSupabaseClient(request);
      user = resolved.user;
      authSupabase = resolved.supabase;
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = undefined;
  }

  let createDeps: Omit<CreateClientEventDeps, "ownerUserId"> | null = null;
  if (!useNeon && envCheck.ok && serviceRoleCheck.ok && authSupabase) {
    try {
      createDeps = {
        authClient: authSupabase as unknown as CreateClientEventDeps["authClient"],
        adminClient: createAdminClient() as unknown as CreateClientEventDeps["adminClient"],
      };
    } catch {
      createDeps = null;
    }
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || null;

  const result = await handleCreateEventRequest({
    envCheck,
    serviceRoleCheck,
    user,
    rawBody: raw,
    idempotencyKey,
    createDeps,
    createEvent:
      useNeon && serviceRoleCheck.ok ? createClientEventFromPayloadNeon : null,
  });

  return NextResponse.json(result.body, { status: result.status });
}
