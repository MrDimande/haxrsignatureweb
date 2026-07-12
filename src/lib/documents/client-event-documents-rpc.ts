export const GET_CLIENT_EVENT_DOCUMENTS_RPC = "get_client_event_documents" as const;

export type ClientEventDocumentsRpcItemRow = {
  id: string;
  source: string;
  title: string;
  file_name: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number;
  status: string;
  category: string;
  document_type: string;
  associated_with: string;
  uploaded_by: string;
  suggested_destination: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientEventDocumentsRpcLatestDocument = {
  id: string;
  title: string;
  source: string;
  status: string;
  created_at: string;
};

export type ClientEventDocumentsRpcSummary = {
  documentCount: number;
  uploadCount: number;
  reviewItemCount: number;
  portalItemCount: number;
  pendingReviewCount: number;
  approvedCount: number;
  latestDocument: ClientEventDocumentsRpcLatestDocument | null;
  categories: string[];
  totalSize: number;
  totalItems: number;
};

export type ClientEventDocumentsRpcPayload = {
  items: ClientEventDocumentsRpcItemRow[];
  summary: ClientEventDocumentsRpcSummary;
};

type RpcQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type ClientEventDocumentsRpcClient = {
  rpc(
    fn: typeof GET_CLIENT_EVENT_DOCUMENTS_RPC,
    args: { p_client_event_id: string },
  ): Promise<RpcQueryResult<ClientEventDocumentsRpcPayload>>;
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

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function readLatestDocument(value: unknown): ClientEventDocumentsRpcLatestDocument | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string") return null;
  if (typeof value.source !== "string" || typeof value.status !== "string") return null;
  if (typeof value.created_at !== "string") return null;

  return {
    id: value.id,
    title: value.title,
    source: value.source,
    status: value.status,
    created_at: value.created_at,
  };
}

function readItemRow(value: unknown): ClientEventDocumentsRpcItemRow | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (typeof value.file_name !== "string") return null;
  if (typeof value.created_at !== "string" || typeof value.updated_at !== "string") return null;

  return {
    id: value.id,
    source: typeof value.source === "string" ? value.source : "unknown",
    title: value.title,
    file_name: value.file_name,
    storage_path: readNullableString(value.storage_path),
    mime_type: readNullableString(value.mime_type),
    size_bytes: readNumber(value.size_bytes),
    status: typeof value.status === "string" ? value.status : "unknown",
    category: typeof value.category === "string" ? value.category : "outro",
    document_type: typeof value.document_type === "string" ? value.document_type : "other",
    associated_with:
      typeof value.associated_with === "string" ? value.associated_with : "Evento",
    uploaded_by: typeof value.uploaded_by === "string" ? value.uploaded_by : "Equipa HAXR",
    suggested_destination: readNullableString(value.suggested_destination),
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export function parseClientEventDocumentsRpcPayload(
  payload: unknown,
): ClientEventDocumentsRpcPayload | null {
  if (!isRecord(payload)) return null;

  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
  const items = itemsRaw
    .map(readItemRow)
    .filter((row): row is ClientEventDocumentsRpcItemRow => row !== null);

  const summaryRaw = isRecord(payload.summary) ? payload.summary : {};
  const summary: ClientEventDocumentsRpcSummary = {
    documentCount: readNumber(summaryRaw.documentCount),
    uploadCount: readNumber(summaryRaw.uploadCount),
    reviewItemCount: readNumber(summaryRaw.reviewItemCount),
    portalItemCount: readNumber(summaryRaw.portalItemCount),
    pendingReviewCount: readNumber(summaryRaw.pendingReviewCount),
    approvedCount: readNumber(summaryRaw.approvedCount),
    latestDocument: readLatestDocument(summaryRaw.latestDocument),
    categories: readCategories(summaryRaw.categories),
    totalSize: readNumber(summaryRaw.totalSize),
    totalItems: readNumber(summaryRaw.totalItems),
  };

  return { items, summary };
}

export class ClientEventDocumentsRpcError extends Error {
  readonly code: "client_event_not_found" | "operational_not_linked" | "rpc_failed";

  constructor(code: ClientEventDocumentsRpcError["code"], message: string) {
    super(message);
    this.name = "ClientEventDocumentsRpcError";
    this.code = code;
  }
}

export function mapClientEventDocumentsRpcError(
  message: string,
): ClientEventDocumentsRpcError {
  if (message.includes("client_event_not_found")) {
    return new ClientEventDocumentsRpcError("client_event_not_found", message);
  }
  if (message.includes("operational_not_linked")) {
    return new ClientEventDocumentsRpcError("operational_not_linked", message);
  }
  return new ClientEventDocumentsRpcError("rpc_failed", message);
}

export async function fetchClientEventDocumentsViaRpc(
  rpcClient: ClientEventDocumentsRpcClient,
  clientEventId: string,
): Promise<ClientEventDocumentsRpcPayload> {
  const { data, error } = await rpcClient.rpc(GET_CLIENT_EVENT_DOCUMENTS_RPC, {
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw mapClientEventDocumentsRpcError(error.message);
  }

  const parsed = parseClientEventDocumentsRpcPayload(data);
  if (!parsed) {
    throw new ClientEventDocumentsRpcError(
      "rpc_failed",
      "Invalid RPC payload for client documents.",
    );
  }

  return parsed;
}
