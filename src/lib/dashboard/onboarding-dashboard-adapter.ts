import {
  buildCoupleDisplayName,
  buildOnboardingEventSlug,
  formatOnboardingEventDate,
  readOnboardingData,
  resolveEventTypeLabel,
  type OnboardingRawData,
  type OnboardingStorageReader,
} from "@/lib/auth/onboarding-storage";
import type { DashboardData } from "@/lib/dashboard/types";

export const ONBOARDING_DASHBOARD_EVENT_ID = "onboarding-local";

/**
 * Transforms onboarding wizard data into a temporary DashboardData payload.
 * This is a bridge until real auth + event API exist.
 */
export function adaptOnboardingToDashboardData(data: OnboardingRawData): DashboardData {
  const slug = buildOnboardingEventSlug(data);
  const eventName = buildCoupleDisplayName(data);
  const eventType = resolveEventTypeLabel(data.role);
  const dateLabel = formatOnboardingEventDate(data.eventDateIso);
  const budget = data.estimatedBudget ?? 0;
  const guests = data.guestsCount;

  return {
    eventOverview: {
      eventId: ONBOARDING_DASHBOARD_EVENT_ID,
      slug,
      name: eventName,
      type: eventType,
      date: dateLabel,
      dateIso: data.eventDateIso,
      location: data.location,
      status: "Em planeamento",
      responsible: data.role === "consultor" ? "Consultor HAXR" : "Equipa HAXR",
      progress: 8,
    },
    meta: {
      lastSyncedAt: new Date().toISOString(),
      lastSyncedLabel: "Agora",
      role: "client",
    },
    stats: [
      {
        id: "guests-estimated",
        label: "Convidados estimados",
        value: guests,
        valueType: "number",
        detail: "definidos no onboarding",
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
        detail: budget > 0 ? "definido no onboarding" : "ainda por definir",
      },
      {
        id: "tasks-open",
        label: "Tarefas abertas",
        value: 6,
        valueType: "number",
        detail: "checklist inicial",
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
      { id: "overall", name: "Progresso Geral", value: 8 },
      { id: "checklist", name: "Checklist", value: 5 },
      { id: "guests", name: "Convidados", value: 0 },
      { id: "vendors", name: "Fornecedores", value: 0 },
      { id: "finance", name: "Financeiro", value: budget > 0 ? 10 : 0 },
      { id: "invitation", name: "Convite Digital", value: 0 },
    ],
    nextActions: [
      {
        id: "action-profile",
        title: "Completar perfil do evento",
        dueDate: "Hoje",
        priority: "Alta",
        status: "open",
        href: `/app/events/${slug}/checklist`,
      },
      {
        id: "action-guests",
        title: "Importar lista de convidados",
        dueDate: "Esta semana",
        priority: "Alta",
        status: "open",
        href: `/app/events/${slug}/guests`,
      },
      {
        id: "action-budget",
        title: budget > 0 ? "Validar orçamento inicial" : "Definir orçamento",
        dueDate: "Esta semana",
        priority: "Média",
        status: "open",
        href: `/app/events/${slug}/budget`,
      },
    ],
    checklistTemplates: [
      {
        id: "starter",
        title: "Checklist inicial HAXR",
        badge: "Recomendado",
        description: "Primeiros passos após o onboarding para estruturar o vosso evento.",
      },
    ],
    modules: [
      {
        id: "guests",
        title: "Convidados",
        description: "Lista e confirmações",
        metric: `${guests} estimados`,
        href: `/app/events/${slug}/guests`,
        status: "setup",
        category: "Experiência",
      },
      {
        id: "budget",
        title: "Orçamento",
        description: "Controlo financeiro",
        metric: budget > 0 ? `${budget.toLocaleString("pt-MZ")} MT` : "Por definir",
        href: `/app/events/${slug}/budget`,
        status: budget > 0 ? "setup" : "inactive",
        category: "Operação",
      },
      {
        id: "checklist",
        title: "Checklist",
        description: "Tarefas do evento",
        metric: "6 tarefas",
        href: `/app/events/${slug}/checklist`,
        status: "active",
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
    checklistSnapshot: [],
    documentSnapshot: [],
    recentActivity: [
      {
        id: "onboarding-complete",
        title: "Onboarding concluído",
        description: `Perfil criado para ${eventName}.`,
        timestamp: new Date().toISOString(),
        relativeLabel: "Agora",
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

/** Reads onboarding storage and returns dashboard data, or null if incomplete. */
export function buildDashboardFromOnboardingStore(
  store: OnboardingStorageReader,
): DashboardData | null {
  const raw = readOnboardingData(store);
  if (!raw) return null;
  return adaptOnboardingToDashboardData(raw);
}
