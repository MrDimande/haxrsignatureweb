import { getCurrentAppSession } from "@/lib/auth/app-session";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Autenticação e autorização do portal Concierge.
 *
 * O email inbound do HAXR Concierge permanece separado do email marketing
 * outbound. O actor desta área é resolvido pela mesma sessão provider-aware do
 * client app; o acesso ao evento é validado no backend antes de qualquer CRUD.
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
  /** Chaves de eventos acessíveis: client_event UUID, slug e operational UUID. */
  eventIds: string[] | null;
}

type AccessibleEventRow = {
  id: string;
  slug: string | null;
  operational_event_id: string | null;
};

type EventMembershipRow = {
  client_event_id: string;
};

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

function resolvePortalRole(appRole: string | null | undefined): PortalConciergeRole {
  switch (appRole?.trim().toLowerCase()) {
    case "admin":
      return "admin";
    case "planner":
      return "planner";
    case "team":
      return "team";
    case "vendor":
      return "vendor";
    default:
      return "client";
  }
}

function collectEventKeys(rows: AccessibleEventRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.id) keys.add(row.id);
    if (row.slug?.trim()) keys.add(row.slug.trim());
    if (row.operational_event_id?.trim()) keys.add(row.operational_event_id.trim());
  }
  return [...keys];
}

async function listAccessibleEventKeysNeon(userId: string): Promise<string[]> {
  const result = await neonQuery<AccessibleEventRow>(
    `SELECT DISTINCT
       ce.id::text AS id,
       ce.slug,
       ce.operational_event_id::text AS operational_event_id
     FROM public.client_events ce
     LEFT JOIN public.event_members em
       ON em.client_event_id = ce.id
      AND em.user_id = $1::uuid
     WHERE ce.owner_user_id = $1::uuid
        OR em.user_id = $1::uuid`,
    [userId],
  );
  return collectEventKeys(result.rows);
}

async function listAccessibleEventKeysSupabase(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: owned, error: ownedError } = await supabase
    .from("client_events")
    .select("id, slug, operational_event_id")
    .eq("owner_user_id", userId);
  if (ownedError) throw new Error(ownedError.message);

  const { data: memberships, error: membershipsError } = await supabase
    .from("event_members")
    .select("client_event_id")
    .eq("user_id", userId);
  if (membershipsError) throw new Error(membershipsError.message);

  const membershipRows = (memberships ?? []) as EventMembershipRow[];
  const memberIds = Array.from(
    new Set(membershipRows.map((row) => row.client_event_id).filter(Boolean)),
  );

  let memberEvents: AccessibleEventRow[] = [];
  if (memberIds.length > 0) {
    const { data, error } = await supabase
      .from("client_events")
      .select("id, slug, operational_event_id")
      .in("id", memberIds);
    if (error) throw new Error(error.message);
    memberEvents = (data ?? []) as AccessibleEventRow[];
  }

  return collectEventKeys([
    ...((owned ?? []) as AccessibleEventRow[]),
    ...memberEvents,
  ]);
}

async function listAccessibleEventKeys(userId: string): Promise<string[]> {
  return shouldUseNeonServerDatabase()
    ? listAccessibleEventKeysNeon(userId)
    : listAccessibleEventKeysSupabase(userId);
}

/** Resolve a sessão real do client app e os eventos que o actor pode aceder. */
export async function getCurrentPortalActor(
  _request?: Request,
): Promise<PortalConciergeActor> {
  const session = await getCurrentAppSession();
  if (!session.user) {
    throw new ConciergeAuthError("unauthorized", "Inicie sessão para aceder ao HAXR Concierge.");
  }

  const role = resolvePortalRole(session.profile?.app_role);
  const name =
    session.profile?.full_name?.trim() ||
    session.user.email?.trim() ||
    "Utilizador HAXR";

  return {
    id: session.user.id,
    name,
    role,
    eventIds:
      role === "admin"
        ? null
        : await listAccessibleEventKeys(session.user.id),
  };
}

export function assertUserCanAccessEvent(
  actor: PortalConciergeActor,
  eventId: string,
): void {
  if (actor.eventIds === null) return;
  if (!actor.eventIds.includes(eventId)) {
    throw new ConciergeAuthError("forbidden", "Sem acesso a este evento.");
  }
}

export function assertUserCanPerformConciergeAction(
  actor: PortalConciergeActor,
  action: PortalConciergeAction,
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
  action: PortalConciergeAction,
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
