import { formatOnboardingEventDate } from "@/lib/auth/onboarding-storage";
import type { ClientAppProfile } from "@/lib/auth/app-user-display";
import {
  EMPTY_OPERATIONAL_KPIS,
  fetchOperationalKpis,
  listOperationalVendors,
  mapVendorStatusLabel,
  type ClientEventOperationalKpis,
} from "@/lib/dashboard/client-event-operational-kpis";
import type { DashboardData } from "@/lib/dashboard/types";
import type {
  ClientEventRow,
  ClientEventStatus,
  ClientEventType,
} from "@/lib/events/client-app-database.types";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

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

function percentOf(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((part / total) * 100));
}

function resolveGuestDisplayMetrics(
  event: ClientEventRow,
  operationalKpis: ClientEventOperationalKpis | null,
): {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  plusOnes: number;
  tablesAssigned: number;
  tablesTotal: number;
} {
  const estimatedGuests = event.estimated_guests ?? 0;

  if (!event.operational_event_id || !operationalKpis) {
    return {
      total: estimatedGuests,
      confirmed: 0,
      pending: estimatedGuests,
      declined: 0,
      plusOnes: 0,
      tablesAssigned: 0,
      tablesTotal: 0,
    };
  }

  return {
    total: operationalKpis.guestsTotal,
    confirmed: operationalKpis.guestsConfirmed,
    pending: operationalKpis.guestsPending,
    declined: operationalKpis.guestsDeclined,
    plusOnes: operationalKpis.guestsPlusOnes,
    tablesAssigned: operationalKpis.tablesAssigned,
    tablesTotal: operationalKpis.tablesTotal,
  };
}

