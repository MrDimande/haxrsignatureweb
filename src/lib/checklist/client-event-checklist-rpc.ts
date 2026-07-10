export const GET_CLIENT_EVENT_CHECKLIST_RPC = "get_client_event_checklist" as const;

export type ClientEventChecklistRpcItemRow = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ClientEventChecklistRpcTaskRef = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
};

export type ClientEventChecklistRpcSummary = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  categories: string[];
  nextTask: ClientEventChecklistRpcTaskRef | null;
  urgentTasks: ClientEventChecklistRpcTaskRef[];
};

export type ClientEventChecklistRpcPayload = {
  items: ClientEventChecklistRpcItemRow[];
  summary: ClientEventChecklistRpcSummary;
};

type RpcQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type ClientEventChecklistRpcClient = {
  rpc(
    fn: typeof GET_CLIENT_EVENT_CHECKLIST_RPC,
    args: { p_client_event_id: string },
  ): Promise<RpcQueryResult<ClientEventChecklistRpcPayload>>;
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

function readItemRow(value: unknown): ClientEventChecklistRpcItemRow | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (typeof value.created_at !== "string" || typeof value.updated_at !== "string") {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    due_date: readNullableString(value.due_date),
    priority: typeof value.priority === "string" ? value.priority : "normal",
    status: typeof value.status === "string" ? value.status : "pending",
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function readTaskRef(value: unknown): ClientEventChecklistRpcTaskRef | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (typeof value.created_at !== "string") return null;

  return {
    id: value.id,
    title: value.title,
    due_date: readNullableString(value.due_date),
    priority: typeof value.priority === "string" ? value.priority : "normal",
    status: typeof value.status === "string" ? value.status : "pending",
    created_at: value.created_at,
  };
}

function readCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function readTaskRefList(value: unknown): ClientEventChecklistRpcTaskRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(readTaskRef)
    .filter((row): row is ClientEventChecklistRpcTaskRef => row !== null);
}

export function parseClientEventChecklistRpcPayload(
  payload: unknown,
): ClientEventChecklistRpcPayload | null {
  if (!isRecord(payload)) return null;

  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
  const items = itemsRaw
    .map(readItemRow)
    .filter((row): row is ClientEventChecklistRpcItemRow => row !== null);

  const summaryRaw = isRecord(payload.summary) ? payload.summary : {};
  const summary: ClientEventChecklistRpcSummary = {
    totalTasks: readNumber(summaryRaw.totalTasks),
    completedTasks: readNumber(summaryRaw.completedTasks),
    pendingTasks: readNumber(summaryRaw.pendingTasks),
    overdueTasks: readNumber(summaryRaw.overdueTasks),
    completionRate: readNumber(summaryRaw.completionRate),
    categories: readCategories(summaryRaw.categories),
    nextTask: readTaskRef(summaryRaw.nextTask),
    urgentTasks: readTaskRefList(summaryRaw.urgentTasks),
  };

  return { items, summary };
}

export class ClientEventChecklistRpcError extends Error {
  readonly code: "client_event_not_found" | "operational_not_linked" | "rpc_failed";

  constructor(code: ClientEventChecklistRpcError["code"], message: string) {
    super(message);
    this.name = "ClientEventChecklistRpcError";
    this.code = code;
  }
}

export function mapClientEventChecklistRpcError(
  message: string,
): ClientEventChecklistRpcError {
  if (message.includes("client_event_not_found")) {
    return new ClientEventChecklistRpcError("client_event_not_found", message);
  }
  if (message.includes("operational_not_linked")) {
    return new ClientEventChecklistRpcError("operational_not_linked", message);
  }
  return new ClientEventChecklistRpcError("rpc_failed", message);
}

export async function fetchClientEventChecklistViaRpc(
  rpcClient: ClientEventChecklistRpcClient,
  clientEventId: string,
): Promise<ClientEventChecklistRpcPayload> {
  const { data, error } = await rpcClient.rpc(GET_CLIENT_EVENT_CHECKLIST_RPC, {
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw mapClientEventChecklistRpcError(error.message);
  }

  const parsed = parseClientEventChecklistRpcPayload(data);
  if (!parsed) {
    throw new ClientEventChecklistRpcError(
      "rpc_failed",
      "Invalid RPC payload for client checklist.",
    );
  }

  return parsed;
}
