import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import type {
  CreateClientEventDeps,
  CreateClientEventResult,
} from "@/lib/events/client-event-service";
import { createClientEventFromPayload } from "@/lib/events/client-event-service";
import { parseCreateClientEventPayload } from "@/lib/events/create-event-validation";
import type { ClientAppAuthEnvCheck } from "@/lib/supabase/config";

export type CreateEventApiResponseBody =
  | {
      ok: true;
      created: boolean;
      data: {
        eventId: string;
        slug: string;
        status: string;
        eventName: string;
        eventType: string;
        eventDate: string | null;
        isActive: boolean;
        operationalEventId: string | null;
        operationalLinked: boolean;
        createdAt: string;
        redirectTo: string;
      };
    }
  | {
      ok: false;
      error: string;
      message: string;
      details?: { field: string; message: string }[];
      existingEventId?: string;
      redirectTo?: string;
    };

export type CreateEventApiResult = {
  status: number;
  body: CreateEventApiResponseBody;
};

export type CreateEventExecutor = (
  input: CreateClientEventInput,
  deps: { ownerUserId: string; idempotencyKey?: string | null },
) => Promise<CreateClientEventResult>;

export type HandleCreateEventRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  serviceRoleCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  rawBody: unknown;
  idempotencyKey: string | null;
  createDeps: Omit<CreateClientEventDeps, "ownerUserId"> | null;
  createEvent?: CreateEventExecutor | null;
};

export async function handleCreateEventRequest(
  deps: HandleCreateEventRequestDeps,
): Promise<CreateEventApiResult> {
  if (!deps.envCheck.ok) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "auth_unavailable",
        message: deps.envCheck.message,
      },
    };
  }

  if (!deps.user) {
    return {
      status: 401,
      body: {
        ok: false,
        error: "unauthorized",
        message: "Sessão inválida ou expirada.",
      },
    };
  }

  const parsed = parseCreateClientEventPayload(deps.rawBody);
  if (!parsed.ok) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "validation_error",
        message: "Dados do evento inválidos.",
        details: parsed.errors,
      },
    };
  }

  if (!deps.createEvent && !deps.createDeps) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "service_role_unavailable",
        message: deps.serviceRoleCheck.ok
          ? "Cliente de persistência indisponível."
          : deps.serviceRoleCheck.message,
      },
    };
  }

  const result = deps.createEvent
    ? await deps.createEvent(parsed.data, {
        ownerUserId: deps.user.id,
        idempotencyKey: deps.idempotencyKey,
      })
    : await createClientEventFromPayload(parsed.data, {
        ...deps.createDeps!,
        ownerUserId: deps.user.id,
        idempotencyKey: deps.idempotencyKey,
      });

  if (!result.ok) {
    return {
      status: result.status,
      body: {
        ok: false,
        error: result.error,
        message: result.message,
        ...(result.existingEventId
          ? { existingEventId: result.existingEventId }
          : {}),
        ...(result.redirectTo ? { redirectTo: result.redirectTo } : {}),
      },
    };
  }

  return {
    status: result.created ? 201 : 200,
    body: {
      ok: true,
      created: result.created,
      data: result.data,
    },
  };
}