export function mapClientEventToDashboardData(
  event: ClientEventRow,
  profile: Pick<ClientAppProfile, "full_name" | "app_role"> | null,
  operationalKpis: ClientEventOperationalKpis | null = null,
): DashboardData {
  const budget = resolveBudgetEstimated(event);
  const dateIso = event.event_date ?? undefined;
  const dateLabel = dateIso ? formatOnboardingEventDate(dateIso) : "Data por definir";
  const responsible =
    profile?.full_name?.trim() ||
    (profile?.app_role === "planner" ? "Planner HAXR" : "Equipa HAXR");

  const hasOperationalLink = Boolean(event.operational_event_id);
  const kpis = hasOperationalLink && operationalKpis ? operationalKpis : EMPTY_OPERATIONAL_KPIS;
  const guests = resolveGuestDisplayMetrics(event, hasOperationalLink ? kpis : null);

  const checklistOpen = Math.max(0, kpis.checklistTotal - kpis.checklistCompleted);
  const documentsCount =
    kpis.documentsCount + kpis.conciergeUploadsCount + kpis.conciergePortalItemsCount;
  const financeRegistered = kpis.paymentsTotal;
  const financePending = Math.max(0, budget - kpis.paymentsTotal);

  const vendorProgress = kpis.vendorsCount > 0 ? Math.min(100, kpis.vendorsCount * 15) : 0;
  const progressOverall = Math.round(
    (percentOf(guests.confirmed, Math.max(guests.total, 1)) +
      percentOf(kpis.checklistCompleted, Math.max(kpis.checklistTotal, 1)) +
      vendorProgress +
      percentOf(kpis.paymentsTotal, Math.max(budget, 1))) /
      4,
  );

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
      progress:
        hasOperationalLink && operationalKpis
          ? progressOverall
          : event.status === "planning"
            ? 8
            : event.status === "active"
              ? 20
              : 0,
    },
    meta: {
      lastSyncedAt: event.updated_at,
      lastSyncedLabel: "Agora",
      role: "client",
      operationalLinked: hasOperationalLink,
      operationalEventId: event.operational_event_id,
    },
    stats: [
      {
        id: "guests-estimated",
        label: hasOperationalLink ? "Convidados registados" : "Convidados estimados",
        value: guests.total,
        valueType: "number",
        detail: hasOperationalLink ? "na lista operacional" : "definidos no evento",
      },
      {
        id: "guests-confirmed",
        label: "Convidados confirmados",
        value: guests.confirmed,
        valueType: "number",
        detail: `de ${guests.total} convidados`,
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
        value: checklistOpen,
        valueType: "number",
        detail:
          hasOperationalLink && kpis.checklistTotal > 0
            ? `${kpis.checklistCompleted} concluídas`
            : hasOperationalLink
              ? "sem checklist operacional"
              : "sem dados operacionais",
      },
      {
        id: "vendors-active",
        label: "Fornecedores activos",
        value: kpis.vendorsCount,
        valueType: "number",
        detail:
          kpis.vendorsCount > 0
            ? "registados no evento"
            : hasOperationalLink
              ? "comece a adicionar"
              : "sem ligação operacional",
      },
      {
        id: "documents",
        label: "Documentos",
        value: documentsCount,
        valueType: "number",
        detail: hasOperationalLink ? "operacionais + Concierge" : "HAXR Concierge",
      },
    ],
    progress: [
      {
        id: "overall",
        name: "Progresso Geral",
        value:
          hasOperationalLink && operationalKpis
            ? progressOverall
            : event.status === "planning"
              ? 8
              : 0,
      },
      {
        id: "checklist",
        name: "Checklist",
        value: percentOf(kpis.checklistCompleted, Math.max(kpis.checklistTotal, 1)),
      },
      {
        id: "guests",
        name: "Convidados",
        value: percentOf(guests.confirmed, Math.max(guests.total, 1)),
      },
      {
        id: "vendors",
        name: "Fornecedores",
        value: kpis.vendorsCount > 0 ? Math.min(100, kpis.vendorsCount * 15) : 0,
      },
      {
        id: "finance",
        name: "Financeiro",
        value: percentOf(kpis.paymentsTotal, Math.max(budget, 1)),
      },
      {
        id: "invitation",
        name: "Convite Digital",
        value: 0,
      },
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
        metric:
          guests.total > 0
            ? `${guests.confirmed}/${guests.total} confirmados`
            : "0 registados",
        href: `/app/events/${event.id}/guests`,
        status: guests.total > 0 ? "active" : "setup",
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
        metric:
          kpis.checklistTotal > 0
            ? `${kpis.checklistCompleted}/${kpis.checklistTotal} tarefas`
            : "0 tarefas",
        href: `/app/events/${event.id}/checklist`,
        status: kpis.checklistTotal > 0 ? "active" : "setup",
        category: "Planeamento",
      },
      {
        id: "concierge",
        title: "HAXR Concierge",
        description: "Documentos e propostas",
        metric:
          documentsCount > 0 ? `${documentsCount} documentos` : "Activar",
        href: "/app/concierge",
        status: documentsCount > 0 ? "active" : "setup",
        category: "Overview",
      },
    ],
    financeSnapshot: {
      currency: "MT",
      budgetEstimated: budget,
      budgetRegistered: financeRegistered,
      paidAmount: kpis.paymentsTotal,
      pendingAmount: financePending,
      nextPayment: {
        vendorName: "—",
        dueDate: "—",
        amount: financePending,
      },
    },
    guestSnapshot: {
      total: guests.total,
      confirmed: guests.confirmed,
      pending: guests.pending,
      declined: guests.declined,
      plusOnes: guests.plusOnes,
      tablesAssigned: guests.tablesAssigned,
      tablesTotal: guests.tablesTotal,
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
      contractsAwaiting: kpis.conciergeReviewItemsCount,
      proposalsApproval: 0,
      guestsNoResponse: guests.pending,
      href: "/app/concierge",
    },
  };
}

export async function mapClientEventToDashboardDataWithOperationalKpis(
  event: ClientEventRow,
  profile: Pick<ClientAppProfile, "full_name" | "app_role"> | null,
): Promise<DashboardData> {
  let operationalKpis: ClientEventOperationalKpis | null = null;
  let vendorSnapshot: DashboardData["vendorSnapshot"] = [];

  if (event.operational_event_id && isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      operationalKpis = await fetchOperationalKpis(
        event.operational_event_id,
        { clientEventId: event.id, slug: event.slug },
        adminClient as never,
      );
      const vendors = await listOperationalVendors(event.operational_event_id, adminClient as never);
      vendorSnapshot = vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        service: vendor.service_category || "Fornecedor",
        status: mapVendorStatusLabel(vendor.status),
      }));
    } catch {
      operationalKpis = null;
      vendorSnapshot = [];
    }
  }

  const dashboard = mapClientEventToDashboardData(event, profile, operationalKpis);
  return { ...dashboard, vendorSnapshot };
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
    dashboard: await mapClientEventToDashboardDataWithOperationalKpis(
      access.event,
      input.profile ?? null,
    ),
  };
}
