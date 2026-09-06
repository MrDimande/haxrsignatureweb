import { getCurrentAppSession } from "@/lib/auth/app-session";
import {
  createClientEventOperationalRpcClient,
  createClientEventReadAuthClient,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { ModuleDataResult, VendorModuleData } from "@/lib/event-modules/types";
import {
  getClientEventVendorsData,
  type ClientEventVendorsAuthClient,
} from "@/lib/vendors/client-event-vendors-service";
import type { ClientEventVendorsRpcClient } from "@/lib/vendors/client-event-vendors-rpc";
import type { ClientAppAuthEnvCheck } from "@/lib/supabase/config";

export type HandleClientEventVendorsRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  serviceRoleCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  eventId: string;
  authClient: ClientEventVendorsAuthClient | null;
  rpcClient?: ClientEventVendorsRpcClient | null;
};

export type ClientEventVendorsApiResult = {
  status: number;
  body: ModuleDataResult<VendorModuleData>;
};

export async function handleClientEventVendorsRequest(
  deps: HandleClientEventVendorsRequestDeps,
): Promise<ClientEventVendorsApiResult> {
  if (!deps.envCheck.ok) {
    return { status: 503, body: { ok: false, error: "unavailable", message: deps.envCheck.message } };
  }
  if (!deps.user) {
    return { status: 401, body: { ok: false, error: "unauthorized", message: "Sessão inválida ou expirada." } };
  }
  if (!isRealClientEventId(deps.eventId)) {
    return { status: 404, body: { ok: false, error: "not_found", message: "Evento não encontrado." } };
  }
  if (!deps.authClient) {
    return { status: 503, body: { ok: false, error: "unavailable", message: "Cliente de acesso indisponível." } };
  }
  if (!deps.serviceRoleCheck.ok) {
    return { status: 503, body: { ok: false, error: "unavailable", message: deps.serviceRoleCheck.message } };
  }

  const rpcClient =
    deps.rpcClient ?? createClientEventOperationalRpcClient<ClientEventVendorsRpcClient>();

  try {
    const result = await getClientEventVendorsData({
      authClient: deps.authClient,
      rpcClient,
      userId: deps.user.id,
      eventId: deps.eventId,
    });

    if (result.kind === "not_found") {
      return { status: 404, body: { ok: false, error: "not_found", message: "Evento não encontrado." } };
    }
    if (result.kind === "forbidden") {
      return { status: 403, body: { ok: false, error: "forbidden", message: "Não tem permissão para aceder a este evento." } };
    }
    if (result.kind === "operational_not_linked") {
      return {
        status: 409,
        body: {
          ok: false,
          error: "operational_not_linked",
          message: "O evento operacional ainda não está ligado. Aguarde o provisionamento ou contacte a equipa HAXR.",
        },
      };
    }
    if (result.kind === "unavailable") {
      return { status: 503, body: { ok: false, error: "unavailable", message: result.message } };
    }

    return { status: 200, body: { ok: true, data: result.data } };
  } catch {
    return { status: 500, body: { ok: false, error: "unavailable", message: "Não foi possível carregar os fornecedores." } };
  }
}

export async function loadClientEventVendorsModuleData(
  eventId: string,
): Promise<ModuleDataResult<VendorModuleData>> {
  const trimmedEventId = eventId.trim();
  if (!isRealClientEventId(trimmedEventId)) {
    return { ok: false, error: "not_found", message: "Evento não encontrado." };
  }

  const envCheck = validateClientEventAuthEnvironment();
  const serviceRoleCheck = validateClientEventOperationalEnvironment();
  const session = await getCurrentAppSession();
  const authClient = envCheck.ok
    ? await createClientEventReadAuthClient<ClientEventVendorsAuthClient>()
    : null;
  const rpcClient = serviceRoleCheck.ok
    ? createClientEventOperationalRpcClient<ClientEventVendorsRpcClient>()
    : null;

  const result = await handleClientEventVendorsRequest({
    envCheck,
    serviceRoleCheck,
    user: session.user,
    eventId: trimmedEventId,
    authClient,
    rpcClient,
  });

  return result.body;
}
