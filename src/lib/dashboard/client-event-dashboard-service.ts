import { formatOnboardingEventDate } from "@/lib/auth/onboarding-storage";
import type { ClientAppProfile } from "@/lib/auth/app-user-display";
import type { DashboardData } from "@/lib/dashboard/types";
import type {
  ClientEventRow,
  ClientEventStatus,
  ClientEventType,
} from "@/lib/events/client-app-database.types";

export type ClientEventDashboardAccessResult =
  | { kind: "ok"; event: ClientEventRow }
  | { kind: "not_found" }
  | { kind: "forbidden" };

type QueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

type EqChain<T> = {
  eq(column: string, value: string | boolean): EqChain<T>;
  maybeSingle(): Promise<QueryResult<T>>;
};

type MemberRow = { id: string };

export type ClientEventDashboardAuthClient = {
  from(table: "client_events"): {
    select(columns: string): EqChain<ClientEventRow>;
  };
  from(table: "event_members"): {
    select(columns: string): EqChain<MemberRow>;
  };
};

function mapEventTypeLabel(eventType: ClientEventType): string {
  switch (eventType) {
    case "wedding":
      return "Casamento";
    case "birthday":
      return "Aniversário";
    case "corporate":
      return "Evento corporativo";
    case "baby_shower":
      return "Baby shower";
    case "graduation":
      return "Formatura";
    case "other":
      return "Evento";
    default: {
      const exhaustive: never = eventType;
      return exhaustive;
    }
  }
}

