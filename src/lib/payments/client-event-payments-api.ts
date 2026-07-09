import { getCurrentAppSession } from "@/lib/auth/app-session";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { BudgetModuleData, ModuleDataResult } from "@/lib/event-modules/types";
import {
  getClientEventPaymentsData,
  type ClientEventPaymentsAuthClient,
} from "@/lib/payments/client-event-payments-service";
import type { ClientEventPaymentsRpcClient } from "@/lib/payments/client-event-payments-rpc";
import {
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
  type ClientAppAuthEnvCheck,
} from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/server";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

export type HandleClientEventPaymentsRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  serviceRoleCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  eventId: string;
  authClient: ClientEventPaymentsAuthClient | null;
  rpcClient?: ClientEventPaymentsRpcClient | null;
};

export type ClientEventPaymentsApiResult = {
  status: number;
  body: ModuleDataResult<BudgetModuleData>;
};

export async function handleClientEventPaymentsRequest(
  deps: HandleClientEventPaymentsRequestDeps,
): Promise<ClientEventPaymentsApiResult> {
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
    deps.rpcClient ?? (createAdminClient() as unknown as ClientEventPaymentsRpcClient);

  try {
    const result = await getClientEventPaymentsData({
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
        message: "Não foi possível carregar os pagamentos.",
      },
    };
  }
}

export async function loadClientEventPaymentsModuleData(
  eventId: string,
): Promise<ModuleDataResult<BudgetModuleData>> {
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

  const result = await handleClientEventPaymentsRequest({
    envCheck,
    serviceRoleCheck,
    user: session.user,
    eventId: trimmedEventId,
    authClient: supabase as unknown as ClientEventPaymentsAuthClient | null,
  });

  return result.body;
}
