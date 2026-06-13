import type {
  BusinessId,
  Currency,
  DocumentStatus,
  DocumentType,
  InvoiceDocument,
} from "@/lib/admin/types";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "mpesa"
  | "emola"
  | "card"
  | "other";

export interface PaymentRecord {
  id: string;
  businessId: BusinessId;
  clientId: string | null;
  clientName: string;
  eventId: string | null;
  eventName: string;
  documentId: string | null;
  documentNumber: string | null;
  sourceDocumentId: string | null;
  sourceDocumentNumber: string | null;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  paidAt: string;
  createdAt: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  amount: number;
  count: number;
  share: number;
}

export interface ClientBalance {
  clientId: string | null;
  clientName: string;
  invoiced: number;
  received: number;
  outstanding: number;
  paymentCount: number;
}

export interface RegisterPaymentInput {
  businessId: BusinessId;
  clientId?: string | null;
  clientName?: string;
  eventId?: string | null;
  sourceDocumentId?: string | null;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
  generateReceipt?: boolean;
}

export interface RegisterPaymentResult {
  payment: PaymentRecord;
  receipt: InvoiceDocument | null;
  sourceFullyPaid: boolean;
}

export interface FinanceOverview {
  totalReceived: number;
  totalReceiptsAmount: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  sentProformasCount: number;
  pendingProformasAmount: number;
  thisMonthReceived: number;
  thisMonthReceiptsCount: number;
  recentReceipts: InvoiceDocument[];
  pendingCollection: InvoiceDocument[];
}

export interface MonthPoint {
  month: number;
  label: string;
  received: number;
  count: number;
}

export interface BusinessRevenue {
  businessId: BusinessId;
  businessName: string;
  received: number;
  pending: number;
  share: number;
}

export interface DocumentTypeBreakdown {
  type: DocumentType;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
}

export interface StatusBreakdown {
  status: DocumentStatus;
  count: number;
  amount: number;
}

export interface TopClient {
  clientName: string;
  received: number;
  documentCount: number;
}

export interface CashAnalytics extends FinanceOverview {
  fiscalYear: number;
  yearReceived: number;
  yearVat: number;
  yearSubtotal: number;
  averageTicket: number;
  collectionRate: number;
  monthOverMonthChange: number | null;
  monthlyTrend: MonthPoint[];
  monthlyTrendByYear: Record<number, MonthPoint[]>;
  byBusiness: BusinessRevenue[];
  byDocumentType: DocumentTypeBreakdown[];
  byStatus: StatusBreakdown[];
  topClients: TopClient[];
  paidMovements: InvoiceDocument[];
  draftCount: number;
  draftAmount: number;
  cancelledCount: number;
  payments: PaymentRecord[];
  byPaymentMethod: PaymentMethodBreakdown[];
  clientBalances: ClientBalance[];
  paymentsEnabled: boolean;
  expenses: ExpenseRecord[];
  monthlyTargets: MonthlyTarget[];
  overdueAlerts: OverdueAlert[];
  eventRevenue: EventRevenueRow[];
  margin: MarginSummary;
  currentMonthTarget: MonthlyTarget | null;
  currentMonthProgress: number;
  financeExtrasEnabled: boolean;
}

export type ExpenseCategory =
  | "production"
  | "suppliers"
  | "marketing"
  | "logistics"
  | "payroll"
  | "other";

export interface ExpenseRecord {
  id: string;
  businessId: BusinessId;
  eventId: string | null;
  eventName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency;
  expenseDate: string;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseFormInput {
  businessId: BusinessId;
  eventId?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency;
  expenseDate: string;
  reference?: string;
  notes?: string;
}

export interface MonthlyTarget {
  id: string;
  businessId: BusinessId;
  year: number;
  month: number;
  targetAmount: number;
  currency: Currency;
  notes: string;
}

export interface MonthlyTargetInput {
  businessId: BusinessId;
  year: number;
  month: number;
  targetAmount: number;
  currency: Currency;
  notes?: string;
}

export interface OverdueAlert {
  documentId: string;
  documentNumber: string;
  documentType: DocumentType;
  clientName: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  daysOverdue: number;
  issueDate: string;
}

export interface EventRevenueRow {
  eventId: string | null;
  eventName: string;
  eventDate: string | null;
  received: number;
  pending: number;
  expenses: number;
  netMargin: number;
  paymentCount: number;
}

export interface MarginSummary {
  totalReceived: number;
  totalExpenses: number;
  netMargin: number;
  marginRate: number;
  monthReceived: number;
  monthExpenses: number;
  monthNetMargin: number;
}
