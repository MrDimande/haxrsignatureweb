import type {
  CategoryFinancialMetric,
  ExecutiveFinancialSummary,
  MasterBudgetItem,
  NormalizedEventFinancialLedger,
  PaymentInstallment,
} from "@/lib/finance/wedding-financial-engine";
import type { PaymentRecord } from "@/lib/event-modules/types";

export type {
  CategoryFinancialMetric,
  ExecutiveFinancialSummary,
  MasterBudgetItem,
  NormalizedEventFinancialLedger,
  PaymentInstallment,
  PaymentRecord,
};

export interface NegotiatedSavingItem {
  id: string;
  category: string;
  vendorOrItem: string;
  proposedAmount: number;
  contractedAmount: number;
  saving: number;
  savingPercentage: number;
}

export interface VendorExposureItem {
  id: string;
  name: string;
  category: string;
  contractedAmount: number;
  paidAmount: number;
  balance: number;
  percentPaid: number;
  status: string;
}

export interface ClassifiedInstallment {
  id: string;
  vendorOrItem: string;
  category: string;
  dueDate: string;
  dueDateIso: string | null;
  amount: number;
  status: "liquidado" | "a_vencer" | "vencido" | "a_programar";
  isDated: boolean;
}

export interface FinancialReportMetadata {
  documentTitle: string;
  edition: string;
  clientNames: string;
  eventTitle: string;
  eventDateFormatted: string;
  eventLocation: string;
  guestCount: number;
  currency: string;
  currencySymbol: string;
  generatedAtFormatted: string;
  eventReference: string;
}

export interface WeddingFinancialReportOptions {
  generatedAt?: Date | string;
}
