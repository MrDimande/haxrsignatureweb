import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { ChecklistModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import {
  getClientEventChecklistData,
  type ClientEventChecklistAuthClient,
} from "@/lib/checklist/client-event-checklist-service";
import type { ClientEventChecklistRpcClient } from "@/lib/checklist/client-event-checklist-rpc";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
  type ClientAppAuthEnvCheck,
} from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/server";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

export type HandleClientEventChecklistRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  serviceRoleCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  eventId: string;
  authClient: ClientEventChecklistAuthClient | null;
  rpcClient?: ClientEventChecklistRpcClient | null;
};

export type ClientEventChecklistApiResult = {
  status: number;
  body: ModuleDataResult<ChecklistModuleData>;
};

export async function handleClientEventChecklistRequest(
  deps: HandleClientEventChecklistRequestDeps,
): Promise<ClientEventChecklistApiResult> {
  if (!deps.envCheck.ok) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "unavailable",
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

  if (!isRealClientEventId(deps.eventId)) {
    return {
      status: 404,
      body: {
        ok: false,
        error: "not_found",
        message: "Evento não encontrado.",
      },
    };
  }

  if (!deps.authClient) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "unavailable",
        message: "Cliente Supabase indisponível.",
      },
    };
  }

  if (!deps.serviceRoleCheck.ok) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "unavailable",
        message: deps.serviceRoleCheck.message,
      },
    };
  }

  const rpcClient =
    deps.rpcClient ?? (createAdminClient() as unknown as ClientEventChecklistRpcClient);

  try {
    const result = await getClientEventChecklistData({
      authClient: deps.authClient,
      rpcClient,
      userId: deps.user.id,
      eventId: deps.eventId,
    });

    if (result.kind === "not_found") {
      return {
        status: 404,
        body: {
          ok: false,
          error: "not_found",
          message: "Evento não encontrado.",
        },
      };
    }

    if (result.kind === "forbidden") {
      return {
        status: 403,
        body: {
          ok: false,
          error: "forbidden",
          message: "Não tem permissão para aceder a este evento.",
        },
      };
    }

    if (result.kind === "operational_not_linked") {
      return {
        status: 409,
        body: {
          ok: false,
          error: "operational_not_linked",
          message:
            "O evento operacional ainda não está ligado. Aguarde o provisionamento ou contacte a equipa HAXR.",
        },
      };
    }

    if (result.kind === "unavailable") {
      return {
        status: 503,
        body: {
          ok: false,
          error: "unavailable",
          message: result.message,
        },
      };
    }

    return {
      status: 200,
      body: {
        ok: true,
        data: result.data,
      },
    };
  } catch {
    return {
      status: 500,
      body: {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar a checklist.",
      },
    };
  }
}

export async function loadClientEventChecklistModuleData(
  eventId: string,
): Promise<ModuleDataResult<ChecklistModuleData>> {
  const trimmedEventId = eventId.trim();

  if (!isRealClientEventId(trimmedEventId)) {
    return {
      ok: false,
      error: "not_found",
      message: "Evento não encontrado.",
    };
  }

  const envCheck = validateClientAppAuthEnvironment();
  const serviceRoleCheck = validateClientAppServiceRoleEnvironment();
  const session = await getCurrentAppSession();
  const supabase = envCheck.ok ? await createSupabaseServerAuthClient() : null;

  const result = await handleClientEventChecklistRequest({
    envCheck,
    serviceRoleCheck,
    user: session.user,
    eventId: trimmedEventId,
    authClient: supabase as unknown as ClientEventChecklistAuthClient | null,
  });

  return result.body;
}
