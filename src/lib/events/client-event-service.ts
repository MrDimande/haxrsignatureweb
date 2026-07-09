import type { Json } from "@/lib/supabase/database.types";
import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import type {
  ClientEventInsert,
  ClientEventPublic,
  ClientEventRow,
  EventMemberInsert,
  OnboardingSnapshotInsert,
} from "@/lib/events/client-app-database.types";
import {
  buildClientEventRedirect,
  mapCreateEventInputToClientEventInsert,
  normalizeCreateEventInput,
  resolveOnboardingFingerprint,
} from "@/lib/events/create-event-helpers";
import {
  deleteOperationalEventBestEffort,
  provisionOperationalEventForClientEvent,
  type OperationalEventProvisioningClient,
  type ProvisionOperationalEventResult,
} from "@/lib/events/operational-event-provisioning";

export type CreateClientEventErrorCode =
  | "active_event_exists"
  | "member_insert_failed"
  | "snapshot_insert_failed"
  | "operational_event_provision_failed"
  | "profile_update_failed"
  | "event_insert_failed"
  | "service_role_unavailable";

export type CreateClientEventResult =
  | {
      ok: true;
      created: boolean;
      data: ClientEventPublic;
    }
  | {
      ok: false;
      status: 409 | 500 | 503;
      error: CreateClientEventErrorCode;
      message: string;
      existingEventId?: string;
      redirectTo?: string;
    };

type QueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

type EqChain<T> = {
  eq(column: string, value: string | boolean): EqChain<T>;
  maybeSingle(): Promise<QueryResult<T>>;
};

type AuthClient = {
  from(table: "client_events"): {
    select(columns: string): EqChain<ClientEventRow>;
    insert(
      values: ClientEventInsert,
    ): {
      select(columns: string): {
        single(): Promise<QueryResult<ClientEventRow>>;
      };
    };
  };
  from(table: "event_members"): {
    insert(values: EventMemberInsert): Promise<QueryResult<null>>;
  };
  from(table: "profiles"): {
    update(values: { active_client_event_id: string }): {
      eq(column: string, value: string): Promise<QueryResult<null>>;
    };
  };
};

type AdminClient = {
  from(table: "client_events"): {
    delete(): {
      eq(column: string, value: string): Promise<QueryResult<null>>;
    };
  };
  from(table: "event_onboarding_snapshots"): {
    insert(values: OnboardingSnapshotInsert): Promise<QueryResult<null>>;
  };
} & OperationalEventProvisioningClient;

export type CreateClientEventDeps = {
  authClient: AuthClient;
  adminClient: AdminClient | null;
  ownerUserId: string;
  idempotencyKey?: string | null;
};

function toPublicEvent(row: ClientEventRow): ClientEventPublic {
  return {
    eventId: row.id,
    slug: row.slug,
    status: row.status,
    eventName: row.event_name,
    eventType: row.event_type,
    eventDate: row.event_date,
    isActive: row.is_active,
    operationalEventId: row.operational_event_id,
    operationalLinked: Boolean(row.operational_event_id),
    createdAt: row.created_at,
    redirectTo: buildClientEventRedirect(row.id),
  };
}

