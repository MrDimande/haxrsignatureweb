/**
 * Autenticação e autorização do portal Concierge — stubs preparados para produção.
 *
 * NOTA ARQUITECTURAL: O email inbound do HAXR Concierge (encaminhamento de propostas,
 * recibos, listas) deve ser uma integração SEPARADA do email marketing outbound (Brevo).
 * Não usar campanhas, listas ou templates Brevo para intake do Concierge.
 *
 * TODO: Integrar com Supabase Auth / portal_sessions quando portal auth estiver activo.
 */

export type PortalConciergeRole = "client" | "planner" | "team" | "admin" | "vendor";

export type PortalConciergeAction =
  | "intake_create"
  | "item_view"
  | "item_classify"
  | "item_validate"
  | "item_route"
  | "item_reject"
  | "item_archive"
  | "suggestion_apply"
  | "view_confidence"
  | "view_activity"
  | "view_routing_logs";

export interface PortalConciergeActor {
  id: string | null;
  name: string;
  role: PortalConciergeRole;
  /** Eventos a que o actor tem acesso; null = dev/unrestricted */
  eventIds: string[] | null;
}

const TEAM_ACTIONS: PortalConciergeAction[] = [
  "intake_create",
  "item_view",
  "item_classify",
  "item_validate",
  "item_route",
  "item_reject",
  "item_archive",
  "suggestion_apply",
  "view_confidence",
  "view_activity",
  "view_routing_logs",
];

const CLIENT_ACTIONS: PortalConciergeAction[] = [
  "intake_create",
  "item_view",
  "item_archive",
];

/**
 * TODO: Resolver sessão real a partir de cookies/headers.
 * Por agora: modo desenvolvimento com visão team (sem bloquear UX).
 */
export async function getCurrentPortalActor(
  _request?: Request
): Promise<PortalConciergeActor> {
  // TODO: Ler haxr_portal_session / Supabase Auth
  return {
    id: null,
    name: "Equipa HAXR",
    role: "team",
    eventIds: null,
  };
}

/**
 * TODO: Validar ownership via portal_users + event_members.
 */
export function assertUserCanAccessEvent(
  actor: PortalConciergeActor,
  eventId: string
): void {
  if (actor.eventIds === null) return;
  if (!actor.eventIds.includes(eventId)) {
    throw new ConciergeAuthError("forbidden", "Sem acesso a este evento.");
  }
}

export function assertUserCanPerformConciergeAction(
  actor: PortalConciergeActor,
  action: PortalConciergeAction
): void {
  const allowed = resolveAllowedActions(actor.role);
  if (!allowed.includes(action)) {
    throw new ConciergeAuthError("forbidden", "Acção não permitida para o seu perfil.");
  }
}

export function resolveAllowedActions(role: PortalConciergeRole): PortalConciergeAction[] {
  switch (role) {
    case "admin":
    case "planner":
    case "team":
      return TEAM_ACTIONS;
    case "client":
      return CLIENT_ACTIONS;
    case "vendor":
      return ["item_view"];
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function canPerformAction(
  actor: PortalConciergeActor,
  action: PortalConciergeAction
): boolean {
  return resolveAllowedActions(actor.role).includes(action);
}

export class ConciergeAuthError extends Error {
  readonly code: "forbidden" | "unauthorized";

  constructor(code: "forbidden" | "unauthorized", message: string) {
    super(message);
    this.code = code;
    this.name = "ConciergeAuthError";
  }
}
