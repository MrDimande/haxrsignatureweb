import { normalizeGuestName } from "@/lib/events/normalize";
import { neonQuery } from "@/lib/neon/server-db";
import { validateNeonServerEnvironment } from "@/lib/neon/config";
import type { EditionGuestMatchCandidate } from "@/lib/edition/rsvp/guest-match";
import type {
  EditionRsvpAuditInput,
  EditionRsvpInsertInput,
  EditionRsvpPersistenceRepository,
  EditionRsvpRpcInput,
  EditionRsvpRpcPayload,
  EditionRsvpUpdateInput,
} from "@/lib/edition/rsvp/persist.repository.types";

export const backendName = "neon" as const;

type GuestCandidateRow = {
  id: string;
  event_id: string;
  name: string;
  name_normalized: string | null;
  email: string | null;
  phone: string | null;
  guest_source: string | null;
  qr_token: string | null;
};

type IdRow = { id: string };
type RpcRow = { payload: EditionRsvpRpcPayload | null };

export function isConfigured(): boolean {
  return validateNeonServerEnvironment().ok;
}

export async function loadEventGuestCandidates(
  eventId: string,
): Promise<EditionGuestMatchCandidate[]> {
  const result = await neonQuery<GuestCandidateRow>(
    `
      SELECT
        id::text AS id,
        event_id::text AS event_id,
        name,
        name_normalized,
        email,
        phone,
        guest_source::text AS guest_source,
        qr_token
      FROM public.guests
      WHERE event_id = $1::uuid
    `,
    [eventId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    nameNormalized: row.name_normalized ?? normalizeGuestName(row.name),
    email: row.email ?? "",
    phone: row.phone ?? "",
    guestSource: row.guest_source ?? "manual",
    qrToken: row.qr_token ?? undefined,
  }));
}

export async function insertEditionGuest(
  input: EditionRsvpInsertInput,
): Promise<string> {
  const result = await neonQuery<IdRow>(
    `
      INSERT INTO public.guests (
        event_id,
        name,
        name_normalized,
        email,
        phone,
        qr_token,
        status,
        plus_ones,
        guest_notes,
        guest_source
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::guest_status,
        $8::integer,
        $9,
        'edition_rsvp'::guest_source
      )
      RETURNING id::text AS id
    `,
    [
      input.eventId,
      input.name,
      input.nameNormalized,
      input.email,
      input.phone,
      input.qrToken,
      input.status,
      input.plusOnes,
      input.guestNotes,
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error("persist_failed");
  }
  return id;
}

export async function updateEditionGuest(
  input: EditionRsvpUpdateInput,
): Promise<boolean> {
  const result = await neonQuery<IdRow>(
    `
      UPDATE public.guests
      SET
        name = $3,
        name_normalized = $4,
        email = $5,
        phone = $6,
        status = $7::guest_status,
        plus_ones = $8::integer,
        guest_notes = $9,
        guest_source = 'edition_rsvp'::guest_source,
        updated_at = now()
      WHERE id = $1::uuid
        AND event_id = $2::uuid
      RETURNING id::text AS id
    `,
    [
      input.guestId,
      input.eventId,
      input.name,
      input.nameNormalized,
      input.email,
      input.phone,
      input.status,
      input.plusOnes,
      input.guestNotes,
    ],
  );

  return Boolean(result.rows[0]?.id);
}

export async function logEditionRsvpAudit(
  input: EditionRsvpAuditInput,
): Promise<void> {
  try {
    await neonQuery(
      `
        INSERT INTO public.guest_audit_log (
          guest_id,
          event_id,
          guest_name,
          action,
          details
        )
        VALUES ($1::uuid, $2::uuid, $3, $4, $5)
      `,
      [
        input.guestId,
        input.eventId,
        input.guestName,
        input.action,
        input.details,
      ],
    );
  } catch (error) {
    console.error(
      "[edition/rsvp] Neon audit failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function submitEditionRsvpRpc(
  input: EditionRsvpRpcInput,
): Promise<EditionRsvpRpcPayload | null> {
  const result = await neonQuery<RpcRow>(
    `
      SELECT public.submit_edition_rsvp(
        $1::uuid,
        $2::text,
        $3::text,
        $4::boolean,
        $5::integer,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::text,
        $11::boolean
      ) AS payload
    `,
    [
      input.eventId,
      input.name,
      input.nameNormalized,
      input.attending,
      input.partySize,
      input.editionSlug,
      input.email,
      input.phone,
      input.messageForBride,
      input.size,
      input.dressCodeConfirmed,
    ],
  );

  return result.rows[0]?.payload ?? null;
}

const repository: EditionRsvpPersistenceRepository = {
  backendName,
  isConfigured,
  loadEventGuestCandidates,
  insertEditionGuest,
  updateEditionGuest,
  logEditionRsvpAudit,
  submitEditionRsvpRpc,
};

export default repository;
