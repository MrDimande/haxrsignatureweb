import type { DashboardEventOverview } from "@/lib/dashboard/types";

export type EventModuleId =
  | "guests"
  | "rsvp"
  | "budget"
  | "vendors"
  | "documents"
  | "checklist"
  | "concierge";

export type ModuleErrorCode =
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "operational_not_linked"
  | "unavailable";

export type ModuleDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ModuleErrorCode; message?: string };

export interface EventModuleContext {
  eventId: string;
  eventOverview: Pick<
    DashboardEventOverview,
    "name" | "type" | "date" | "location" | "status" | "slug"
  >;
  currency: string;
}

// ——— Guests ———
export type PortalGuestStatus = "confirmado" | "pendente" | "recusado" | "lista_espera";
export type PortalRsvpStatus = "confirmado" | "pendente" | "recusado" | "sem_resposta";

export interface Guest {
  id: string;
  name: string;
  group: string;
  phone: string;
  email?: string;
  rsvpStatus: PortalRsvpStatus;
  plusOnes: number;
  table?: string;
  inviteSent: boolean;
  checkedIn: boolean;
}

export interface GuestGroup {
  id: string;
  name: string;
  guestCount: number;
}

export interface GuestImportSummary {
  lastImportAt?: string;
  lastImportLabel?: string;
  importedCount: number;
}

export interface GuestModuleData {
  context: EventModuleContext;
  summary: {
    total: number;
    confirmed: number;
    pending: number;
    declined: number;
    plusOnes: number;
    tablesAssigned: number;
    tablesTotal: number;
  };
  groups: GuestGroup[];
  guests: Guest[];
  importSummary: GuestImportSummary;
}

// ——— RSVP ———
export interface RSVPResponse {
  id: string;
  guestName: string;
  status: PortalRsvpStatus;
  plusOnes: number;
  respondedAt: string;
  respondedLabel: string;
  dietaryNotes?: string;
}

export interface RSVPSettings {
  allowPlusOne: boolean;
  askDietaryRestrictions: boolean;
  askPhoneNumber: boolean;
  closingDate: string;
  closingDateIso?: string;
  customConfirmationMessage: string;
  publicUrl: string;
}

export interface RSVPStats {
  activeInvites: number;
  confirmed: number;
  pending: number;
  declined: number;
  responseRate: number;
}

export interface RSVPModuleData {
  context: EventModuleContext;
  stats: RSVPStats;
  settings: RSVPSettings;
  recentResponses: RSVPResponse[];
}

// ——— Budget ———
export type PaymentStatus = "pago" | "parcial" | "pendente" | "atrasado" | "planeado";

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  paid: number;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  category: string;
  vendorOrItem: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  dueDate: string;
  dueDateIso?: string;
}

export interface PaymentRecord {
  id: string;
  vendorOrItem: string;
  amount: number;
  paidAt: string;
  paidAtLabel: string;
  method: string;
}

export interface BudgetModuleData {
  context: EventModuleContext;
  summary: {
    estimated: number;
    registered: number;
    paid: number;
    pending: number;
    nextPayment: {
      vendorName: string;
      dueDate: string;
      amount: number;
    };
  };
  categories: BudgetCategory[];
  items: BudgetItem[];
  recentPayments: PaymentRecord[];
}

// ——— Vendors ———
export type VendorCategory =
  | "decoração"
  | "catering"
  | "fotografia"
  | "música"
  | "local"
  | "outro";

export type VendorStatus =
  | "sugerido"
  | "em_análise"
  | "aprovado"
  | "contratado"
  | "rejeitado"
  | "concluído";

export interface VendorProposal {
  id: string;
  amount: number;
  receivedAt: string;
  status: "pendente" | "aprovada" | "rejeitada";
}

export interface VendorContract {
  id: string;
  signed: boolean;
  signedAt?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contact: string;
  location: string;
  status: VendorStatus;
  contractedAmount: number;
  proposal?: VendorProposal;
  contract?: VendorContract;
  nextAction: string;
}

export interface VendorModuleData {
  context: EventModuleContext;
  summary: {
    active: number;
    inReview: number;
    signedContracts: number;
    pendingPayments: number;
  };
  vendors: Vendor[];
}

// ——— Documents ———
export type DocumentType =
  | "proposta"
  | "contrato"
  | "recibo"
  | "comprovativo"
  | "lista_convidados"
  | "inspiração"
  | "programa"
  | "outro";

export type DocumentStatus =
  | "por_validar"
  | "validado"
  | "arquivado"
  | "rejeitado";

export interface EventDocument {
  id: string;
  name: string;
  type: DocumentType;
  associatedWith: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  uploadedLabel: string;
  suggestedDestination: string;
}

export interface DocumentModuleData {
  context: EventModuleContext;
  summary: {
    total: number;
    proposals: number;
    contracts: number;
    receipts: number;
    pendingValidation: number;
  };
  documents: EventDocument[];
}

// ——— Checklist ———
export type ChecklistPriority = "alta" | "média" | "baixa";
export type ChecklistStatus = "aberta" | "em_curso" | "concluída" | "atrasada";

export interface ChecklistCategory {
  id: string;
  name: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  categoryId: string;
  category: string;
  assignee: string;
  priority: ChecklistPriority;
  status: ChecklistStatus;
  dueDate: string;
  dueDateIso?: string;
  moduleLink?: string;
  moduleLabel?: string;
}

export interface ChecklistModuleData {
  context: EventModuleContext;
  summary: {
    total: number;
    completed: number;
    overdue: number;
    priority: number;
    progress: number;
  };
  categories: ChecklistCategory[];
  tasks: ChecklistTask[];
}

// ——— Concierge ———
export type ConciergeItemType =
  | "proposta"
  | "contrato"
  | "recibo"
  | "comprovativo"
  | "lista_convidados"
  | "inspiração"
  | "programa"
  | "outro";

export type ConciergeClassificationStatus =
  | "por_classificar"
  | "classificado"
  | "aguardando_validação"
  | "enviado_para_módulo"
  | "rejeitado";

export type ConciergeDestination =
  | "fornecedores"
  | "orçamento"
  | "convidados"
  | "documentos"
  | "moodboard"
  | "checklist";

export interface ConciergeClassification {
  type: ConciergeItemType;
  confidence: number;
  suggestedDestination: ConciergeDestination;
  extractedFields: { label: string; value: string; highlight?: boolean }[];
}

export interface ConciergeSuggestion {
  id: string;
  label: string;
  description: string;
}

export type ConciergeActionType =
  | "classificar"
  | "enviar_módulo"
  | "criar_tarefa"
  | "associar_fornecedor"
  | "associar_orçamento"
  | "marcar_validado";

export interface ConciergeAction {
  id: string;
  type: ConciergeActionType;
  label: string;
}

export interface ConciergeInboxItem {
  id: string;
  title: string;
  type: ConciergeItemType;
  status: ConciergeClassificationStatus;
  receivedAt: string;
  receivedLabel: string;
  fileHint: string;
  classification?: ConciergeClassification;
}

export interface ConciergeModuleData {
  context: EventModuleContext;
  summary: {
    inboxTotal: number;
    pendingClassification: number;
    awaitingValidation: number;
    organizedToday: number;
  };
  inbox: ConciergeInboxItem[];
  suggestions: ConciergeSuggestion[];
  recentOrganized: { id: string; title: string; destination: ConciergeDestination; label: string }[];
  availableActions: ConciergeAction[];
  dashboardHref: string;
}
