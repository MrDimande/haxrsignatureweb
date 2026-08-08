import type {
  ConciergeActivity,
  ConciergeClassification,
  ConciergeInboxItem,
  ConciergeModuleData,
  ConciergeSuggestion,
} from "./types";

const EVENT_ID = "jessica-samuel";

export const CONCIERGE_INBOUND_EMAIL = "concierge@haxrsignature.com";

export const DEFAULT_CONCIERGE_ALLOWED_ACTIONS = [
  "add_vendor",
  "create_budget_item",
  "import_guests",
  "save_document",
  "send_moodboard",
  "create_checklist_task",
  "link_contract",
  "create_gift_item",
] as const;

const now = "2026-07-06T14:00:00.000Z";

export const MOCK_CONCIERGE_INBOX: ConciergeInboxItem[] = [
  {
    id: "ci-003",
    eventId: EVENT_ID,
    title: "Lista de Convidados — Família Samuel",
    description: "Planilha preliminar com 84 convidados.",
    type: "lista_convidados",
    status: "por_classificar",
    priority: "alta",
    source: "upload",
    uploadedBy: "Jessica",
    createdAt: "2026-07-03T11:20:00.000Z",
    updatedAt: "2026-07-03T11:20:00.000Z",
    fileName: "lista-convidados-familia.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: 52_000,
  },
  {
    id: "ci-004",
    eventId: EVENT_ID,
    title: "Inspiração — Mesa de Noivos",
    description: "Referência visual para decoração da mesa principal.",
    type: "inspiracao",
    status: "enviado_para_modulo",
    priority: "baixa",
    source: "web_clip",
    uploadedBy: "Jessica",
    createdAt: "2026-07-02T08:00:00.000Z",
    updatedAt: "2026-07-02T09:15:00.000Z",
    clippedUrl: "https://pinterest.com/pin/mesa-noivos-exemplo",
    clippedTitle: "Mesa de noivos — tons dourados",
    clippedDescription: "Referência Pinterest para arranjo floral.",
    suggestedDestination: "moodboard",
    confidence: 0.9,
    linkedModule: "moodboard",
    linkedRecordId: "mb-001",
    classificationReason: "Palavras-chave: inspiração, Pinterest.",
  },
  {
    id: "ci-006",
    eventId: EVENT_ID,
    title: "Nota interna — Confirmar horário da cerimónia",
    description: "Ligar à igreja para confirmar entrada às 15h.",
    type: "nota_operacional",
    status: "novo",
    priority: "media",
    source: "manual_note",
    uploadedBy: "Jessica",
    createdAt: now,
    updatedAt: now,
    extractedText: "Confirmar com a igreja o horário de entrada do cortejo às 15h.",
    suggestedDestination: "checklist",
    confidence: 0.5,
  },
];

export const MOCK_CONCIERGE_CLASSIFICATIONS: ConciergeClassification[] = [];

export const MOCK_CONCIERGE_SUGGESTIONS: ConciergeSuggestion[] = [
  {
    id: "cs-003",
    itemId: "ci-003",
    title: "Importar para convidados",
    description: "Importar lista Excel para o módulo de convidados.",
    actionType: "import_guests",
    destination: "convidados",
    payload: { fileName: "lista-convidados-familia.xlsx" },
    confidence: 0.7,
    status: "pendente",
  },
];

export const MOCK_CONCIERGE_ACTIVITIES: ConciergeActivity[] = [
  {
    id: "ca-003",
    itemId: "ci-004",
    title: "Referência visual guardada",
    description: "Referência visual enviada para moodboard.",
    type: "routing",
    createdAt: "2026-07-02T09:15:00.000Z",
    actorName: "Jessica",
  },
  {
    id: "ca-004",
    itemId: "ci-003",
    title: "Lista de convidados aguardando validação",
    description: "Ficheiro Excel recebido — classificação pendente.",
    type: "intake",
    createdAt: "2026-07-03T11:20:00.000Z",
    actorName: "Jessica",
  },
];

export function buildConciergeStats(items: ConciergeInboxItem[]) {
  return {
    totalItems: items.length,
    pendingClassification: items.filter(
      (i) => i.status === "novo" || i.status === "por_classificar"
    ).length,
    awaitingValidation: items.filter(
      (i) => i.status === "aguardando_validacao" || i.status === "classificado"
    ).length,
    sentToModules: items.filter((i) => i.status === "enviado_para_modulo").length,
    rejected: items.filter((i) => i.status === "rejeitado").length,
    urgentItems: items.filter((i) => i.priority === "urgente").length,
    emailReadyItems: items.filter((i) => i.source === "forwarded_email_future").length,
    webClips: items.filter((i) => i.source === "web_clip").length,
  };
}

export function createInitialConciergeModuleData(eventId: string): ConciergeModuleData {
  const items = MOCK_CONCIERGE_INBOX.filter((i) => i.eventId === eventId);
  return {
    eventOverview: {
      eventId,
      coupleNames: "Jessica & Samuel",
      eventDate: "2026-08-24",
      eventDateLabel: "24 Agosto 2026",
      location: "Maputo",
    },
    stats: buildConciergeStats(items),
    inboxItems: items,
    classifications: MOCK_CONCIERGE_CLASSIFICATIONS.filter((c) =>
      items.some((i) => i.id === c.itemId)
    ),
    suggestions: MOCK_CONCIERGE_SUGGESTIONS.filter((s) =>
      items.some((i) => i.id === s.itemId)
    ),
    activities: MOCK_CONCIERGE_ACTIVITIES,
    allowedActions: [...DEFAULT_CONCIERGE_ALLOWED_ACTIONS],
    inboundEmailAddress: CONCIERGE_INBOUND_EMAIL,
    dashboardHref: "/app/dashboard",
    workspaceMeta: {
      persistenceMode: "memory",
      storageMode: "metadata_only",
      persistenceLabel: "Modo local",
      storageLabel: "Armazenamento permanente em preparação",
      actorRole: "team",
      permissions: {
        canClassify: true,
        canValidate: true,
        canRoute: true,
        canReject: true,
        canArchive: true,
        canApplySuggestions: true,
        showConfidence: true,
        showActivity: true,
      },
    },
  };
}