function mapStatusLabel(status: ClientEventStatus): string {
  switch (status) {
    case "planning":
      return "Em planeamento";
    case "active":
      return "Activo";
    case "completed":
      return "Concluído";
    case "archived":
      return "Arquivado";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function resolveBudgetEstimated(event: ClientEventRow): number {
  return event.budget_max ?? event.budget_min ?? 0;
}

export function mapClientEventToDashboardData(
  event: ClientEventRow,
  profile: Pick<ClientAppProfile, "full_name" | "app_role"> | null,
): DashboardData {
  const guests = event.estimated_guests ?? 0;
  const budget = resolveBudgetEstimated(event);
  const dateIso = event.event_date ?? undefined;
  const dateLabel = dateIso ? formatOnboardingEventDate(dateIso) : "Data por definir";
  const responsible =
    profile?.full_name?.trim() ||
    (profile?.app_role === "planner" ? "Planner HAXR" : "Equipa HAXR");

  return {
    eventOverview: {
      eventId: event.id,
      slug: event.slug,
      name: event.event_name,
      type: mapEventTypeLabel(event.event_type),
      date: dateLabel,
      dateIso,
      location: event.event_location || "Local por definir",
      status: mapStatusLabel(event.status),
      responsible,
      progress: event.status === "planning" ? 8 : event.status === "active" ? 20 : 0,
    },
    meta: {
      lastSyncedAt: event.updated_at,
      lastSyncedLabel: "Agora",
      role: "client",
    },
    stats: [
      {
        id: "guests-estimated",
        label: "Convidados estimados",
        value: guests,
        valueType: "number",
        detail: "definidos no evento",
      },
      {
        id: "guests-confirmed",
        label: "Convidados confirmados",
        value: 0,
        valueType: "number",
        detail: `de ${guests} convidados`,
      },
      {
        id: "budget-planned",
        label: "Orçamento planeado",
        value: budget,
        valueType: "currency",
        detail: budget > 0 ? "definido no evento" : "ainda por definir",
      },
      {
        id: "tasks-open",
        label: "Tarefas abertas",
        value: 0,
        valueType: "number",
        detail: "sem dados operacionais",
      },
      {
        id: "vendors-active",
        label: "Fornecedores activos",
        value: 0,
        valueType: "number",
        detail: "comece a adicionar",
      },
      {
        id: "documents",
        label: "Documentos",
        value: 0,
        valueType: "number",
        detail: "HAXR Concierge",
      },
    ],
    progress: [
      { id: "overall", name: "Progresso Geral", value: event.status === "planning" ? 8 : 0 },
      { id: "checklist", name: "Checklist", value: 0 },
      { id: "guests", name: "Convidados", value: 0 },
      { id: "vendors", name: "Fornecedores", value: 0 },
      { id: "finance", name: "Financeiro", value: budget > 0 ? 5 : 0 },
      { id: "invitation", name: "Convite Digital", value: 0 },
    ],
    nextActions: [
      {
        id: "action-guests",
        title: "Importar lista de convidados",
        dueDate: "Esta semana",
        priority: "Alta",
        status: "open",
        href: `/app/events/${event.id}/guests`,
      },
      {
        id: "action-checklist",
        title: "Rever checklist inicial",
        dueDate: "Esta semana",
        priority: "Média",
        status: "open",
        href: `/app/events/${event.id}/checklist`,
      },
    ],
    checklistTemplates: [
      {
        id: "starter",
        title: "Checklist inicial HAXR",
        badge: "Recomendado",
        description: "Primeiros passos para estruturar o vosso evento.",
      },
    ],
    modules: [
      {
        id: "guests",
        title: "Convidados",
        description: "Lista e confirmações",
        metric: `${guests} estimados`,
        href: `/app/events/${event.id}/guests`,
        status: "setup",
        category: "Experiência",
      },
      {
        id: "budget",
        title: "Orçamento",
        description: "Controlo financeiro",
        metric: budget > 0 ? `${budget.toLocaleString("pt-MZ")} MT` : "Por definir",
        href: `/app/events/${event.id}/budget`,
        status: budget > 0 ? "setup" : "inactive",
        category: "Operação",
      },
      {
        id: "checklist",
        title: "Checklist",
        description: "Tarefas do evento",
        metric: "0 tarefas",
        href: `/app/events/${event.id}/checklist`,
        status: "setup",
        category: "Planeamento",
      },
      {
        id: "concierge",
        title: "HAXR Concierge",
        description: "Documentos e propostas",
        metric: "Activar",
        href: "/app/concierge",
        status: "setup",
        category: "Overview",
      },
    ],
    financeSnapshot: {
      currency: "MT",
      budgetEstimated: budget,
      budgetRegistered: 0,
      paidAmount: 0,
      pendingAmount: 0,
      nextPayment: {
        vendorName: "—",
        dueDate: "—",
        amount: 0,
      },
    },
    guestSnapshot: {
      total: guests,
      confirmed: 0,
      pending: guests,
      declined: 0,
      plusOnes: 0,
      tablesAssigned: 0,
      tablesTotal: 0,
    },
    vendorSnapshot: [],
    recentActivity: [
      {
        id: `event-created-${event.id}`,
        title: "Evento criado",
        description: `${event.event_name} está pronto no painel.`,
        timestamp: event.created_at,
        relativeLabel: "Recente",
        type: "other",
      },
    ],
    conciergeSummary: {
      documentsToday: 0,
      contractsAwaiting: 0,
      proposalsApproval: 0,
      guestsNoResponse: guests,
      href: "/app/concierge",
    },
  };
}

export async function resolveClientEventDashboardAccess(
  authClient: ClientEventDashboardAuthClient,
  userId: string,
  eventId: string,
): Promise<ClientEventDashboardAccessResult> {
  const { data: event, error } = await authClient
    .from("client_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!event) {
    return { kind: "not_found" };
  }

  if (event.owner_user_id === userId) {
    return { kind: "ok", event };
  }

  const { data: membership, error: memberError } = await authClient
    .from("event_members")
    .select("id")
    .eq("client_event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (membership) {
    return { kind: "ok", event };
  }

  return { kind: "forbidden" };
}

export async function getClientEventDashboardData(input: {
  authClient: ClientEventDashboardAuthClient;
  userId: string;
  eventId: string;
  profile?: Pick<ClientAppProfile, "full_name" | "app_role"> | null;
}): Promise<ClientEventDashboardAccessResult & { dashboard?: DashboardData }> {
  const access = await resolveClientEventDashboardAccess(
    input.authClient,
    input.userId,
    input.eventId,
  );

  if (access.kind !== "ok") {
    return access;
  }

  return {
    kind: "ok",
    event: access.event,
    dashboard: mapClientEventToDashboardData(access.event, input.profile ?? null),
  };
}
