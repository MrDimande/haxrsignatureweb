import { getCurrentAppSession } from "@/lib/auth/app-session";
import {
  createClientEventReadAuthClient,
  type ClientAppAuthEnvCheck,
  validateClientEventAuthEnvironment,
  validateClientEventOperationalEnvironment,
} from "@/lib/auth/client-event-server-clients";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import type { ModuleDataResult, RSVPModuleData } from "@/lib/event-modules/types";
import {
  createClientEventOperationalReader,
  type ClientEventOperationalReader,
} from "@/lib/portal/client-event-operational.neon.repository";
import {
  getClientEventRsvpData,
  toRsvpModuleResult,
  type ClientEventRsvpAuthClient,
} from "@/lib/rsvp/client-event-rsvp-service";

export type HandleClientEventRsvpRequestDeps = {
  envCheck: ClientAppAuthEnvCheck;
  serviceRoleCheck: ClientAppAuthEnvCheck;
  user: { id: string } | null;
  eventId: string;
  authClient: ClientEventRsvpAuthClient | null;
  operationalReader?: ClientEventOperationalReader | null;
};

export type ClientEventRsvpApiResult = {
  status: number;
  body: ModuleDataResult<RSVPModuleData>;
};

export async function handleClientEventRsvpRequest(
  deps: HandleClientEventRsvpRequestDeps,
): Promise<ClientEventRsvpApiResult> {
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

  const result = await getClientEventRsvpData({
    authClient: deps.authClient,
    operationalReader: deps.operationalReader ?? createClientEventOperationalReader(),
    userId: deps.user.id,
    eventId: deps.eventId,
  });
  const body = toRsvpModuleResult(result);
  const status =
    result.kind === "ok"
      ? 200
      : result.kind === "not_found"
        ? 404
        : result.kind === "forbidden"
          ? 403
          : result.kind === "operational_not_linked"
            ? 409
            : 503;
  return { status, body };
}

export async function loadClientEventRsvpModuleData(
  eventId: string,
): Promise<ModuleDataResult<RSVPModuleData>> {
  const trimmedEventId = eventId.trim();
  if (!isRealClientEventId(trimmedEventId)) {
    return { ok: false, error: "not_found", message: "Evento não encontrado." };
  }

  const envCheck = validateClientEventAuthEnvironment();
  const serviceRoleCheck = validateClientEventOperationalEnvironment();
  const session = await getCurrentAppSession();
  const authClient = envCheck.ok ? await createClientEventReadAuthClient() : null;
  return (
    await handleClientEventRsvpRequest({
      envCheck,
      serviceRoleCheck,
      user: session.user,
      eventId: trimmedEventId,
      authClient,
      operationalReader: serviceRoleCheck.ok ? createClientEventOperationalReader() : null,
    })
  ).body;
}
