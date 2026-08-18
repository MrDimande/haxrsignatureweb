export const GET_CLIENT_EVENT_PAYMENTS_RPC = "get_client_event_payments" as const;

export type ClientEventPaymentsRpcDocument = {
  number: string;
  client_name: string | null;
};

export type ClientEventPaymentsRpcPaymentRow = {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  document: ClientEventPaymentsRpcDocument | null;
  vendor_id?: string | null;
  contract_id?: string | null;
};

export type ClientEventPaymentsRpcLastPayment = {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string | null;
  paid_at: string;
};

export type ClientEventPaymentsRpcSummary = {
  paymentCount: number;
  totalPayments: number;
  totalPaid: number;
  pendingAmount: number;
  currency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetRange: string | null;
  lastPayment: ClientEventPaymentsRpcLastPayment | null;
};

export type ClientEventPaymentsRpcPayload = {
  payments: ClientEventPaymentsRpcPaymentRow[];
  summary: ClientEventPaymentsRpcSummary;
};

type RpcQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type ClientEventPaymentsRpcClient = {
  rpc(
    fn: typeof GET_CLIENT_EVENT_PAYMENTS_RPC,
    args: { p_client_event_id: string },
  ): Promise<RpcQueryResult<ClientEventPaymentsRpcPayload>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = readNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function readDocument(value: unknown): ClientEventPaymentsRpcDocument | null {
  if (!isRecord(value) || typeof value.number !== "string") return null;
  return {
    number: value.number,
    client_name: readNullableString(value.client_name),
  };
}

function readPaymentRow(value: unknown): ClientEventPaymentsRpcPaymentRow | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  if (typeof value.paid_at !== "string" || typeof value.created_at !== "string") return null;

  return {
    id: value.id,
    amount: readNumber(value.amount),
    currency: typeof value.currency === "string" ? value.currency : "MZN",
    payment_method:
      typeof value.payment_method === "string" ? value.payment_method : "other",
    reference: readNullableString(value.reference),
    notes: readNullableString(value.notes),
    paid_at: value.paid_at,
    created_at: value.created_at,
    document: readDocument(value.document),
    vendor_id: readNullableString(value.vendor_id),
    contract_id: readNullableString(value.contract_id),
  };
}

function readLastPayment(value: unknown): ClientEventPaymentsRpcLastPayment | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  if (typeof value.paid_at !== "string") return null;

  return {
    id: value.id,
    amount: readNumber(value.amount),
    currency: typeof value.currency === "string" ? value.currency : "MZN",
    payment_method:
      typeof value.payment_method === "string" ? value.payment_method : "other",
    reference: readNullableString(value.reference),
    paid_at: value.paid_at,
  };
}

export function parseClientEventPaymentsRpcPayload(
  payload: unknown,
): ClientEventPaymentsRpcPayload | null {
  if (!isRecord(payload)) return null;

  const paymentsRaw = Array.isArray(payload.payments) ? payload.payments : [];
  const payments = paymentsRaw
    .map(readPaymentRow)
    .filter((row): row is ClientEventPaymentsRpcPaymentRow => row !== null);

  const summaryRaw = isRecord(payload.summary) ? payload.summary : {};
  const summary: ClientEventPaymentsRpcSummary = {
    paymentCount: readNumber(summaryRaw.paymentCount),
    totalPayments: readNumber(summaryRaw.totalPayments),
    totalPaid: readNumber(summaryRaw.totalPaid),
    pendingAmount: readNumber(summaryRaw.pendingAmount),
    currency: typeof summaryRaw.currency === "string" ? summaryRaw.currency : "MZN",
    budgetMin: readNullableNumber(summaryRaw.budgetMin),
    budgetMax: readNullableNumber(summaryRaw.budgetMax),
    budgetRange: readNullableString(summaryRaw.budgetRange),
    lastPayment: readLastPayment(summaryRaw.lastPayment),
  };

  return { payments, summary };
}

export class ClientEventPaymentsRpcError extends Error {
  readonly code: "client_event_not_found" | "operational_not_linked" | "rpc_failed";

  constructor(code: ClientEventPaymentsRpcError["code"], message: string) {
    super(message);
    this.name = "ClientEventPaymentsRpcError";
    this.code = code;
  }
}

export function mapClientEventPaymentsRpcError(
  message: string,
): ClientEventPaymentsRpcError {
  if (message.includes("client_event_not_found")) {
    return new ClientEventPaymentsRpcError("client_event_not_found", message);
  }
  if (message.includes("operational_not_linked")) {
    return new ClientEventPaymentsRpcError("operational_not_linked", message);
  }
  return new ClientEventPaymentsRpcError("rpc_failed", message);
}

export async function fetchClientEventPaymentsViaRpc(
  rpcClient: ClientEventPaymentsRpcClient,
  clientEventId: string,
): Promise<ClientEventPaymentsRpcPayload> {
  const { data, error } = await rpcClient.rpc(GET_CLIENT_EVENT_PAYMENTS_RPC, {
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw mapClientEventPaymentsRpcError(error.message);
  }

  const parsed = parseClientEventPaymentsRpcPayload(data);
  if (!parsed) {
    throw new ClientEventPaymentsRpcError(
      "rpc_failed",
      "Invalid RPC payload for client payments.",
    );
  }

  return parsed;
}
