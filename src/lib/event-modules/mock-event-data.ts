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
      registered: 85_000,
      paid: 30_000,
      pending: 55_000,
      nextPayment: { vendorName: "Decoração (Elegance Decor)", dueDate: "20 Agosto 2026", amount: 42_500 },
    },
    categories: [
      { id: "cat-decor", name: "Decoração", allocated: 80_000, spent: 42_500, paid: 15_000 },
      { id: "cat-cater", name: "Catering", allocated: 95_000, spent: 0, paid: 0 },
      { id: "cat-photo", name: "Fotografia", allocated: 45_000, spent: 35_000, paid: 15_000 },
      { id: "cat-music", name: "Música", allocated: 30_000, spent: 7_500, paid: 0 },
    ],
    items: [
      { id: "bi-1", categoryId: "cat-decor", category: "Decoração", vendorOrItem: "Elegance Decor", plannedAmount: 80_000, actualAmount: 42_500, paidAmount: 15_000, balance: 27_500, status: "parcial", dueDate: "20 Agosto 2026", dueDateIso: "2026-08-20" },
      { id: "bi-2", categoryId: "cat-cater", category: "Catering", vendorOrItem: "Royal Catering", plannedAmount: 95_000, actualAmount: 0, paidAmount: 0, balance: 0, status: "planeado", dueDate: "1 Setembro 2026" },
      { id: "bi-3", categoryId: "cat-photo", category: "Fotografia", vendorOrItem: "Lens Studio", plannedAmount: 45_000, actualAmount: 35_000, paidAmount: 15_000, balance: 20_000, status: "parcial", dueDate: "10 Agosto 2026" },
      { id: "bi-4", categoryId: "cat-music", category: "Música", vendorOrItem: "DJ Mavie", plannedAmount: 30_000, actualAmount: 7_500, paidAmount: 0, balance: 7_500, status: "pendente", dueDate: "5 Agosto 2026" },
    ],
    recentPayments: [
      { id: "pay-1", vendorOrItem: "Lens Studio", amount: 15_000, paidAt: "2026-07-01T00:00:00.000Z", paidAtLabel: "1 Jul 2026", method: "Transferência" },
      { id: "pay-2", vendorOrItem: "Elegance Decor", amount: 15_000, paidAt: "2026-06-15T00:00:00.000Z", paidAtLabel: "15 Jun 2026", method: "M-Pesa" },
    ],
  };

  const vendors: VendorModuleData = {
    context,
    summary: { active: 8, inReview: 3, signedContracts: 2, pendingPayments: 2 },
    vendors: [
      { id: "vnd-1", name: "Elegance Decor", category: "decoração", contact: "decor@elegance.mz", location: "Maputo", status: "em_análise", contractedAmount: 42_500, proposal: { id: "p1", amount: 42_500, receivedAt: "2026-06-20", status: "pendente" }, nextAction: "Validar proposta" },
      { id: "vnd-2", name: "Royal Catering", category: "catering", contact: "+258 84 000 1111", location: "Maputo", status: "aprovado", contractedAmount: 0, nextAction: "Fechar menu degustação" },
      { id: "vnd-3", name: "Lens Studio", category: "fotografia", contact: "hello@lensstudio.mz", location: "Maputo", status: "contratado", contractedAmount: 35_000, contract: { id: "c1", signed: true, signedAt: "2026-05-10" }, nextAction: "Briefing editorial" },
      { id: "vnd-4", name: "DJ Mavie", category: "música", contact: "booking@djmavie.mz", location: "Maputo", status: "sugerido", contractedAmount: 7_500, nextAction: "Aguardar confirmação" },
    ],
  };

  const documents: DocumentModuleData = {
    context,
    summary: { total: 23, proposals: 6, contracts: 4, receipts: 8, pendingValidation: 3 },
    documents: [
      { id: "doc-1", name: "Proposta_Decoracao_Elegance.pdf", type: "proposta", associatedWith: "Elegance Decor", status: "por_validar", uploadedBy: "Concierge HAXR", uploadedAt: "2026-07-05T10:00:00.000Z", uploadedLabel: "Há 3 h", suggestedDestination: "Fornecedores" },
      { id: "doc-2", name: "Contrato_Lens_Studio.pdf", type: "contrato", associatedWith: "Lens Studio", status: "validado", uploadedBy: "Equipa HAXR", uploadedAt: "2026-05-10T00:00:00.000Z", uploadedLabel: "10 Mai 2026", suggestedDestination: "Documentos" },
      { id: "doc-3", name: "Comprovativo_M-Pesa_Decor.pdf", type: "comprovativo", associatedWith: "Elegance Decor", status: "por_validar", uploadedBy: "Jessica", uploadedAt: "2026-07-05T08:00:00.000Z", uploadedLabel: "Há 5 h", suggestedDestination: "Orçamento" },
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
      { id: "tsk-2", title: "Confirmar proposta da decoração", categoryId: "cc-3", category: "Fornecedores", assignee: "Equipa HAXR", priority: "alta", status: "aberta", dueDate: "Amanhã", moduleLink: `/app/events/${DEFAULT_EVENT_SLUG}/vendors`, moduleLabel: "Fornecedores" },
      { id: "tsk-3", title: "Validar pagamento do catering", categoryId: "cc-3", category: "Fornecedores", assignee: "Samuel", priority: "média", status: "aberta", dueDate: "Em 3 dias", moduleLink: `/app/events/${DEFAULT_EVENT_SLUG}/budget`, moduleLabel: "Orçamento" },
      { id: "tsk-4", title: "Fechar plano de mesas", categoryId: "cc-4", category: "Convidados", assignee: "Equipa HAXR", priority: "média", status: "atrasada", dueDate: "Há 2 dias", moduleLink: `/app/events/${DEFAULT_EVENT_SLUG}/seating`, moduleLabel: "Seating" },
      { id: "tsk-5", title: "Degustação do menu", categoryId: "cc-2", category: "Recepção", assignee: "Jessica", priority: "baixa", status: "concluída", dueDate: "15 Jun 2026" },
    ],
  };

  const concierge: ConciergeModuleData = {
    context,
    summary: { inboxTotal: 6, pendingClassification: 2, awaitingValidation: 2, organizedToday: 3 },
    inbox: [
      {
        id: "cx-1",
        title: "Proposta de Decoração — Elegance Decor",
        type: "proposta",
        status: "aguardando_validação",
        receivedAt: "2026-07-05T12:00:00.000Z",
        receivedLabel: "Há 12 min",
        fileHint: "PDF · 245 KB",
        classification: {
          type: "proposta",
          confidence: 0.92,
          suggestedDestination: "fornecedores",
          extractedFields: [
            { label: "Fornecedor", value: "Elegance Decor", highlight: true },
            { label: "Valor", value: "42.500 MT", highlight: true },
            { label: "Serviço", value: "Decoração floral e cenografia" },
          ],
        },
      },
      {
        id: "cx-2",
        title: "Sinal M-Pesa — 42.500 MT",
        type: "comprovativo",
        status: "por_classificar",
        receivedAt: "2026-07-05T11:00:00.000Z",
        receivedLabel: "Há 1 h",
        fileHint: "Imagem · 1.2 MB",
      },
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
    suggestions: [
      { id: "sug-1", label: "Associar ao fornecedor Elegance Decor", description: "Proposta detectada com valor e categoria compatíveis." },
      { id: "sug-2", label: "Criar tarefa de validação", description: "Contrato aguarda revisão da equipa HAXR." },
    ],
    recentOrganized: [
      { id: "org-1", title: "Lista de convidados actualizada", destination: "convidados", label: "Há 12 min" },
      { id: "org-2", title: "Comprovativo decoração", destination: "orçamento", label: "Há 1 h" },
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
