import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { DocumentStatus, DocumentType } from "@/lib/admin/types";
import type { PaymentMethod } from "@/lib/finance/types";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Numerário",
  bank_transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  card: "Cartão",
  other: "Outro",
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "#8B7355",
  bank_transfer: "#C9A227",
  mpesa: "#4A9B7F",
  emola: "#6B8CAE",
  card: "#9B7BB8",
  other: "#4A5568",
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  "bank_transfer",
  "mpesa",
  "emola",
  "cash",
  "card",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<
  import("@/lib/finance/types").ExpenseCategory,
  string
> = {
  production: "Produção",
  suppliers: "Fornecedores",
  marketing: "Marketing",
  logistics: "Logística",
  payroll: "Equipa",
  other: "Outro",
};

export const EXPENSE_CATEGORIES = [
  "production",
  "suppliers",
  "marketing",
  "logistics",
  "payroll",
  "other",
] as const;


export const FINANCE_STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: "text-grey/60",
  sent: "text-amber-300/80",
  paid: "text-emerald-300/90",
  cancelled: "text-red-300/70",
};

export const FINANCE_TYPE_COLORS: Record<DocumentType, string> = {
  proforma: "#6B8CAE",
  invoice: "#C9A227",
  receipt: "#4A9B7F",
};

export const BUSINESS_CHART_COLORS = ["#C9A227", "#8B7355", "#4A5568", "#6B4E71"];

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function documentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_LABELS[status];
}

export function documentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type];
}
