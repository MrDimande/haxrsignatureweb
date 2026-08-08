import type { DashboardData } from "@/lib/dashboard/types";

export const DEFAULT_DASHBOARD_EVENT_ID = "jessica-samuel";
export const DEFAULT_DASHBOARD_EVENT_SLUG = "jessica-samuel";

const MOCK_EVENTS: Record<string, DashboardData> = {
  [DEFAULT_DASHBOARD_EVENT_ID]: buildJessicaSamuelDashboard(),
};

function buildJessicaSamuelDashboard(): DashboardData {
  const slug = DEFAULT_DASHBOARD_EVENT_SLUG;

  return {
    eventOverview: {
      eventId: DEFAULT_DASHBOARD_EVENT_ID,
      slug,
      name: "Jessica & Samuel",
      type: "Casamento",
      date: "24 Agosto 2026",
      dateIso: "2026-08-24",
      location: "Maputo, Moçambique",
      status: "Em planeamento",
      responsible: "Equipa HAXR",
      progress: 72,
    },
    meta: {
      lastSyncedAt: new Date().toISOString(),
      lastSyncedLabel: "Hoje, 12:16",
      role: "client",
    },
    stats: [
      {
        id: "guests-confirmed",
        label: "Convidados confirmados",
        value: 186,
        valueType: "number",
        detail: "de 240 convidados",
      },
      {
        id: "rsvp-pending",
        label: "RSVP pendentes",
        value: 38,
        valueType: "number",
        detail: "aguardam resposta",
      },
      {
        id: "budget-registered",
        label: "Orçamento controlado",
        value: 85_000,
        valueType: "currency",
        detail: "registado até agora",
      },
      {
        id: "payments-pending",
        label: "Pagamentos pendentes",
        value: 55_000,
        valueType: "currency",
        detail: "próximo vencimento em 7 dias",
      },
      {
        id: "vendors-active",
        label: "Fornecedores activos",
        value: 0,
        valueType: "number",
        detail: "sem fornecedores registados",
      },
      {
        id: "tasks-open",
        label: "Tarefas abertas",
        value: 14,
        valueType: "number",
        detail: "5 prioritárias",
      },
    ],
    progress: [
      { id: "overall", name: "Progresso Geral", value: 72 },
      { id: "checklist", name: "Checklist", value: 64 },
      { id: "guests", name: "Convidados", value: 78 },
      { id: "vendors", name: "Fornecedores", value: 70 },
      { id: "finance", name: "Financeiro", value: 55 },
      { id: "invitation", name: "Convite Digital", value: 90 },
    ],
    nextActions: [
      {
        id: "action-1",
        title: "Aprovar convite digital",
        dueDate: "Hoje",
        priority: "Alta",
        status: "open",
        href: `/app/events/${slug}/invitations`,
      },
      {
        id: "action-2",
        title: "Confirmar proposta da decoração",
        dueDate: "Amanhã",
        priority: "Alta",
        status: "open",
        href: `/app/events/${slug}/vendors`,
      },
      {
        id: "action-3",
        title: "Validar pagamento do catering",
        dueDate: "Em 3 dias",
        priority: "Média",
        status: "open",
        href: `/app/events/${slug}/payments`,
      },
      {
        id: "action-4",
        title: "Fechar plano de mesas",
        dueDate: "Em 5 dias",
        priority: "Média",
        status: "open",
        href: `/app/events/${slug}/seating`,
      },
      {
        id: "action-5",
        title: "Activar QR Check-in",
        dueDate: "Em 7 dias",
        priority: "Baixa",
        status: "open",
        href: `/app/events/${slug}/check-in`,
      },
    ],
    checklistTemplates: [
      {
        id: "city-maputo",
        title: "Clássico Citadino (Maputo)",
        badge: "142 Tarefas · 12 Meses",
        description:
          "Estrutura tradicional com foco em igreja, recepção em salão ou hotel, e coordenadores locais.",
      },
      {
        id: "beach-bilene",
        title: "Casamento na Praia (Bilene)",
        badge: "160 Tarefas · 14 Meses",
        description:
          "Cronograma especializado com foco em licenças costeiras, tendas, catering externo e geradores.",
      },
      {
        id: "destination-bazaruto",
        title: "Destination Wedding (Bazaruto)",
        badge: "185 Tarefas · 18 Meses",
        description:
          "Planeamento logístico de alta complexidade: voos charter, barcos, reservas de resorts e transfers.",
      },
    ],
    modules: [
      {
        id: "event-mgmt",
        title: "Gestão dos Eventos",
        description: "Controle todos os detalhes do casamento num único espaço.",
        metric: "72% planeado",
        status: "active",
        href: "/app/events",
        category: "overview",
      },
      {
        id: "sales-funnel",
        title: "Funil de Vendas",
        description: "Gerencie leads, propostas, negociações e conversões.",
        metric: "5 leads activos",
        status: "active",
        href: "/app/leads",
        category: "management",
      },
      {
        id: "event-templates",
        title: "Modelos de Evento",
        description: "Use templates para acelerar casamentos, noivados, galas e eventos premium.",
        metric: "12 modelos",
        status: "active",
        href: "/app/templates",
        category: "planning",
      },
      {
        id: "budget-requests",
        title: "Solicitação de Orçamento",
        description: "Receba pedidos, organize briefings e transforme interessados em clientes.",
        metric: "4 pedidos novos",
        status: "active",
        href: "/app/requests",
        category: "management",
      },
      {
        id: "vendors",
        title: "Fornecedores",
        description: "Organize contactos, propostas, contratos, pagamentos e estados de aprovação.",
        metric: "8 fornecedores",
        status: "active",
        href: `/app/events/${slug}/vendors`,
        category: "operations",
      },
      {
        id: "contract-details",
        title: "Dados para Contrato",
        description: "Centralize informações necessárias para contratos e formalização do evento.",
        metric: "2 pendentes",
        status: "setup",
        href: `/app/events/${slug}/contracts`,
        category: "operations",
      },
      {
        id: "event-finance",
        title: "Financeiro do Evento",
        description: "Controle orçamento, sinais, saldos, comprovativos e vencimentos.",
        metric: "55.000 MT pendente",
        status: "active",
        href: `/app/events/${slug}/budget`,
        category: "finance",
      },
      {
        id: "guest-mgmt",
        title: "Gestão de Convidados",
        description: "Organize convidados, grupos, acompanhantes, RSVP e presença.",
        metric: "186 confirmados",
        status: "active",
        href: `/app/events/${slug}/guests`,
        category: "guests",
      },
      {
        id: "invites-rsvp",
        title: "Convites Digitais & RSVP",
        description: "Publique convites digitais, recolha confirmações e acompanhe respostas.",
        metric: "78% confirmado",
        status: "active",
        href: `/app/events/${slug}/invitations`,
        category: "guests",
      },
      {
        id: "seating-checkin",
        title: "Seating & QR Check-in",
        description: "Organize mesas, lugares, QR codes e check-in no dia do evento.",
        metric: "Em preparação",
        status: "setup",
        href: `/app/events/${slug}/check-in`,
        category: "operations",
      },
      {
        id: "moodboard",
        title: "Moodboard",
        description: "Guarde referências visuais, paleta de cores, decoração e estilo do casamento.",
        metric: "18 inspirações",
        status: "active",
        href: `/app/events/${slug}/moodboard`,
        category: "planning",
      },
      {
        id: "documents",
        title: "Documentos",
        description: "Centralize propostas, contratos, recibos, comprovativos e ficheiros do evento.",
        metric: "23 ficheiros",
        status: "active",
        href: `/app/events/${slug}/documents`,
        category: "operations",
      },
      {
        id: "photo-wall",
        title: "Photo Wall",
        description: "Crie uma experiência visual para recolher e exibir fotos do evento.",
        metric: "Por activar",
        status: "inactive",
        href: `/app/events/${slug}/photo-wall`,
        category: "experience",
      },
      {
        id: "reports",
        title: "Relatórios",
        description: "Veja desempenho, custos, convidados, fornecedores e evolução do evento.",
        metric: "Resumo disponível",
        status: "active",
        href: "/app/reports",
        category: "management",
      },
    ],
    financeSnapshot: {
      currency: "MT",
      budgetEstimated: 250_000,
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
      total: 240,
      confirmed: 186,
      pending: 38,
      declined: 16,
      plusOnes: 42,
      tablesAssigned: 12,
      tablesTotal: 24,
    },
    vendorSnapshot: [],
    checklistSnapshot: [
      {
        id: "tsk-1",
        title: "Aprovar convite digital",
        dueDate: "Hoje",
        priority: "alta",
        status: "em_curso",
      },
    ],
    documentSnapshot: [
      {
        id: "doc-4",
        title: "Lista_Convidados_v3.xlsx",
        source: "concierge_portal",
        status: "validado",
        uploadedLabel: "Ontem",
      },
      {
        id: "doc-5",
        title: "Paleta_Champagne_Dourado.png",
        source: "concierge_portal",
        status: "validado",
        uploadedLabel: "Há 3 dias",
      },
    ],
    recentActivity: [
      {
        id: "activity-1",
        title: "Lista de convidados actualizada",
        description: "Lista de convidados actualizada por e-mail",
        timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
        relativeLabel: "Há 12 min",
        type: "guests",
      },
      {
        id: "activity-4",
        title: "12 novos RSVPs confirmados",
        description: "12 novos RSVPs confirmados no convite digital",
        timestamp: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
        relativeLabel: "Ontem",
        type: "rsvp",
      },
      {
        id: "activity-5",
        title: "Moodboard actualizado",
        description: "Moodboard de estilo actualizado pela equipa HAXR",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
        relativeLabel: "Há 2 dias",
        type: "moodboard",
      },
    ],
    conciergeSummary: {
      documentsToday: 3,
      contractsAwaiting: 2,
      proposalsApproval: 1,
      guestsNoResponse: 12,
      href: "/app/concierge",
    },
  };
}

/**
 * Returns mock dashboard payload for a known event id.
 * TODO: Replace with Supabase / events repository when portal auth is wired.
 */
export function getMockDashboardData(eventId?: string): DashboardData | null {
  const resolvedId = eventId?.trim() || DEFAULT_DASHBOARD_EVENT_ID;
  return MOCK_EVENTS[resolvedId] ?? null;
}

export function listMockDashboardEventIds(): string[] {
  return Object.keys(MOCK_EVENTS);
}
