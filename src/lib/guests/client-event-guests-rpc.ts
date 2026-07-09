import type { OperationalGuestRow } from "@/lib/guests/client-event-guests-service";

export const GET_CLIENT_EVENT_GUESTS_RPC = "get_client_event_guests" as const;

export type ClientEventGuestsRpcSummary = {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  plusOnes: number;
  tablesAssigned: number;
  tablesTotal: number;
};

export type ClientEventGuestsRpcPayload = {
  guests: OperationalGuestRow[];
  summary: ClientEventGuestsRpcSummary;
};

type RpcQueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type ClientEventGuestsRpcClient = {
  rpc(
    fn: typeof GET_CLIENT_EVENT_GUESTS_RPC,
    args: { p_client_event_id: string },
  ): Promise<RpcQueryResult<ClientEventGuestsRpcPayload>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readSeat(value: unknown): OperationalGuestRow["seats"] {
  if (!isRecord(value)) return null;
  if (
    typeof value.table_name !== "string" ||
    typeof value.seat_number !== "number" ||
    typeof value.label !== "string"
  ) {
    return null;
  }
  return {
    table_name: value.table_name,
    seat_number: value.seat_number,
    label: value.label,
  };
}

function readGroup(value: unknown): OperationalGuestRow["guest_groups"] {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  return { name: value.name };
}

function readCheckin(value: unknown): OperationalGuestRow["checkins"] {
  if (!isRecord(value) || typeof value.checkin_time !== "string") return null;
  return { checkin_time: value.checkin_time };
}

function readGuestRow(value: unknown): OperationalGuestRow | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;

  return {
    id: value.id,
    name: value.name,
    email: readNullableString(value.email),
    phone: readNullableString(value.phone),
    status: typeof value.status === "string" ? value.status : "invited",
    plus_ones:
      typeof value.plus_ones === "number" && Number.isFinite(value.plus_ones)
        ? value.plus_ones
        : 0,
    seat_id: readNullableString(value.seat_id),
    qr_token: typeof value.qr_token === "string" ? value.qr_token : "",
    seats: readSeat(value.seats),
    guest_groups: readGroup(value.guest_groups),
    checkins: readCheckin(value.checkins),
  };
}

export function parseClientEventGuestsRpcPayload(
  payload: unknown,
): ClientEventGuestsRpcPayload | null {
  if (!isRecord(payload)) return null;

  const guestsRaw = Array.isArray(payload.guests) ? payload.guests : [];
  const guests = guestsRaw
    .map(readGuestRow)
    .filter((row): row is OperationalGuestRow => row !== null);

  const summaryRaw = isRecord(payload.summary) ? payload.summary : {};
  const summary: ClientEventGuestsRpcSummary = {
    total: readNumber(summaryRaw.total),
    confirmed: readNumber(summaryRaw.confirmed),
    pending: readNumber(summaryRaw.pending),
    declined: readNumber(summaryRaw.declined),
    plusOnes: readNumber(summaryRaw.plusOnes),
    tablesAssigned: readNumber(summaryRaw.tablesAssigned),
    tablesTotal: readNumber(summaryRaw.tablesTotal),
  };

  return { guests, summary };
}

export class ClientEventGuestsRpcError extends Error {
  readonly code: "client_event_not_found" | "operational_not_linked" | "rpc_failed";

  constructor(
    code: ClientEventGuestsRpcError["code"],
    message: string,
  ) {
    super(message);
    this.name = "ClientEventGuestsRpcError";
    this.code = code;
  }
}

export function mapClientEventGuestsRpcError(message: string): ClientEventGuestsRpcError {
  if (message.includes("client_event_not_found")) {
    return new ClientEventGuestsRpcError("client_event_not_found", message);
  }
  if (message.includes("operational_not_linked")) {
    return new ClientEventGuestsRpcError("operational_not_linked", message);
  }
  return new ClientEventGuestsRpcError("rpc_failed", message);
}

export async function fetchClientEventGuestsViaRpc(
  rpcClient: ClientEventGuestsRpcClient,
  clientEventId: string,
): Promise<ClientEventGuestsRpcPayload> {
  const { data, error } = await rpcClient.rpc(GET_CLIENT_EVENT_GUESTS_RPC, {
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw mapClientEventGuestsRpcError(error.message);
  }

  const parsed = parseClientEventGuestsRpcPayload(data);
  if (!parsed) {
    throw new ClientEventGuestsRpcError("rpc_failed", "Invalid RPC payload for client guests.");
  }

  return parsed;
}
