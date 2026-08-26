import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import type {
  ClientEventRow,
  ClientEventPublic,
} from "@/lib/events/client-app-database.types";
import type {
  CreateClientEventErrorCode,
  CreateClientEventResult,
} from "@/lib/events/client-event-service";
import {
  buildClientEventRedirect,
  mapCreateEventInputToClientEventInsert,
  normalizeCreateEventInput,
  resolveOnboardingFingerprint,
} from "@/lib/events/create-event-helpers";
import { validateNeonServerEnvironment } from "@/lib/neon/config";
import { withNeonTransaction } from "@/lib/neon/server-db";

export type NeonCreateClientEventDeps = {
  ownerUserId: string;
  idempotencyKey?: string | null;
};

type PublicEventRow = Pick<
  ClientEventRow,
  | "id"
  | "slug"
  | "status"
  | "event_name"
  | "event_type"
  | "event_date"
  | "operational_event_id"
  | "is_active"
  | "created_at"
>;

type ProvisionRow = {
  client_event_id: string;
  operational_event_id: string;
  created: boolean;
  reused: boolean;
};

type NeonCreateStepCode = Exclude<
  CreateClientEventErrorCode,
  "active_event_exists" | "service_role_unavailable"
>;

const PUBLIC_EVENT_COLUMNS = `
  id,
  slug,
  status::text AS status,
  event_name,
  event_type::text AS event_type,
  event_date::text AS event_date,
  operational_event_id,
  is_active,
  created_at::text AS created_at
`;

class NeonCreateEventStepError extends Error {
  constructor(
    readonly code: NeonCreateStepCode,
    message: string,
  ) {
    super(message);
    this.name = "NeonCreateEventStepError";
  }
}

