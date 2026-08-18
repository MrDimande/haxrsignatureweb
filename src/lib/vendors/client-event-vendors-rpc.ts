export const GET_CLIENT_EVENT_VENDORS_RPC = "get_client_event_vendors" as const;

export type ClientEventVendorsRpcVendorRow = {
  id: string;
  name: string;
  service_category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  proposed_amount: number | null;
  contracted_amount: number | null;
  contract_signed: boolean | null;
  currency: string;
  payment_terms: string | null;
  deadline: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ClientEventVendorsRpcLatestVendor = {
  id: string;
  name: string;
  service_category: string | null;
  status: string;
  proposed_amount: number | null;
  currency: string;
  created_at: string;
};

export type ClientEventVendorsRpcSummary = {
  vendorCount: number;
  activeVendors: number;
  pendingVendors: number;
  approvedVendors: number;
  totalEstimated: number;
  totalContracted: number;
  categories: string[];
  latestVendor: ClientEventVendorsRpcLatestVendor | null;
};

export type ClientEventVendorsRpcPayload = {
  vendors: ClientEventVendorsRpcVendorRow[];
  summary: ClientEventVendorsRpcSummary;
};

type RpcQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type ClientEventVendorsRpcClient = {
  rpc(
    fn: typeof GET_CLIENT_EVENT_VENDORS_RPC,
    args: { p_client_event_id: string },
  ): Promise<RpcQueryResult<ClientEventVendorsRpcPayload>>;
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
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readVendorRow(value: unknown): ClientEventVendorsRpcVendorRow | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (typeof value.created_at !== "string" || typeof value.updated_at !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    service_category: readNullableString(value.service_category),
    contact_email: readNullableString(value.contact_email),
    contact_phone: readNullableString(value.contact_phone),
    proposed_amount: readNullableNumber(value.proposed_amount),
    contracted_amount: readNullableNumber(value.contracted_amount),
    contract_signed: typeof value.contract_signed === "boolean" ? value.contract_signed : null,
    currency: typeof value.currency === "string" ? value.currency : "MZN",
    payment_terms: readNullableString(value.payment_terms),
    deadline: readNullableString(value.deadline),
    notes: readNullableString(value.notes),
    status: typeof value.status === "string" ? value.status : "em_analise",
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function readLatestVendor(value: unknown): ClientEventVendorsRpcLatestVendor | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (typeof value.created_at !== "string") return null;

  return {
    id: value.id,
    name: value.name,
    service_category: readNullableString(value.service_category),
    status: typeof value.status === "string" ? value.status : "em_analise",
    proposed_amount: readNullableNumber(value.proposed_amount),
    currency: typeof value.currency === "string" ? value.currency : "MZN",
    created_at: value.created_at,
  };
}

function readCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export function parseClientEventVendorsRpcPayload(
  payload: unknown,
): ClientEventVendorsRpcPayload | null {
  if (!isRecord(payload)) return null;

  const vendorsRaw = Array.isArray(payload.vendors) ? payload.vendors : [];
  const vendors = vendorsRaw
    .map(readVendorRow)
    .filter((row): row is ClientEventVendorsRpcVendorRow => row !== null);

  const summaryRaw = isRecord(payload.summary) ? payload.summary : {};
  const summary: ClientEventVendorsRpcSummary = {
    vendorCount: readNumber(summaryRaw.vendorCount),
    activeVendors: readNumber(summaryRaw.activeVendors),
    pendingVendors: readNumber(summaryRaw.pendingVendors),
    approvedVendors: readNumber(summaryRaw.approvedVendors),
    totalEstimated: readNumber(summaryRaw.totalEstimated ?? summaryRaw.total_estimated),
    totalContracted: readNumber(summaryRaw.totalContracted ?? summaryRaw.total_contracted),
    categories: readCategories(summaryRaw.categories),
    latestVendor: readLatestVendor(summaryRaw.latestVendor),
  };

  return { vendors, summary };
}

export class ClientEventVendorsRpcError extends Error {
  readonly code: "client_event_not_found" | "operational_not_linked" | "rpc_failed";

  constructor(code: ClientEventVendorsRpcError["code"], message: string) {
    super(message);
    this.name = "ClientEventVendorsRpcError";
    this.code = code;
  }
}

export function mapClientEventVendorsRpcError(
  message: string,
): ClientEventVendorsRpcError {
  if (message.includes("client_event_not_found")) {
    return new ClientEventVendorsRpcError("client_event_not_found", message);
  }
  if (message.includes("operational_not_linked")) {
    return new ClientEventVendorsRpcError("operational_not_linked", message);
  }
  return new ClientEventVendorsRpcError("rpc_failed", message);
}

export async function fetchClientEventVendorsViaRpc(
  rpcClient: ClientEventVendorsRpcClient,
  clientEventId: string,
): Promise<ClientEventVendorsRpcPayload> {
  const { data, error } = await rpcClient.rpc(GET_CLIENT_EVENT_VENDORS_RPC, {
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw mapClientEventVendorsRpcError(error.message);
  }

  const parsed = parseClientEventVendorsRpcPayload(data);
  if (!parsed) {
    throw new ClientEventVendorsRpcError(
      "rpc_failed",
      "Invalid RPC payload for client vendors.",
    );
  }

  return parsed;
}