async function findActiveEventByFingerprint(
  authClient: AuthClient,
  ownerUserId: string,
  fingerprint: string,
): Promise<ClientEventRow | null> {
  const { data, error } = await authClient
    .from("client_events")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("onboarding_fingerprint", fingerprint)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function findActiveEventForOwner(
  authClient: AuthClient,
  ownerUserId: string,
): Promise<ClientEventRow | null> {
  const { data, error } = await authClient
    .from("client_events")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function compensateDeleteEvent(
  adminClient: AdminClient | null,
  eventId: string,
): Promise<void> {
  if (!adminClient) return;

  await adminClient.from("client_events").delete().eq("id", eventId);
}

async function provisionOperationalEventOrReturnError(
  event: ClientEventRow,
  adminClient: AdminClient,
): Promise<
  | { ok: true; provisioning: ProvisionOperationalEventResult }
  | {
      ok: false;
      error: CreateClientEventResult & { ok: false };
    }
> {
  try {
    const provisioning = await provisionOperationalEventForClientEvent(
      event,
      adminClient,
    );
    return { ok: true, provisioning };
  } catch {
    return {
      ok: false,
      error: {
        ok: false,
        status: 500,
        error: "operational_event_provision_failed",
        message:
          "Não foi possível provisionar o evento operacional. Tente novamente.",
      },
    };
  }
}

/**
 * Creates a client_event with owner membership, onboarding snapshot and profile link.
 *
 * O provisioning operacional é transaccional via RPC SECURITY DEFINER. Se uma
 * etapa posterior falhar, compensamos com delete do client_event (CASCADE em
 * members/snapshots). Eventos operacionais órfãos ficam reutilizáveis pela nota
 * idempotente na RPC.
 */
export async function createClientEventFromPayload(
  rawInput: CreateClientEventInput,
  deps: CreateClientEventDeps,
): Promise<CreateClientEventResult> {
  const input = normalizeCreateEventInput(rawInput);
  const fingerprint = resolveOnboardingFingerprint(input);
  const { authClient, adminClient, ownerUserId, idempotencyKey } = deps;

  if (!adminClient) {
    return {
      ok: false,
      status: 503,
      error: "service_role_unavailable",
      message:
        "Serviço de auditoria indisponível. Configure SUPABASE_SERVICE_ROLE_KEY do preview em .env.development.local.",
    };
  }

  const existingByFingerprint = await findActiveEventByFingerprint(
    authClient,
    ownerUserId,
    fingerprint,
  );

  if (existingByFingerprint) {
    const provisioning = await provisionOperationalEventOrReturnError(
      existingByFingerprint,
      adminClient,
    );

    if (!provisioning.ok) {
      return provisioning.error;
    }

    return {
      ok: true,
      created: false,
      data: toPublicEvent(provisioning.provisioning.clientEvent),
    };
  }

  const activeEvent = await findActiveEventForOwner(authClient, ownerUserId);
  if (activeEvent) {
    return {
      ok: false,
      status: 409,
      error: "active_event_exists",
      message: "Já tem um evento activo. Use o dashboard existente ou arquive-o primeiro.",
      existingEventId: activeEvent.id,
      redirectTo: buildClientEventRedirect(activeEvent.id),
    };
  }

  const insertPayload = mapCreateEventInputToClientEventInsert(
    ownerUserId,
    input,
    fingerprint,
  );

  const { data: createdEvent, error: eventError } = await authClient
    .from("client_events")
    .insert(insertPayload)
    .select("*")
    .single();

  if (eventError || !createdEvent) {
    return {
      ok: false,
      status: 500,
      error: "event_insert_failed",
      message: "Não foi possível criar o evento. Tente novamente.",
    };
  }

  const eventId = createdEvent.id;

  const { error: memberError } = await authClient.from("event_members").insert({
    client_event_id: eventId,
    user_id: ownerUserId,
    role: "owner",
  });

  if (memberError) {
    await compensateDeleteEvent(adminClient, eventId);
    return {
      ok: false,
      status: 500,
      error: "member_insert_failed",
      message: "Não foi possível associar o dono ao evento.",
    };
  }

  const snapshotPayload = input as unknown as Json;
  const { error: snapshotError } = await adminClient
    .from("event_onboarding_snapshots")
    .insert({
      client_event_id: eventId,
      owner_user_id: ownerUserId,
      local_fingerprint: fingerprint,
      payload: snapshotPayload,
      synced_from: "api",
      idempotency_key: idempotencyKey ?? null,
    });

  if (snapshotError) {
    await compensateDeleteEvent(adminClient, eventId);
    return {
      ok: false,
      status: 500,
      error: "snapshot_insert_failed",
      message: "Não foi possível guardar o snapshot do onboarding.",
    };
  }

  const provisioning = await provisionOperationalEventOrReturnError(
    createdEvent,
    adminClient,
  );

  if (!provisioning.ok) {
    await compensateDeleteEvent(adminClient, eventId);
    return provisioning.error;
  }

  const { error: profileError } = await authClient
    .from("profiles")
    .update({ active_client_event_id: eventId })
    .eq("id", ownerUserId);

  if (profileError) {
    if (provisioning.provisioning.createdOperationalEvent) {
      await deleteOperationalEventBestEffort(
        adminClient,
        provisioning.provisioning.operationalEventId,
      );
    }
    await compensateDeleteEvent(adminClient, eventId);
    return {
      ok: false,
      status: 500,
      error: "profile_update_failed",
      message: "Não foi possível actualizar o perfil com o evento activo.",
    };
  }

  return {
    ok: true,
    created: true,
    data: toPublicEvent(provisioning.provisioning.clientEvent),
  };
}