function toPublicEvent(row: PublicEventRow): ClientEventPublic {
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

async function provisionOperationalEvent(
  client: Parameters<Parameters<typeof withNeonTransaction>[0]>[0],
  event: PublicEventRow,
): Promise<PublicEventRow> {
  let provisioned: ProvisionRow | undefined;
  try {
    const result = await client.query<ProvisionRow>(
      "SELECT * FROM public.provision_client_operational_event($1::uuid)",
      [event.id],
    );
    provisioned = result.rows[0];
  } catch (cause) {
    throw new NeonCreateEventStepError(
      "operational_event_provision_failed",
      cause instanceof Error ? cause.message : "Falha no provisionamento operacional.",
    );
  }

  if (!provisioned?.operational_event_id) {
    throw new NeonCreateEventStepError(
      "operational_event_provision_failed",
      "Operational event provisioning returned no row.",
    );
  }

  return {
    ...event,
    operational_event_id: provisioned.operational_event_id,
  };
}

function mapStepError(error: NeonCreateEventStepError): CreateClientEventResult {
  const messages: Record<NeonCreateStepCode, string> = {
    member_insert_failed: "Não foi possível associar o dono ao evento.",
    snapshot_insert_failed: "Não foi possível guardar o snapshot do onboarding.",
    operational_event_provision_failed:
      "Não foi possível provisionar o evento operacional. Tente novamente.",
    profile_update_failed: "Não foi possível actualizar o perfil com o evento activo.",
    event_insert_failed: "Não foi possível criar o evento. Tente novamente.",
  };

  return {
    ok: false,
    status: 500,
    error: error.code,
    message: messages[error.code],
  };
}

/**
 * Neon implementation of onboarding event creation.
 *
 * Unlike the Supabase/PostgREST path, every write and operational provisioning
 * runs inside one PostgreSQL transaction. A per-owner advisory transaction lock
 * serializes concurrent onboarding submissions so two active events cannot be
 * created for the same owner during a race.
 */
export async function createClientEventFromPayloadNeon(
  rawInput: CreateClientEventInput,
  deps: NeonCreateClientEventDeps,
): Promise<CreateClientEventResult> {
  const env = validateNeonServerEnvironment();
  if (!env.ok) {
    return {
      ok: false,
      status: 503,
      error: "service_role_unavailable",
      message: env.message,
    };
  }

  const input = normalizeCreateEventInput(rawInput);
  const fingerprint = resolveOnboardingFingerprint(input);
  const insertPayload = mapCreateEventInputToClientEventInsert(
    deps.ownerUserId,
    input,
    fingerprint,
  );

  try {
    return await withNeonTransaction(async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
        [deps.ownerUserId],
      );

      const existingByFingerprint = await client.query<PublicEventRow>(
        `SELECT ${PUBLIC_EVENT_COLUMNS}
           FROM public.client_events
          WHERE owner_user_id = $1::uuid
            AND onboarding_fingerprint = $2
            AND is_active = true
          LIMIT 1`,
        [deps.ownerUserId, fingerprint],
      );

      const existing = existingByFingerprint.rows[0];
      if (existing) {
        const linked = await provisionOperationalEvent(client, existing);
        return {
          ok: true,
          created: false,
          data: toPublicEvent(linked),
        };
      }

      const activeResult = await client.query<Pick<PublicEventRow, "id">>(
        `SELECT id
           FROM public.client_events
          WHERE owner_user_id = $1::uuid
            AND is_active = true
          LIMIT 1`,
        [deps.ownerUserId],
      );

      const active = activeResult.rows[0];
      if (active) {
        return {
          ok: false,
          status: 409,
          error: "active_event_exists",
          message: "Já tem um evento activo. Use o dashboard existente ou arquive-o primeiro.",
          existingEventId: active.id,
          redirectTo: buildClientEventRedirect(active.id),
        };
      }

      let createdEvent: PublicEventRow;
      try {
        const createdResult = await client.query<PublicEventRow>(
          `INSERT INTO public.client_events (
             owner_user_id,
             slug,
             event_name,
             event_type,
             bride_name,
             groom_name,
             event_date,
             event_location,
             estimated_guests,
             budget_min,
             budget_max,
             status,
             source,
             services_interested,
             phone,
             is_active,
             onboarding_fingerprint
           ) VALUES (
             $1::uuid,
             $2,
             $3,
             $4::event_type,
             $5,
             $6,
             $7::date,
             $8,
             $9,
             $10,
             $11,
             'planning'::client_event_status,
             $12,
             $13::text[],
             $14,
             true,
             $15
           )
           RETURNING ${PUBLIC_EVENT_COLUMNS}`,
          [
            insertPayload.owner_user_id,
            insertPayload.slug,
            insertPayload.event_name,
            insertPayload.event_type,
            insertPayload.bride_name,
            insertPayload.groom_name,
            insertPayload.event_date,
            insertPayload.event_location,
            insertPayload.estimated_guests,
            insertPayload.budget_min,
            insertPayload.budget_max,
            insertPayload.source,
            insertPayload.services_interested,
            insertPayload.phone,
            insertPayload.onboarding_fingerprint,
          ],
        );
        createdEvent = createdResult.rows[0]!;
      } catch (cause) {
        throw new NeonCreateEventStepError(
          "event_insert_failed",
          cause instanceof Error ? cause.message : "Falha ao inserir evento.",
        );
      }

      try {
        await client.query(
          `INSERT INTO public.event_members (client_event_id, user_id, role)
           VALUES ($1::uuid, $2::uuid, 'owner'::client_event_member_role)`,
          [createdEvent.id, deps.ownerUserId],
        );
      } catch (cause) {
        throw new NeonCreateEventStepError(
          "member_insert_failed",
          cause instanceof Error ? cause.message : "Falha ao inserir membro.",
        );
      }

      try {
        await client.query(
          `INSERT INTO public.event_onboarding_snapshots (
             client_event_id,
             owner_user_id,
             local_fingerprint,
             payload,
             synced_from,
             idempotency_key
           ) VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, 'api', $5)`,
          [
            createdEvent.id,
            deps.ownerUserId,
            fingerprint,
            JSON.stringify(input),
            deps.idempotencyKey ?? null,
          ],
        );
      } catch (cause) {
        throw new NeonCreateEventStepError(
          "snapshot_insert_failed",
          cause instanceof Error ? cause.message : "Falha ao inserir snapshot.",
        );
      }

      const linkedEvent = await provisionOperationalEvent(client, createdEvent);

      try {
        await client.query(
          `UPDATE public.profiles
              SET active_client_event_id = $1::uuid,
                  updated_at = now()
            WHERE id = $2::uuid`,
          [createdEvent.id, deps.ownerUserId],
        );
      } catch (cause) {
        throw new NeonCreateEventStepError(
          "profile_update_failed",
          cause instanceof Error ? cause.message : "Falha ao actualizar perfil.",
        );
      }

      return {
        ok: true,
        created: true,
        data: toPublicEvent(linkedEvent),
      };
    });
  } catch (cause) {
    if (cause instanceof NeonCreateEventStepError) {
      return mapStepError(cause);
    }

    return {
      ok: false,
      status: 500,
      error: "event_insert_failed",
      message: "Não foi possível criar o evento. Tente novamente.",
    };
  }
}
