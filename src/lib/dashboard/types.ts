/** Anticipated roles for future permission-based dashboard visibility. */
export type DashboardRole = "admin" | "client" | "vendor" | "team";

export interface DashboardEventOverview {
  eventId: string;
  slug: string;
  name: string;
  type: string;
  /** Display-ready date label */
  date: string;
  /** ISO date for future API integration */
  dateIso?: string;
  location: string;
  status: string;
  responsible: string;
  progress: number;
}

export type DashboardStatValueType = "number" | "currency" | "text";

export interface DashboardStatCard {
  id: string;
  label: string;
  value: number | string;
  valueType?: DashboardStatValueType;
  detail: string;
  trend?: string;
  status?: string;
}

export interface DashboardProgressItem {
  id: string;
  name: string;
  value: number;
}

export type DashboardActionPriority = "Alta" | "Média" | "Baixa";
export type DashboardActionStatus = "open" | "in_progress" | "done";

export interface DashboardNextAction {
  id: string;
  title: string;
  dueDate: string;
  priority: DashboardActionPriority;
  status?: DashboardActionStatus;
  href?: string;
}

export type DashboardModuleStatus = "active" | "setup" | "inactive";

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  metric: string;
  href: string;
  status: DashboardModuleStatus;
  category?: string;
}

export interface DashboardFinanceSnapshot {
  currency: string;
  budgetEstimated: number;
  budgetRegistered: number;
  paidAmount: number;
  pendingAmount: number;
  nextPayment: {
    vendorName: string;
    dueDate: string;
    dueDateIso?: string;
    amount: number;
  };
}

export interface DashboardGuestSnapshot {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  plusOnes: number;
  tablesAssigned: number;
  tablesTotal: number;
}

export type VendorContractStatus = "Em revisão" | "Pendente" | "Assinado" | "Aguardando";

export interface DashboardVendorSnapshot {
  id: string;
  name: string;
  service: string;
  status: VendorContractStatus;
}

export type DashboardActivityType =
  | "guests"
  | "finance"
  | "vendor"
  | "rsvp"
  | "moodboard"
  | "document"
  | "other";

export interface DashboardRecentActivity {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  relativeLabel: string;
  type: DashboardActivityType;
}

export interface DashboardConciergeSummary {
  documentsToday: number;
  contractsAwaiting: number;
  proposalsApproval: number;
  guestsNoResponse: number;
  href: string;
}

export interface DashboardChecklistTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
}

export interface DashboardMeta {
  lastSyncedAt: string;
  lastSyncedLabel: string;
  /** TODO: Resolve from authenticated session */
  role?: DashboardRole;
}

export interface DashboardData {
  eventOverview: DashboardEventOverview;
  meta: DashboardMeta;
  stats: DashboardStatCard[];
  progress: DashboardProgressItem[];
  nextActions: DashboardNextAction[];
  checklistTemplates: DashboardChecklistTemplate[];
  modules: DashboardModule[];
  financeSnapshot: DashboardFinanceSnapshot;
  guestSnapshot: DashboardGuestSnapshot;
  vendorSnapshot: DashboardVendorSnapshot[];
  recentActivity: DashboardRecentActivity[];
  conciergeSummary: DashboardConciergeSummary;
}

export type DashboardErrorCode = "not_found" | "unauthorized" | "forbidden" | "unavailable";

export type DashboardDataResult =
  | { ok: true; data: DashboardData }
  | { ok: false; error: DashboardErrorCode; message?: string };
