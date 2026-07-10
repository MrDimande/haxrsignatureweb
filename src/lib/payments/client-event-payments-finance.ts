import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  ClientEventPaymentsRpcPayload,
  ClientEventPaymentsRpcPaymentRow,
} from "@/lib/payments/client-event-payments-rpc";

/** Finance KPIs shared by the budget module and client dashboard. */
export type ClientEventDashboardFinanceMetrics = {
  paymentCount: number;
  paidAmount: number;
  pendingAmount: number;
  budgetEstimated: number;
  nextPayment: {
    vendorName: string;
    dueDate: string;
    amount: number;
  };
};

function resolveEstimatedBudget(summary: ClientEventPaymentsRpcPayload["summary"]): number {
  if (summary.budgetMax !== null && summary.budgetMax > 0) {
    return summary.budgetMax;
  }
  if (summary.budgetMin !== null && summary.budgetMin > 0) {
    return summary.budgetMin;
  }
  return 0;
}

function resolveBudgetFromEvent(event: ClientEventRow): number {
  return event.budget_max ?? event.budget_min ?? 0;
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

function resolvePaymentLabel(row: ClientEventPaymentsRpcPaymentRow): string {
  if (row.notes?.trim()) return row.notes.trim();
  if (row.document?.client_name?.trim()) return row.document.client_name.trim();
  if (row.document?.number?.trim()) return `Documento ${row.document.number.trim()}`;
  if (row.reference?.trim()) return row.reference.trim();
  return "Pagamento registado";
}

function resolveLastPaymentLabel(payload: ClientEventPaymentsRpcPayload): string {
  const last = payload.summary.lastPayment;
  if (!last) return "—";
  const row = payload.payments.find((payment) => payment.id === last.id);
  if (row) return resolvePaymentLabel(row);
  if (last.reference?.trim()) return last.reference.trim();
  return "Pagamento registado";
}

function resolveNextPaymentFromPayload(
  payload: ClientEventPaymentsRpcPayload,
): ClientEventDashboardFinanceMetrics["nextPayment"] {
  const lastPayment = payload.summary.lastPayment;
  if (!lastPayment) {
    return {
      vendorName: "—",
      dueDate: "—",
      amount: 0,
    };
  }

  return {
    vendorName: resolveLastPaymentLabel(payload),
    dueDate: formatPaidAtLabel(lastPayment.paid_at),
    amount: lastPayment.amount,
  };
}

export function mapRpcPayloadToDashboardFinanceMetrics(
  event: ClientEventRow,
  payload: ClientEventPaymentsRpcPayload,
): ClientEventDashboardFinanceMetrics {
  const budgetEstimated =
    resolveEstimatedBudget(payload.summary) || resolveBudgetFromEvent(event);

  return {
    paymentCount: payload.summary.paymentCount,
    paidAmount: payload.summary.totalPaid,
    pendingAmount: payload.summary.pendingAmount,
    budgetEstimated,
    nextPayment: resolveNextPaymentFromPayload(payload),
  };
}
