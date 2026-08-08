import type {
  BudgetModuleData,
  ChecklistModuleData,
  ConciergeModuleData,
  DocumentModuleData,
  EventModuleContext,
  GuestModuleData,
  RSVPModuleData,
  VendorModuleData,
} from "@/lib/event-modules/types";
import { DEFAULT_EVENT_ID, DEFAULT_EVENT_SLUG } from "@/lib/event-modules/module-config";

type ModuleStore = {
  guests: GuestModuleData;
  rsvp: RSVPModuleData;
  budget: BudgetModuleData;
  vendors: VendorModuleData;
  documents: DocumentModuleData;
  checklist: ChecklistModuleData;
  concierge: ConciergeModuleData;
};

const MOCK_STORE: Record<string, ModuleStore> = {
  [DEFAULT_EVENT_ID]: buildJessicaSamuelModules(),
};

function baseContext(eventId: string): EventModuleContext {
  return {
    eventId,
    currency: "MT",
    eventOverview: {
      name: "Jessica & Samuel",
      type: "Casamento",
      date: "24 Agosto 2026",
      location: "Maputo, Moçambique",
      status: "Em planeamento",
      slug: DEFAULT_EVENT_SLUG,
    },
  };
}

function buildJessicaSamuelModules(): ModuleStore {
  const eventId = DEFAULT_EVENT_ID;
  const context = baseContext(eventId);

  const guests: GuestModuleData = {
    context,
    summary: {
      total: 240,
      confirmed: 186,
      pending: 38,
      declined: 16,
      plusOnes: 42,
      tablesAssigned: 12,
      tablesTotal: 24,
    },
    groups: [
      { id: "g1", name: "Família Noiva", guestCount: 68 },
      { id: "g2", name: "Família Noivo", guestCount: 54 },
      { id: "g3", name: "Amigos", guestCount: 72 },
      { id: "g4", name: "Trabalho", guestCount: 46 },
    ],
    guests: [
      { id: "gst-1", name: "Sofia Antunes", group: "Família Noiva", phone: "+258 84 123 4567", rsvpStatus: "confirmado", plusOnes: 1, table: "Mesa 1", inviteSent: true, checkedIn: false },
      { id: "gst-2", name: "Alberto Matola", group: "Família Noivo", phone: "+258 82 987 6543", rsvpStatus: "confirmado", plusOnes: 0, table: "Mesa 2", inviteSent: true, checkedIn: false },
      { id: "gst-3", name: "Maria Cossa", group: "Amigos", phone: "+258 86 555 0101", rsvpStatus: "pendente", plusOnes: 0, table: undefined, inviteSent: true, checkedIn: false },
      { id: "gst-4", name: "João Nhantumbo", group: "Trabalho", phone: "+258 84 222 8899", rsvpStatus: "recusado", plusOnes: 0, table: undefined, inviteSent: true, checkedIn: false },
      { id: "gst-5", name: "Ana Vilanculos", group: "Amigos", phone: "+258 87 333 4455", rsvpStatus: "confirmado", plusOnes: 2, table: "Mesa 5", inviteSent: true, checkedIn: false },
      { id: "gst-6", name: "Carlos Mabote", group: "Família Noiva", phone: "+258 82 111 2233", rsvpStatus: "sem_resposta", plusOnes: 0, table: undefined, inviteSent: false, checkedIn: false },
      { id: "gst-7", name: "Helena Macuacua", group: "Trabalho", phone: "+258 84 777 8899", rsvpStatus: "confirmado", plusOnes: 1, table: "Mesa 8", inviteSent: true, checkedIn: false },
      { id: "gst-8", name: "Rui Tembe", group: "Família Noivo", phone: "+258 86 444 5566", rsvpStatus: "pendente", plusOnes: 0, table: undefined, inviteSent: true, checkedIn: false },
    ],
    importSummary: { importedCount: 48, lastImportLabel: "Há 2 dias", lastImportAt: "2026-07-04T10:00:00.000Z" },
  };

  const rsvp: RSVPModuleData = {
    context,
    stats: { activeInvites: 240, confirmed: 186, pending: 38, declined: 16, responseRate: 78 },
    settings: {
      allowPlusOne: true,
      askDietaryRestrictions: true,
      askPhoneNumber: true,
      closingDate: "15 Agosto 2026",
      closingDateIso: "2026-08-15",
      customConfirmationMessage: "Obrigado por confirmar a vossa presença no casamento de Jessica & Samuel.",
      publicUrl: `https://haxr.co.mz/event/${eventId}/rsvp`,
    },
    recentResponses: [
      { id: "rsvp-1", guestName: "Sofia Antunes", status: "confirmado", plusOnes: 1, respondedAt: "2026-07-05T14:00:00.000Z", respondedLabel: "Há 12 min", dietaryNotes: "Sem marisco" },
      { id: "rsvp-2", guestName: "Ana Vilanculos", status: "confirmado", plusOnes: 2, respondedAt: "2026-07-05T11:00:00.000Z", respondedLabel: "Há 3 h" },
      { id: "rsvp-3", guestName: "Maria Cossa", status: "pendente", plusOnes: 0, respondedAt: "", respondedLabel: "—" },
      { id: "rsvp-4", guestName: "João Nhantumbo", status: "recusado", plusOnes: 0, respondedAt: "2026-07-04T09:00:00.000Z", respondedLabel: "Ontem" },
    ],
  };

  const budget: BudgetModuleData = {
    context,
    summary: {
      estimated: 250_000,
      registered: 0,
      paid: 0,
      pending: 0,
      nextPayment: { vendorName: "—", dueDate: "—", amount: 0 },
    },
    categories: [
      { id: "cat-decor", name: "Decoração", allocated: 80_000, spent: 42_500, paid: 15_000 },
      { id: "cat-cater", name: "Catering", allocated: 95_000, spent: 0, paid: 0 },
      { id: "cat-photo", name: "Fotografia", allocated: 45_000, spent: 35_000, paid: 15_000 },
      { id: "cat-music", name: "Música", allocated: 30_000, spent: 7_500, paid: 0 },
    ],
    items: [],
    recentPayments: [],
  };

  const vendors: VendorModuleData = {
    context,
    summary: { active: 0, inReview: 0, signedContracts: 0, pendingPayments: 0 },
    vendors: [],
  };

  const documents: DocumentModuleData = {
    context,
    summary: { total: 2, proposals: 0, contracts: 0, receipts: 0, pendingValidation: 0 },
    documents: [
      { id: "doc-4", name: "Lista_Convidados_v3.xlsx", type: "lista_convidados", associatedWith: "Convidados", status: "validado", uploadedBy: "Concierge HAXR", uploadedAt: "2026-07-04T00:00:00.000Z", uploadedLabel: "Ontem", suggestedDestination: "Convidados" },
      { id: "doc-5", name: "Paleta_Champagne_Dourado.png", type: "inspiração", associatedWith: "Moodboard", status: "validado", uploadedBy: "Equipa HAXR", uploadedAt: "2026-07-02T00:00:00.000Z", uploadedLabel: "Há 3 dias", suggestedDestination: "Moodboard" },
    ],
  };

  const checklist: ChecklistModuleData = {
    context,
    summary: { total: 142, completed: 91, overdue: 4, priority: 5, progress: 64 },
    categories: [
      { id: "cc-1", name: "Cerimónia" },
      { id: "cc-2", name: "Recepção" },
      { id: "cc-3", name: "Fornecedores" },
      { id: "cc-4", name: "Convidados" },
    ],
    tasks: [
      { id: "tsk-1", title: "Aprovar convite digital", categoryId: "cc-4", category: "Convidados", assignee: "Jessica", priority: "alta", status: "em_curso", dueDate: "Hoje", moduleLink: `/app/events/${DEFAULT_EVENT_SLUG}/invitations`, moduleLabel: "Convites" },
      { id: "tsk-4", title: "Fechar plano de mesas", categoryId: "cc-4", category: "Convidados", assignee: "Equipa HAXR", priority: "média", status: "atrasada", dueDate: "Há 2 dias", moduleLink: `/app/events/${DEFAULT_EVENT_SLUG}/seating`, moduleLabel: "Seating" },
      { id: "tsk-5", title: "Degustação do menu", categoryId: "cc-2", category: "Recepção", assignee: "Jessica", priority: "baixa", status: "concluída", dueDate: "15 Jun 2026" },
    ],
  };

  const concierge: ConciergeModuleData = {
    context,
    summary: { inboxTotal: 2, pendingClassification: 0, awaitingValidation: 0, organizedToday: 2 },
    inbox: [
      {
        id: "cx-3",
        title: "Lista Excel — 48 convidados",
        type: "lista_convidados",
        status: "classificado",
        receivedAt: "2026-07-04T00:00:00.000Z",
        receivedLabel: "Ontem",
        fileHint: "XLSX · 89 KB",
        classification: {
          type: "lista_convidados",
          confidence: 0.88,
          suggestedDestination: "convidados",
          extractedFields: [
            { label: "Registos", value: "48 convidados" },
            { label: "Destino", value: "Gestão de Convidados", highlight: true },
          ],
        },
      },
      {
        id: "cx-4",
        title: "Paleta champagne & dourado",
        type: "inspiração",
        status: "enviado_para_módulo",
        receivedAt: "2026-07-04T00:00:00.000Z",
        receivedLabel: "Ontem",
        fileHint: "PNG · 3.4 MB",
      },
    ],
    suggestions: [],
    recentOrganized: [
      { id: "org-1", title: "Lista de convidados actualizada", destination: "convidados", label: "Há 12 min" },
      { id: "org-3", title: "Paleta visual", destination: "moodboard", label: "Ontem" },
    ],
    availableActions: [
      { id: "act-1", type: "classificar", label: "Classificar" },
      { id: "act-2", type: "enviar_módulo", label: "Enviar para módulo" },
      { id: "act-3", type: "criar_tarefa", label: "Criar tarefa" },
      { id: "act-4", type: "associar_fornecedor", label: "Associar ao fornecedor" },
      { id: "act-5", type: "associar_orçamento", label: "Associar ao orçamento" },
      { id: "act-6", type: "marcar_validado", label: "Marcar como validado" },
    ],
    dashboardHref: "/app/dashboard",
  };

  return { guests, rsvp, budget, vendors, documents, checklist, concierge };
}

export function getMockModuleStore(eventId?: string): ModuleStore | null {
  const id = eventId?.trim() || DEFAULT_EVENT_ID;
  return MOCK_STORE[id] ?? null;
}

export function getMockGuestModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.guests ?? null;
}

export function getMockRsvpModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.rsvp ?? null;
}

export function getMockBudgetModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.budget ?? null;
}

export function getMockVendorModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.vendors ?? null;
}

export function getMockDocumentModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.documents ?? null;
}

export function getMockChecklistModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.checklist ?? null;
}

export function getMockConciergeModuleData(eventId?: string) {
  return getMockModuleStore(eventId)?.concierge ?? null;
}
