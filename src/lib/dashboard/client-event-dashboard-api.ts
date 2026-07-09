import type { ClientAppProfile } from "@/lib/auth/app-user-display";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { adaptDashboardData } from "@/lib/dashboard/dashboard-adapter";
import {
  getClientEventDashboardData,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { DashboardDataResult } from "@/lib/dashboard/types";
import type { ClientAppAuthEnvCheck } from "@/lib/supabase/config";

export type HandleClientEventDashboardRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  eventId: string;
  authClient: ClientEventDashboardAuthClient | null;
  profile?: Pick<ClientAppProfile, "full_name" | "app_role"> | null;
};

export type ClientEventDashboardApiResult = {
  status: number;
  body: DashboardDataResult;
};

export async function handleClientEventDashboardRequest(
  deps: HandleClientEventDashboardRequestDeps,
): Promise<ClientEventDashboardApiResult> {
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

  try {
    const result = await getClientEventDashboardData({
      authClient: deps.authClient,
      userId: deps.user.id,
      eventId: deps.eventId,
      profile: deps.profile ?? null,
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

    const adapted = adaptDashboardData(result.dashboard);
    if (!adapted.ok) {
      return {
        status: 500,
        body: {
          ok: false,
          error: "unavailable",
          message: "Resposta do painel inválida.",
        },
      };
    }

    return {
      status: 200,
      body: adapted,
    };
  } catch {
    return {
      status: 500,
      body: {
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar o painel.",
      },
    };
  }
}
