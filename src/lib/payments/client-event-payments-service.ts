import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  BudgetModuleData,
  EventModuleContext,
  PaymentRecord as BudgetPaymentRecord,
} from "@/lib/event-modules/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type { PaymentMethod } from "@/lib/finance/types";
import { mapRpcPayloadToDashboardFinanceMetrics } from "@/lib/payments/client-event-payments-finance";
import {
  ClientEventPaymentsRpcError,
  fetchClientEventPaymentsViaRpc,
  type ClientEventPaymentsRpcClient,
  type ClientEventPaymentsRpcPayload,
  type ClientEventPaymentsRpcPaymentRow,
} from "@/lib/payments/client-event-payments-rpc";

export type { ClientEventDashboardFinanceMetrics } from "@/lib/payments/client-event-payments-finance";
export { mapRpcPayloadToDashboardFinanceMetrics } from "@/lib/payments/client-event-payments-finance";

export type ClientEventPaymentsAuthClient = ClientEventDashboardAuthClient;

export type ClientEventPaymentsAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: ClientEventRow }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: BudgetModuleData };

export { ClientEventPaymentsRpcError };

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

function mapEventTypeLabel(type: ClientEventRow["event_type"]): string {
  switch (type) {
    case "wedding":
      return "Casamento";
    case "birthday":
      return "Aniversário";
    case "corporate":
      return "Corporativo";
    case "baby_shower":
      return "Baby shower";
    case "graduation":
      return "Formatura";
    case "other":
      return "Evento";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function buildBudgetModuleContext(event: ClientEventRow): EventModuleContext {
  return {
    eventId: event.id,
    currency: "MT",
    eventOverview: {
      name: event.event_name,
      type: mapEventTypeLabel(event.event_type),
      date: formatEventDate(event.event_date),
      location: event.event_location || "Local por definir",
      status: event.status === "planning" ? "Em planeamento" : event.status,
      slug: event.slug,
    },
  };
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

function mapPaymentRowToRecord(row: ClientEventPaymentsRpcPaymentRow): BudgetPaymentRecord {
  return {
    id: row.id,
    vendorOrItem: resolvePaymentLabel(row),
    amount: row.amount,
    paidAt: row.paid_at,
    paidAtLabel: formatPaidAtLabel(row.paid_at),
    method: resolvePaymentMethodLabel(row.payment_method),
  };
}

export function mapRpcPayloadToBudgetModuleData(
  event: ClientEventRow,
  payload: ClientEventPaymentsRpcPayload,
): BudgetModuleData {
  const finance = mapRpcPayloadToDashboardFinanceMetrics(event, payload);

  return {
    context: buildBudgetModuleContext(event),
    summary: {
      estimated: finance.budgetEstimated,
      registered: finance.paidAmount,
      paid: finance.paidAmount,
      pending: finance.pendingAmount,
      nextPayment: finance.nextPayment,
    },
    categories: [],
    items: [],
    recentPayments: payload.payments.map(mapPaymentRowToRecord),
  };
}

export async function getClientEventPaymentsData(input: {
  authClient: ClientEventPaymentsAuthClient;
  rpcClient: ClientEventPaymentsRpcClient;
  userId: string;
  eventId: string;
}): Promise<ClientEventPaymentsAccessResult> {
  const access = await resolveClientEventDashboardAccess(
    input.authClient,
    input.userId,
    input.eventId,
  );

  if (access.kind === "not_found") {
    return { kind: "not_found" };
  }

  if (access.kind === "forbidden") {
    return { kind: "forbidden" };
  }

  if (!access.event.operational_event_id) {
    return { kind: "operational_not_linked", event: access.event };
  }

  try {
    const payload = await fetchClientEventPaymentsViaRpc(
      input.rpcClient,
      access.event.id,
    );

    return {
      kind: "ok",
      data: mapRpcPayloadToBudgetModuleData(access.event, payload),
    };
  } catch (error) {
    if (error instanceof ClientEventPaymentsRpcError) {
      if (error.code === "client_event_not_found") {
        return { kind: "not_found" };
      }
      if (error.code === "operational_not_linked") {
        return { kind: "operational_not_linked", event: access.event };
      }
    }

    return {
      kind: "unavailable",
      message: "Não foi possível carregar os pagamentos operacionais.",
    };
  }
}
