export type ConciergeIntakeSource =
  | "upload"
  | "manual_note"
  | "forwarded_email_future"
  | "web_clip"
  | "whatsapp_future"
  | "system";

export type ConciergeItemType =
  | "proposta"
  | "contrato"
  | "recibo"
  | "comprovativo_pagamento"
  | "lista_convidados"
  | "inspiracao"
  | "programa_evento"
  | "nota_operacional"
  | "link_fornecedor"
  | "produto_ou_presente"
  | "outro";

export type ConciergeItemStatus =
  | "novo"
  | "por_classificar"
  | "classificado"
  | "aguardando_validacao"
  | "validado"
  | "enviado_para_modulo"
  | "rejeitado"
  | "arquivado";

export type ConciergePriority = "baixa" | "media" | "alta" | "urgente";

export type ConciergeDestination =
  | "fornecedores"
  | "financeiro"
  | "convidados"
  | "documentos"
  | "moodboard"
  | "checklist"
  | "contratos"
  | "rsvp"
  | "presentes"
  | "dashboard";

export type ConciergeSuggestionStatus = "pendente" | "aceite" | "rejeitada" | "aplicada";

export type ConciergeActionType =
  | "add_vendor"
  | "create_budget_item"
  | "import_guests"
  | "save_document"
  | "send_moodboard"
  | "create_checklist_task"
  | "link_contract"
  | "create_gift_item"
  | "custom";

export interface ConciergeInboxItem {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: ConciergeItemType;
  status: ConciergeItemStatus;
  priority: ConciergePriority;
  source: ConciergeIntakeSource;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  originalEmailFrom?: string;
  originalEmailSubject?: string;
  originalEmailReceivedAt?: string;
  clippedUrl?: string;
  clippedTitle?: string;
  clippedDescription?: string;
  extractedText?: string;
  extractedData?: Record<string, unknown>;
  suggestedDestination?: ConciergeDestination;
  confidence?: number;
  linkedModule?: ConciergeDestination;
  linkedRecordId?: string;
  notes?: string;
  classificationReason?: string;
  storagePath?: string;
}

export interface ConciergeIntakeInput {
  eventId: string;
  source: ConciergeIntakeSource;
  title: string;
  description?: string;
  file?: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    fileUrl?: string;
  };
  url?: string;
  clippedTitle?: string;
  email?: {
    from: string;
    subject: string;
    receivedAt: string;
  };
  manualText?: string;
  notes?: string;
  priority?: ConciergePriority;
  suggestedDestination?: ConciergeDestination;
}

export interface ConciergeSummaryResult {
  summary: string;
  importantPoints: string[];
  risksOrWarnings: string[];
  nextSteps: string[];
}

export interface ConciergeExtractedFields {
  vendorName: string | null;
  service: string | null;
  amount: number | null;
  currency: "MT" | null;
  paymentStatus: string | null;
  dueDate: string | null;
  eventDate: string | null;
  contact: string | null;
}

export type ConciergeAIProviderKind = "gemini" | "rule_based";

export interface ConciergeClassification {
  itemId: string;
  detectedType: ConciergeItemType;
  suggestedDestination: ConciergeDestination;
  confidence: number;
  extractedFields: Record<string, unknown>;
  reason: string;
  createdAt: string;
  provider?: ConciergeAIProviderKind;
  summary?: ConciergeSummaryResult;
  suggestedActions?: Array<{
    actionType: ConciergeActionType;
    title: string;
    description: string;
    destination: ConciergeDestination;
  }>;
}

export interface ConciergeSuggestion {
  id: string;
  itemId: string;
  title: string;
  description: string;
  actionType: ConciergeActionType;
  destination: ConciergeDestination;
  payload: Record<string, unknown>;
  confidence: number;
  status: ConciergeSuggestionStatus;
}

export interface ConciergeActivity {
  id: string;
  itemId?: string;
  title: string;
  description: string;
  type: "intake" | "classification" | "validation" | "routing" | "rejection" | "archive" | "system";
  createdAt: string;
  actorName: string;
  actorId?: string;
  actorRole?: string;
}

export interface ConciergeStats {
  totalItems: number;
  pendingClassification: number;
  awaitingValidation: number;
  sentToModules: number;
  rejected: number;
  urgentItems: number;
  emailReadyItems: number;
  webClips: number;
}

export interface ConciergeEventOverview {
  eventId: string;
  coupleNames: string;
  eventDate: string;
  eventDateLabel: string;
  location: string;
}

export interface ConciergeWorkspaceMeta {
  persistenceMode: "memory" | "supabase" | "neon";
  storageMode: "metadata_only" | "supabase";
  persistenceLabel: string;
  storageLabel: string;
  actorRole: string;
  permissions: {
    canClassify: boolean;
    canValidate: boolean;
    canRoute: boolean;
    canReject: boolean;
    canArchive: boolean;
    canApplySuggestions: boolean;
    showConfidence: boolean;
    showActivity: boolean;
  };
}

export interface ConciergeModuleData {
  eventOverview: ConciergeEventOverview;
  stats: ConciergeStats;
  inboxItems: ConciergeInboxItem[];
  classifications: ConciergeClassification[];
  suggestions: ConciergeSuggestion[];
  activities: ConciergeActivity[];
  allowedActions: ConciergeActionType[];
  inboundEmailAddress: string;
  dashboardHref: string;
  workspaceMeta: ConciergeWorkspaceMeta;
}

export interface ConciergeRoutingResult {
  ok: boolean;
  destination: ConciergeDestination;
  message: string;
  linkedRecordId?: string;
}

export type ConciergeServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string };
