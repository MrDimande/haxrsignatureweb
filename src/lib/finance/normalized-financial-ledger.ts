import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  BudgetModuleData,
  EventModuleContext,
  PaymentRecord,
  PaymentStatus,
  Vendor,
} from "@/lib/event-modules/types";
import {
  calculateCategoryBreakdown,
  calculateExecutiveFinancialSummary,
  type CategoryFinancialMetric,
  type ExecutiveFinancialSummary,
  type MasterBudgetItem,
  type PaymentInstallment,
} from "./wedding-financial-engine";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type { PaymentMethod } from "@/lib/finance/types";
import type { ClientEventPaymentsRpcPaymentRow, ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";

export interface NormalizedEventFinancialLedger {
  context: EventModuleContext;
  summary: ExecutiveFinancialSummary;
  categories: CategoryFinancialMetric[];
  items: MasterBudgetItem[];
  installments: PaymentInstallment[];
  recentPayments: PaymentRecord[];
  clientNames: string;
  eventTitle: string;
  eventDateFormatted: string;
  eventDateIso: string | null;
  guestCount: number;
  currency: string;
  currencySymbol: string;
}

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPaidAtLabel(paidAt: string): string {
  const parsed = new Date(paidAt);
  if (Number.isNaN(parsed.getTime())) return paidAt;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolvePaymentMethodLabel(method: string): string {
  if (method in PAYMENT_METHOD_LABELS) {
    return PAYMENT_METHOD_LABELS[method as PaymentMethod];
  }
  return method;
}

function resolvePaymentLabel(row: ClientEventPaymentsRpcPaymentRow): string {
  if (row.notes?.trim()) return row.notes.trim();
  if (row.document?.client_name?.trim()) return row.document.client_name.trim();
  if (row.document?.number?.trim()) return `Documento ${row.document.number.trim()}`;
  if (row.reference?.trim()) return row.reference.trim();
  return "Pagamento registado";
}

function mapPaymentRowToRecord(row: ClientEventPaymentsRpcPaymentRow): PaymentRecord {
  return {
    id: row.id,
    vendorOrItem: resolvePaymentLabel(row),
    amount: row.amount,
    paidAt: row.paid_at,
    paidAtLabel: formatPaidAtLabel(row.paid_at),
    method: resolvePaymentMethodLabel(row.payment_method),
  };
}

export function buildNormalizedFinancialLedger(input: {
  event: ClientEventRow;
  paymentsPayload?: ClientEventPaymentsRpcPayload | null;
  vendors?: Vendor[];
  todayIso?: string;
}): NormalizedEventFinancialLedger {
  const { event, paymentsPayload, vendors = [], todayIso } = input;

  const rawEstimated = event.budget_max ?? event.budget_min ?? (paymentsPayload?.summary.budgetMax ?? paymentsPayload?.summary.budgetMin ?? 0);
  const estimatedBudget = rawEstimated > 0 ? rawEstimated : 0;
  // Formal approved budget is only present if explicitly defined or documented
  const approvedBudget: number | null = null;
  const guestCount = event.estimated_guests > 0 ? event.estimated_guests : 150;

  const items: MasterBudgetItem[] = [];
  const installments: PaymentInstallment[] = [];
  const recordedPayments: PaymentRecord[] = (paymentsPayload?.payments || []).map(mapPaymentRowToRecord);

  // 1. Process Vendors if linked
  if (vendors.length > 0) {
    vendors.forEach((vendor, index) => {
      const contractedAmount = vendor.contractedAmount || 0;
      const proposedAmount = vendor.proposal?.amount || 0;
      const initialPlanned = contractedAmount > 0 ? contractedAmount : (proposedAmount > 0 ? proposedAmount : 0);

      // Find matching payments
      const matchingPayments = recordedPayments.filter(
        (p) => p.vendorOrItem.toLowerCase().includes(vendor.name.toLowerCase()) || vendor.name.toLowerCase().includes(p.vendorOrItem.toLowerCase())
      );
      const paidAmount = matchingPayments.reduce((sum, p) => sum + p.amount, 0);
      const actualAmount = contractedAmount > 0 ? contractedAmount : (proposedAmount > 0 ? proposedAmount : initialPlanned);
      const balance = Math.max(0, actualAmount - paidAmount);
      const variance = initialPlanned > 0 ? initialPlanned - actualAmount : 0;

      let status: PaymentStatus = "planeado";
      if (paidAmount >= actualAmount && actualAmount > 0) {
        status = "pago";
      } else if (paidAmount > 0) {
        status = "parcial";
      } else if (vendor.status === "contratado" || vendor.contract?.signed) {
        status = "pendente";
      }

      items.push({
        id: vendor.id || `v-item-${index + 1}`,
        category: vendor.category || "Fornecedor",
        vendorOrItem: vendor.name,
        initialPlanned,
        proposedAmount,
        contractedAmount,
        actualAmount,
        paidAmount,
        balance,
        variance,
        dueDate: "A acordar",
        status,
        notes: vendor.nextAction || undefined,
      });

      if (contractedAmount > 0) {
        installments.push({
          id: `inst-v-${index + 1}`,
          vendorOrItem: vendor.name,
          installmentLabel: paidAmount > 0 ? "Saldo Restante" : "Liquidação Contratual",
          amount: balance > 0 ? balance : contractedAmount,
          dueDate: "Conforme Contrato",
          status: balance === 0 ? "pago" : (paidAmount > 0 ? "parcial" : "pendente"),
        });
      }
    });
  }

  // 2. If no vendor items exist but we have payments from the RPC, create master lines from payments
  if (items.length === 0 && recordedPayments.length > 0) {
    recordedPayments.forEach((p, idx) => {
      items.push({
        id: p.id,
        category: "Serviço Operacional",
        vendorOrItem: p.vendorOrItem,
        initialPlanned: p.amount,
        proposedAmount: p.amount,
        contractedAmount: p.amount,
        actualAmount: p.amount,
        paidAmount: p.amount,
        balance: 0,
        variance: 0,
        dueDate: p.paidAtLabel,
        dueDateIso: p.paidAt,
        status: "pago",
        notes: `Liquidado via ${p.method}`,
      });

      installments.push({
        id: `inst-p-${idx + 1}`,
        vendorOrItem: p.vendorOrItem,
        installmentLabel: "Pagamento Liquidado",
        amount: p.amount,
        dueDate: p.paidAtLabel,
        dueDateIso: p.paidAt,
        paidAt: p.paidAt,
        status: "pago",
        method: p.method,
      });
    });
  }

  // Calculate executive summary and category breakdown using pure engine
  const summary = calculateExecutiveFinancialSummary({
    estimatedBudget,
    approvedBudget,
    guestCount,
    items,
    installments,
    recordedPayments: recordedPayments.map((p) => ({ amount: p.amount, paidAt: p.paidAt, vendorOrItem: p.vendorOrItem })),
    todayIso,
  });

  const categories = calculateCategoryBreakdown(items);

  const clientNames = event.bride_name && event.groom_name
    ? `${event.bride_name} & ${event.groom_name}`
    : event.event_name;

  return {
    context: {
      eventId: event.id,
      currency: "MT",
      eventOverview: {
        name: event.event_name,
        type: event.event_type === "wedding" ? "Casamento" : "Evento",
        date: formatEventDate(event.event_date),
        location: event.event_location || "Maputo, Moçambique",
        status: event.status === "planning" ? "Em planeamento" : event.status,
        slug: event.slug,
      },
    },
    summary,
    categories,
    items,
    installments,
    recentPayments: recordedPayments,
    clientNames,
    eventTitle: event.event_name,
    eventDateFormatted: formatEventDate(event.event_date),
    eventDateIso: event.event_date,
    guestCount,
    currency: "MZN",
    currencySymbol: "MT",
  };
}

export function convertNormalizedLedgerToBudgetModuleData(
  ledger: NormalizedEventFinancialLedger,
): BudgetModuleData {
  return {
    context: ledger.context,
    summary: {
      estimated: ledger.summary.budgetCeiling,
      registered: ledger.summary.paidAmount,
      paid: ledger.summary.paidAmount,
      pending: ledger.summary.outstandingAmount,
      nextPayment: ledger.summary.nextPayment
        ? {
            vendorName: ledger.summary.nextPayment.vendorName,
            dueDate: ledger.summary.nextPayment.dueDate,
            amount: ledger.summary.nextPayment.amount,
          }
        : { vendorName: "—", dueDate: "—", amount: 0 },
    },
    categories: ledger.categories.map((c, i) => ({
      id: `cat-${i + 1}`,
      name: c.name,
      allocated: c.allocated,
      spent: c.contracted,
      paid: c.paid,
    })),
    items: ledger.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId || "general",
      category: item.category,
      vendorOrItem: item.vendorOrItem,
      plannedAmount: item.initialPlanned,
      actualAmount: item.actualAmount,
      paidAmount: item.paidAmount,
      balance: item.balance,
      status: item.status,
      dueDate: item.dueDate,
      dueDateIso: item.dueDateIso,
    })),
    recentPayments: ledger.recentPayments,
  };
}
