import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  BudgetModuleData,
  PaymentRecord,
  PaymentStatus,
  Vendor,
} from "@/lib/event-modules/types";
import {
  calculateCategoryBreakdown,
  calculateExecutiveFinancialSummary,
  type MasterBudgetItem,
  type NormalizedEventFinancialLedger,
  type PaymentInstallment,
} from "./wedding-financial-engine";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type { PaymentMethod } from "@/lib/finance/types";
import type {
  ClientEventPaymentsRpcPaymentRow,
  ClientEventPaymentsRpcPayload,
} from "@/lib/payments/client-event-payments-rpc";

export type { NormalizedEventFinancialLedger };

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

export function mapPaymentRowToRecord(row: ClientEventPaymentsRpcPaymentRow): PaymentRecord {
  return {
    id: row.id,
    vendorOrItem: resolvePaymentLabel(row),
    amount: row.amount,
    paidAt: row.paid_at,
    paidAtLabel: formatPaidAtLabel(row.paid_at),
    method: resolvePaymentMethodLabel(row.payment_method),
    vendorId: row.vendor_id || undefined,
  };
}

export function buildNormalizedFinancialLedger(input: {
  event: ClientEventRow;
  paymentsPayload?: ClientEventPaymentsRpcPayload | null;
  vendors?: Vendor[];
  todayIso?: string;
}): NormalizedEventFinancialLedger {
  const { event, paymentsPayload, vendors = [], todayIso } = input;

  const rawEstimated =
    event.budget_max ??
    event.budget_min ??
    (paymentsPayload?.summary?.budgetMax ?? paymentsPayload?.summary?.budgetMin ?? 0);
  const estimatedBudget = typeof rawEstimated === "number" && rawEstimated > 0 ? rawEstimated : 0;
  const approvedBudget: number | null = null;
  const guestCount = typeof event.estimated_guests === "number" && event.estimated_guests > 0 ? event.estimated_guests : 0;
  const location = event.event_location?.trim() ? event.event_location.trim() : "Local por definir";

  const items: MasterBudgetItem[] = [];
  const installments: PaymentInstallment[] = [];
  const recordedPayments: PaymentRecord[] = (paymentsPayload?.payments || []).map(mapPaymentRowToRecord);

  // Set of payment IDs reconciled to specific vendors
  const reconciledPaymentIds = new Set<string>();

  // 1. Process real Vendors & Contracts with ID-based payment reconciliation
  vendors.forEach((vendor, index) => {
    const isContracted =
      vendor.status === "contratado" ||
      vendor.contract?.signed === true ||
      (typeof vendor.contractedAmount === "number" && vendor.contractedAmount > 0);

    const proposedAmount = vendor.proposal?.amount || 0;
    const contractedAmount =
      typeof vendor.contractedAmount === "number" && vendor.contractedAmount > 0
        ? vendor.contractedAmount
        : 0;
    const initialPlanned = proposedAmount > 0 ? proposedAmount : (contractedAmount > 0 ? contractedAmount : 0);

    // ID-based reconciliation: match strictly by vendor.id or vendor.contract.id
    const matchingPayments = recordedPayments.filter((p) => {
      if (vendor.id && p.vendorId === vendor.id) return true;
      return false;
    });

    matchingPayments.forEach((p) => reconciledPaymentIds.add(p.id));

    const paidAmount = matchingPayments.reduce((sum, p) => sum + p.amount, 0);
    const actualAmount = contractedAmount > 0 ? contractedAmount : (proposedAmount > 0 ? proposedAmount : 0);
    const balance =
      contractedAmount > 0
        ? Math.max(0, contractedAmount - paidAmount)
        : 0;
    const variance = initialPlanned > 0 && contractedAmount > 0 ? initialPlanned - contractedAmount : 0;

    let status: PaymentStatus = "planeado";
    if (paidAmount >= contractedAmount && contractedAmount > 0) {
      status = "pago";
    } else if (paidAmount > 0) {
      status = "parcial";
    } else if (isContracted) {
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
      dueDate: "Conforme Contrato",
      status,
      notes: vendor.nextAction || undefined,
    });

    // Schedule installments for this vendor without economic duplication:
    // a) Liquidated portions
    matchingPayments.forEach((p, pIdx) => {
      installments.push({
        id: `inst-paid-${vendor.id || index}-${pIdx + 1}`,
        vendorOrItem: vendor.name,
        installmentLabel: "Pagamento Liquidado",
        amount: p.amount,
        dueDate: p.paidAtLabel,
        dueDateIso: p.paidAt,
        paidAt: p.paidAt,
        status: "pago",
        method: p.method,
      });
    });

    // b) Remaining outstanding balance (only when formal contractedAmount > 0)
    if (balance > 0 && contractedAmount > 0) {
      installments.push({
        id: `inst-bal-${vendor.id || index + 1}`,
        vendorOrItem: vendor.name,
        installmentLabel: paidAmount > 0 ? "Saldo em Falta" : "Liquidação Contratual",
        amount: balance,
        dueDate: "Conforme Contrato",
        status: "pendente",
      });
    }
  });

  // 2. Unallocated / Unassociated Recorded Payments
  recordedPayments.forEach((p, idx) => {
    if (!reconciledPaymentIds.has(p.id)) {
      p.isUnallocated = true;
      installments.push({
        id: `inst-unrec-${idx + 1}`,
        vendorOrItem: `[Não associado] ${p.vendorOrItem}`,
        installmentLabel: "Pagamento Liquidado (Sem Fornecedor Vinculado)",
        amount: p.amount,
        dueDate: p.paidAtLabel,
        dueDateIso: p.paidAt,
        paidAt: p.paidAt,
        status: "pago",
        method: p.method,
      });
    }
  });

  const summary = calculateExecutiveFinancialSummary({
    estimatedBudget,
    approvedBudget,
    guestCount,
    items,
    installments,
    recordedPayments: recordedPayments.map((p) => ({
      amount: p.amount,
      paidAt: p.paidAt,
      vendorOrItem: p.vendorOrItem,
    })),
    todayIso,
  });

  const categories = calculateCategoryBreakdown(items);

  const clientNames =
    event.bride_name && event.groom_name
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
        location,
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
    eventDateIso: event.event_date || null,
    eventLocation: location,
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
      pending:
        ledger.summary.contractedAmount > 0
          ? ledger.summary.outstandingAmount
          : Math.max(0, ledger.summary.budgetCeiling - ledger.summary.paidAmount),
      contracted: ledger.summary.contractedAmount,
      uncommitted: ledger.summary.uncommittedBudget,
      forecast: ledger.summary.forecastFinalCost,
      variance: ledger.summary.projectedVariance,
      guestCount: ledger.guestCount,
      costPerGuest: ledger.summary.costPerGuest,
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
      initialPlanned: item.initialPlanned,
      proposedAmount: item.proposedAmount,
      contractedAmount: item.contractedAmount,
      actualAmount: item.actualAmount,
      paidAmount: item.paidAmount,
      balance: item.balance,
      variance: item.variance,
      status: item.status,
      dueDate: item.dueDate,
      dueDateIso: item.dueDateIso,
      notes: item.notes,
      isDayOfWedding: item.isDayOfWedding,
    })),
    recentPayments: ledger.recentPayments,
    ledger: ledger,
  };
}
