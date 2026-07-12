import { NextResponse } from "next/server";
import { resolveAuthenticatedSupabaseClient } from "@/lib/supabase/server-auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
} from "@/lib/supabase/config";
import { handleCreateEventRequest } from "@/lib/events/create-event-api";
import type { CreateClientEventDeps } from "@/lib/events/client-event-service";

export async function POST(request: Request) {
  const envCheck = validateClientAppAuthEnvironment();
  const serviceRoleCheck = validateClientAppServiceRoleEnvironment();

  let user: { id: string } | null = null;
  let authSupabase: Awaited<
    ReturnType<typeof resolveAuthenticatedSupabaseClient>
  >["supabase"] | null = null;

  if (envCheck.ok) {
    const resolved = await resolveAuthenticatedSupabaseClient(request);
    user = resolved.user;
    authSupabase = resolved.supabase;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = undefined;
  }

  let createDeps: Omit<CreateClientEventDeps, "ownerUserId"> | null = null;
  if (envCheck.ok && serviceRoleCheck.ok && authSupabase) {
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
  });

  return NextResponse.json(result.body, { status: result.status });
}
