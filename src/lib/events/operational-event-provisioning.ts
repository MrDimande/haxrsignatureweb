import type { ClientEventRow } from "@/lib/events/client-app-database.types";

export const DEFAULT_OPERATIONAL_BUSINESS_ID = "haxr-signature";

export const PROVISION_CLIENT_OPERATIONAL_EVENT_RPC =
  "provision_client_operational_event" as const;

export type ProvisionOperationalEventRpcRow = {
  client_event_id: string;
  operational_event_id: string;
  created: boolean;
  reused: boolean;
};

type QueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type OperationalEventProvisioningClient = {
  rpc(
    fn: typeof PROVISION_CLIENT_OPERATIONAL_EVENT_RPC,
    args: { p_client_event_id: string },
  ): Promise<QueryResult<ProvisionOperationalEventRpcRow[]>>;
};

export type ProvisionOperationalEventResult = {
  clientEvent: ClientEventRow;
  operationalEventId: string;
  createdOperationalEvent: boolean;
  reusedOperationalEvent: boolean;
};

export class OperationalEventProvisioningError extends Error {
  readonly step: "rpc_provision";
  readonly operationalEventId?: string;
  readonly createdOperationalEvent: boolean;

  constructor(
    message: string,
    options?: {
      operationalEventId?: string;
      createdOperationalEvent?: boolean;
    },
  ) {
    super(message);
    this.name = "OperationalEventProvisioningError";
    this.step = "rpc_provision";
    this.operationalEventId = options?.operationalEventId;
    this.createdOperationalEvent = options?.createdOperationalEvent ?? false;
  }
}

export function buildOperationalEventProvisioningNote(clientEventId: string): string {
  return `Provisioned from client_events:${clientEventId}`;
}

/**
 * Idempotent provisioning for the operational `events` row used by guests,
 * payments, seating and other event modules.
 *
 * Uses the SECURITY DEFINER RPC `provision_client_operational_event` so the
 * API never needs direct INSERT grants on public.events.
 */
export async function provisionOperationalEventForClientEvent(
  clientEvent: ClientEventRow,
  client: OperationalEventProvisioningClient,
): Promise<ProvisionOperationalEventResult> {
  const { data, error } = await client.rpc(
    PROVISION_CLIENT_OPERATIONAL_EVENT_RPC,
    { p_client_event_id: clientEvent.id },
  );

  if (error) {
    throw new OperationalEventProvisioningError(error.message);
  }

  const row = data?.[0];
  if (!row) {
    throw new OperationalEventProvisioningError(
      "Operational event provisioning RPC returned no row.",
    );
  }

  return {
    clientEvent: {
      ...clientEvent,
      operational_event_id: row.operational_event_id,
    },
    operationalEventId: row.operational_event_id,
    createdOperationalEvent: row.created,
    reusedOperationalEvent: row.reused,
  };
}

/**
 * Best-effort cleanup when a later step fails after provisioning.
 * Direct DELETE on public.events may still be denied without a dedicated RPC;
 * orphans remain recoverable via the provisioning notes idempotency key.
 */
export async function deleteOperationalEventBestEffort(
  _client?: OperationalEventProvisioningClient,
  _operationalEventId?: string,
): Promise<void> {
  // No-op: events table is not writable via PostgREST for service_role.
}
