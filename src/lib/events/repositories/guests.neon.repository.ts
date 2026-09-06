import { guestToDbInsert, mapGuest } from "@/lib/events/db/mappers";
import {
  normalizeGuestName,
  normalizeSearchQuery,
  rankNameMatch,
  parseGuestNameInput,
  stripPlusSuffix,
} from "@/lib/events/normalize";
import {
  FIND_SEAT_MAX_RESULTS,
  FIND_SEAT_MIN_NAME_LENGTH,
} from "@/lib/events/find-seat-code";
import { tableKeyFromName } from "@/lib/events/floor-plan/model";
import { generateQrToken } from "@/lib/events/tokens";
import { GUEST_LABEL_LABELS, GUEST_STATUS_LABELS } from "@/lib/events/constants";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import { safeSyncGuestContactProfile } from "@/lib/events/repositories/event-contact-profiles.repository";
import { recordManualMergeResolution } from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import {
  formatValidationErrors,
  validateGuestForm,
} from "@/lib/events/services/guest-validation.service";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  EventGuest,
  EventListGuestStats,
  EventStats,
  FindSeatResult,
  GuestFormData,
  GuestListPage,
  GuestListQuery,
  GuestStatus,
  SheetsSyncMode,
} from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

type GuestDbRow = Tables<"guests"> & {
  seats?: Tables<"seats"> | Tables<"seats">[] | null;
  checkins?: Tables<"checkins"> | Tables<"checkins">[] | null;
  guest_groups?: { name: string } | { name: string }[] | null;
};

type GuestJsonRow = { row: GuestDbRow };
type SeatSearchRow = {
  id: string;
  name: string;
  name_normalized: string;
  group_id: string | null;
  table_name: string | null;
  seat_number: number | null;
  seat_label: string | null;
};
type GroupMemberRow = { id: string; name: string };
type GuestStatRow = {
  event_id: string;
  status: GuestStatus;
  seat_id: string | null;
  plus_ones: number;
  name_normalized: string;
  name: string;
};
type SeatTableRow = { id: string; table_name: string; seat_number: number };
type CountRow = { count: number };

const guestRelationSelect = `
  SELECT to_jsonb(g)
    || jsonb_build_object(
      'seats', CASE WHEN s.id IS NULL THEN NULL ELSE to_jsonb(s) END,
      'checkins', CASE WHEN c.id IS NULL THEN NULL ELSE to_jsonb(c) END,
      'guest_groups', CASE WHEN gg.id IS NULL THEN NULL ELSE jsonb_build_object('name', gg.name) END
    ) AS row
  FROM public.guests g
  LEFT JOIN public.seats s ON s.id = g.seat_id
  LEFT JOIN public.checkins c ON c.guest_id = g.id
  LEFT JOIN public.guest_groups gg ON gg.id = g.group_id
`;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type ListGuestsOptions = {
  includeDeleted?: boolean;
  includeArchived?: boolean;
};

async function loadGuestByIdRaw(id: string): Promise<EventGuest | null> {
  const result = await neonQuery<GuestJsonRow>(
    `${guestRelationSelect} WHERE g.id = $1::uuid LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  return row ? mapGuest(row) : null;
}

export async function listGuestsByEvent(
  eventId: string,
  options: ListGuestsOptions = {},
): Promise<EventGuest[]> {
  const conditions = ["g.event_id = $1::uuid"];
  if (!options.includeDeleted) conditions.push("g.deleted_at IS NULL");
  if (!options.includeArchived) conditions.push("g.archived_at IS NULL");

  const result = await neonQuery<GuestJsonRow>(
    `${guestRelationSelect}
     WHERE ${conditions.join(" AND ")}
     ORDER BY g.name`,
    [eventId],
  );
  const guests = result.rows.map(({ row }) => mapGuest(row));
  await backfillNameNormalized(eventId, guests);
  return guests;
}

export async function listGuestsByEventIncludingArchived(
  eventId: string,
): Promise<EventGuest[]> {
  return listGuestsByEvent(eventId, {
    includeDeleted: false,
    includeArchived: true,
  });
}

export async function setGuestImportBatchId(
  guestId: string,
  eventId: string,
  batchId: string,
): Promise<void> {
  await neonQuery(
    `UPDATE public.guests
     SET import_batch_id = $3::uuid
     WHERE id = $1::uuid AND event_id = $2::uuid`,
    [guestId, eventId, batchId],
  );
}

export async function markGuestInviteSent(
  guestId: string,
  eventId: string,
): Promise<void> {
  await neonQuery(
    `UPDATE public.guests
     SET invite_sent_at = now()
     WHERE id = $1::uuid
       AND event_id = $2::uuid
       AND invite_sent_at IS NULL`,
    [guestId, eventId],
  );
}

export async function listGuestsPage(
  eventId: string,
  query: GuestListQuery = {},
): Promise<GuestListPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, query.pageSize ?? 50));
  const search = query.search?.trim() ?? "";
  const filter = query.filter ?? "all";

  const allGuests = await listGuestsByEvent(eventId);
  const duplicateIds = new Set(
    allGuests
      .filter((guest) =>
        allGuests.some(
          (other) =>
            other.id !== guest.id &&
            Boolean(guest.nameNormalized) &&
            other.nameNormalized === guest.nameNormalized,
        ),
      )
      .map((guest) => guest.id),
  );

  let filtered = allGuests;
  if (filter === "pending") {
    filtered = filtered.filter((guest) => guest.status === "invited");
  } else if (filter === "rsvp") {
    filtered = filtered.filter((guest) => guest.guestSource === "sheet_rsvp");
  } else if (filter === "duplicates") {
    filtered = filtered.filter((guest) => duplicateIds.has(guest.id));
  } else if (filter === "unassigned") {
    filtered = filtered.filter((guest) => !guest.seatId);
  }

  if (query.groupId) {
    filtered = filtered.filter((guest) => guest.groupId === query.groupId);
  }

  if (search) {
    const normalizedSearch = normalizeSearchQuery(search);
    filtered = filtered.filter((guest) => {
      const rank = rankNameMatch(guest.name, search);
      return rank !== null || guest.email.toLowerCase().includes(normalizedSearch);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    guests: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getGuestById(id: string): Promise<EventGuest | null> {
  return loadGuestByIdRaw(id);
}

function applyParsedGuestName(data: GuestFormData): GuestFormData {
  const parsed = parseGuestNameInput(data.name);
  return {
    ...data,
    name: parsed.name,
    plusOnes: Math.max(data.plusOnes, parsed.plusOnes),
  };
}

export async function createGuest(
  eventId: string,
  data: GuestFormData,
): Promise<EventGuest> {
  const normalizedData = applyParsedGuestName(data);
  const existingGuests = await listGuestsByEvent(eventId);
  const seats = await seatsRepo.listSeatsByEvent(eventId);
  const validationIssues = validateGuestForm(normalizedData.name, normalizedData.seatId, {
    eventId,
    existingGuests,
    seats,
  });

  if (validationIssues.some((issue) => issue.code !== "possible_duplicate")) {
    throw new Error(formatValidationErrors(validationIssues));
  }

  if (normalizedData.seatId) {
    await clearSeatAssignment(normalizedData.seatId);
  }

  const payload = guestToDbInsert(eventId, normalizedData, generateQrToken());
  const result = await neonQuery<{ id: string }>(
    `
      INSERT INTO public.guests (
        event_id, name, name_normalized, email, phone, client_type,
        seat_id, group_id, qr_token, status, plus_ones,
        dietary_notes, guest_notes, label
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6::public.client_type,
        $7::uuid, $8::uuid, $9, $10::public.guest_status, $11::int,
        $12, $13, $14::public.guest_label
      ) RETURNING id
    `,
    [
      payload.event_id,
      payload.name,
      payload.name_normalized,
      payload.email,
      payload.phone,
      payload.client_type,
      payload.seat_id,
      payload.group_id,
      payload.qr_token,
      payload.status,
      payload.plus_ones,
      payload.dietary_notes,
      payload.guest_notes,
      payload.label,
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error("Falha ao criar convidado.");
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Falha ao criar convidado.");

  await logGuestAudit(guest.id, eventId, guest.name, "Convidado criado");
  await safeSyncGuestContactProfile({ eventId, guest, source: "admin" });
  return guest;
}

export async function updateGuest(
  id: string,
  data: GuestFormData,
): Promise<EventGuest> {
  const existing = await getGuestById(id);
  if (!existing) throw new Error("Convidado não encontrado.");

  const normalizedData = applyParsedGuestName(data);
  const seats = await seatsRepo.listSeatsByEvent(existing.eventId);
  const existingGuests = await listGuestsByEvent(existing.eventId);
  const validationIssues = validateGuestForm(normalizedData.name, normalizedData.seatId, {
    eventId: existing.eventId,
    existingGuests,
    seats,
    excludeGuestId: id,
  });

  if (validationIssues.some((issue) => issue.code !== "possible_duplicate")) {
    throw new Error(formatValidationErrors(validationIssues));
  }

  if (normalizedData.seatId && normalizedData.seatId !== existing.seatId) {
    await clearSeatAssignment(normalizedData.seatId, id);
  }

  await neonQuery(
    `
      UPDATE public.guests
      SET name = $2,
          name_normalized = $3,
          email = $4,
          phone = $5,
          client_type = $6::public.client_type,
          seat_id = $7::uuid,
          group_id = $8::uuid,
          status = $9::public.guest_status,
          plus_ones = $10::int,
          dietary_notes = $11,
          guest_notes = $12,
          label = $13::public.guest_label
      WHERE id = $1::uuid
    `,
    [
      id,
      normalizedData.name.trim(),
      normalizeGuestName(normalizedData.name),
      normalizedData.email.trim(),
      normalizedData.phone.trim(),
      normalizedData.clientType,
      normalizedData.seatId || null,
      normalizedData.groupId || null,
      normalizedData.status,
      normalizedData.plusOnes,
      normalizedData.dietaryNotes.trim(),
      normalizedData.guestNotes.trim(),
      normalizedData.label,
    ],
  );

  const guest = await getGuestById(id);
  if (!guest) throw new Error("Falha ao actualizar convidado.");

  if (existing.status !== data.status) {
    await logGuestAudit(
      id,
      existing.eventId,
      guest.name,
      "Estado alterado",
      `${GUEST_STATUS_LABELS[existing.status]} → ${GUEST_STATUS_LABELS[data.status]}`,
    );
  }
  if (existing.seatId !== (data.seatId || null)) {
    const seatLabel = guest.seat
      ? `${guest.seat.tableName} · ${guest.seat.seatNumber}`
      : "Sem lugar";
    await logGuestAudit(id, existing.eventId, guest.name, "Lugar alterado", seatLabel);
  }
  if (existing.label !== data.label) {
    await logGuestAudit(
      id,
      existing.eventId,
      guest.name,
      "Etiqueta alterada",
      `${GUEST_LABEL_LABELS[existing.label]} → ${GUEST_LABEL_LABELS[data.label]}`,
    );
  }

  await safeSyncGuestContactProfile({
    eventId: existing.eventId,
    guest,
    source: "admin",
  });
  return guest;
}

export async function softDeleteGuest(
  id: string,
  reason = "soft_remove",
): Promise<void> {
  const guest = await getGuestById(id);
  if (!guest) return;

  const now = new Date().toISOString();
  await neonQuery(
    `
      UPDATE public.guests
      SET deleted_at = $3::timestamptz,
          archived_at = COALESCE(archived_at, $3::timestamptz),
          archive_reason = $4
      WHERE id = $1::uuid AND event_id = $2::uuid
    `,
    [id, guest.eventId, now, reason],
  );

  await logGuestAudit(
    guest.id,
    guest.eventId,
    guest.name,
    "Convidado removido (soft)",
    reason,
  );
}

export async function deleteGuest(id: string): Promise<void> {
  await softDeleteGuest(id, "delete_guest_action");
}

export async function archiveGuest(
  id: string,
  reason = "archived",
): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  await neonQuery(
    `UPDATE public.guests
     SET archived_at = now(), archive_reason = $3
     WHERE id = $1::uuid AND event_id = $2::uuid`,
    [id, guest.eventId, reason],
  );
  const updated = await getGuestById(id);
  if (!updated) throw new Error("Falha ao arquivar convidado.");
  await logGuestAudit(guest.id, guest.eventId, guest.name, "Convidado arquivado", reason);
  return updated;
}

export async function restoreGuest(id: string): Promise<EventGuest> {
  const existing = await getGuestById(id);
  const loaded = await loadGuestByIdRaw(id);
  if (!loaded) throw new Error("Convidado não encontrado.");

  await neonQuery(
    `
      UPDATE public.guests
      SET archived_at = NULL,
          archive_reason = '',
          deleted_at = NULL,
          is_incorrect = false
      WHERE id = $1::uuid AND event_id = $2::uuid
    `,
    [id, loaded.eventId],
  );
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Falha ao restaurar convidado.");
  await logGuestAudit(
    guest.id,
    guest.eventId,
    guest.name,
    "Convidado restaurado",
    existing?.archiveReason || "",
  );
  return guest;
}

export async function markGuestIncorrect(
  id: string,
  incorrect = true,
): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  const now = new Date().toISOString();
  await neonQuery(
    `
      UPDATE public.guests
      SET is_incorrect = $3::boolean,
          archived_at = CASE WHEN $3::boolean THEN COALESCE(archived_at, $4::timestamptz) ELSE archived_at END,
          archive_reason = CASE
            WHEN $3::boolean THEN CASE WHEN archive_reason = '' THEN 'marked_incorrect' ELSE archive_reason END
            ELSE archive_reason
          END
      WHERE id = $1::uuid AND event_id = $2::uuid
    `,
    [id, guest.eventId, incorrect, now],
  );
  const updated = await getGuestById(id);
  if (!updated) throw new Error("Falha ao marcar convidado.");
  await logGuestAudit(
    guest.id,
    guest.eventId,
    guest.name,
    incorrect ? "Marcado como incorrecto" : "Incorrecto removido",
  );
  return updated;
}

async function removeGuestSilently(id: string): Promise<void> {
  await withNeonTransaction(async (client) => {
    await client.query("DELETE FROM public.checkins WHERE guest_id = $1::uuid", [id]);
    await client.query("DELETE FROM public.guests WHERE id = $1::uuid", [id]);
  });
}

export async function assignSeatToGuest(
  guestId: string,
  seatId: string | null,
): Promise<EventGuest> {
  const guest = await getGuestById(guestId);
  if (!guest) throw new Error("Convidado não encontrado.");
  if (seatId) await clearSeatAssignment(seatId, guestId);
  return updateGuest(guestId, {
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    clientType: guest.clientType,
    status: guest.status,
    seatId,
    groupId: guest.groupId,
    plusOnes: guest.plusOnes,
    dietaryNotes: guest.dietaryNotes,
    guestNotes: guest.guestNotes,
    label: guest.label,
  });
}

export async function updateGuestStatus(
  id: string,
  status: GuestStatus,
): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  return updateGuest(id, {
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    clientType: guest.clientType,
    status,
    seatId: guest.seatId,
    groupId: guest.groupId,
    plusOnes: guest.plusOnes,
    dietaryNotes: guest.dietaryNotes,
    guestNotes: guest.guestNotes,
    label: guest.label,
  });
}

export async function confirmGuest(id: string): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  if (guest.status === "checked_in") throw new Error("Convidado já fez check-in.");
  return updateGuestStatus(id, "confirmed");
}

export async function checkInGuest(id: string): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  const now = new Date().toISOString();

  await withNeonTransaction(async (client) => {
    await client.query(
      `UPDATE public.guests
       SET status = 'checked_in'::public.guest_status, updated_at = $2::timestamptz
       WHERE id = $1::uuid`,
      [id, now],
    );
    await client.query(
      `INSERT INTO public.checkins (guest_id, event_id, checkin_time)
       VALUES ($1::uuid, $2::uuid, $3::timestamptz)
       ON CONFLICT (guest_id)
       DO UPDATE SET event_id = EXCLUDED.event_id, checkin_time = EXCLUDED.checkin_time`,
      [id, guest.eventId, now],
    );
  });

  const updated = await getGuestById(id);
  if (!updated) throw new Error("Falha ao registar check-in.");
  await logGuestAudit(id, guest.eventId, guest.name, "Check-in registado", "Admin");
  return updated;
}

export async function createGuestFromSheet(
  eventId: string,
  row: SheetGuestRow,
  syncMode: SheetsSyncMode = "master",
): Promise<EventGuest> {
  const guestSource = syncMode === "rsvp" ? "sheet_rsvp" : "sheet_master";
  const defaultStatus = syncMode === "rsvp" ? "confirmed" : row.status ?? "invited";
  const result = await neonQuery<{ id: string }>(
    `
      INSERT INTO public.guests (
        event_id, name, name_normalized, email, phone, client_type,
        qr_token, status, plus_ones, dietary_notes, guest_notes,
        label, guest_source, group_id
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6::public.client_type,
        $7, $8::public.guest_status, $9::int, $10, $11,
        $12::public.guest_label, $13::public.guest_source, $14::uuid
      ) RETURNING id
    `,
    [
      eventId,
      row.name.trim(),
      normalizeGuestName(row.name),
      row.email.trim(),
      row.phone.trim(),
      row.clientType,
      generateQrToken(),
      row.status ?? defaultStatus,
      row.plusOnes ?? 0,
      row.dietaryNotes?.trim() ?? "",
      row.guestNotes?.trim() ?? "",
      row.label ?? "none",
      guestSource,
      row.groupId ?? null,
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error("Falha ao importar convidado.");
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Falha ao importar convidado.");
  return guest;
}

export async function updateGuestFromSheet(
  guestId: string,
  row: SheetGuestRow,
  syncMode: SheetsSyncMode = "master",
): Promise<EventGuest> {
  const existing = await getGuestById(guestId);
  if (!existing) throw new Error("Convidado não encontrado.");

  const values: unknown[] = [guestId];
  const sets: string[] = [];
  const add = (column: string, value: unknown, cast = "") => {
    values.push(value);
    sets.push(`${column} = $${values.length}${cast}`);
  };

  add("name", row.name.trim());
  add("name_normalized", normalizeGuestName(row.name));
  add("email", row.email.trim());
  add("phone", row.phone.trim());
  add("client_type", row.clientType, "::public.client_type");
  add(
    "guest_source",
    syncMode === "rsvp" ? "sheet_rsvp" : "sheet_master",
    "::public.guest_source",
  );
  if (row.groupId !== undefined) add("group_id", row.groupId, "::uuid");
  if (row.plusOnes !== undefined) add("plus_ones", row.plusOnes, "::int");
  if (row.dietaryNotes !== undefined) add("dietary_notes", row.dietaryNotes);
  if (row.guestNotes !== undefined) add("guest_notes", row.guestNotes);
  if (row.label !== undefined) add("label", row.label, "::public.guest_label");

  if (syncMode === "rsvp") {
    if (existing.status !== "checked_in" && row.status === "confirmed") {
      add("status", "confirmed", "::public.guest_status");
    }
  } else if (row.status && existing.status !== "checked_in") {
    add("status", row.status, "::public.guest_status");
  }

  await neonQuery(
    `UPDATE public.guests SET ${sets.join(", ")} WHERE id = $1::uuid`,
    values,
  );
  const guest = await getGuestById(guestId);
  if (!guest) throw new Error("Falha ao actualizar convidado.");
  return guest;
}

export async function regenerateGuestToken(id: string): Promise<EventGuest> {
  await neonQuery(
    "UPDATE public.guests SET qr_token = $2 WHERE id = $1::uuid",
    [id, generateQrToken()],
  );
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");
  return guest;
}

async function backfillNameNormalized(
  eventId: string,
  guests: EventGuest[],
): Promise<void> {
  const needsBackfill = guests.filter(
    (guest) =>
      !guest.nameNormalized || guest.nameNormalized !== normalizeGuestName(guest.name),
  );
  if (!needsBackfill.length) return;

  await Promise.all(
    needsBackfill.map((guest) =>
      neonQuery(
        `UPDATE public.guests
         SET name_normalized = $3
         WHERE id = $1::uuid AND event_id = $2::uuid`,
        [guest.id, eventId, normalizeGuestName(guest.name)],
      ),
    ),
  );
}

async function loadGroupMemberNames(
  eventId: string,
  groupId: string | null,
  excludeGuestId?: string,
): Promise<string[]> {
  if (!groupId) return [];
  const result = await neonQuery<GroupMemberRow>(
    `
      SELECT id, name
      FROM public.guests
      WHERE event_id = $1::uuid
        AND group_id = $2::uuid
        AND deleted_at IS NULL
        AND archived_at IS NULL
        AND is_incorrect = false
        AND status <> 'declined'::public.guest_status
      ORDER BY name
    `,
    [eventId, groupId],
  );
  return result.rows
    .filter((row) => row.id !== excludeGuestId)
    .map((row) => row.name);
}

export async function searchGuestsByName(
  eventId: string,
  query: string,
  limit = 12,
): Promise<FindSeatResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < 2) return [];

  const result = await neonQuery<SeatSearchRow>(
    `
      SELECT g.id, g.name, g.name_normalized, g.group_id,
             s.table_name, s.seat_number, s.label AS seat_label
      FROM public.guests g
      LEFT JOIN public.seats s ON s.id = g.seat_id
      WHERE g.event_id = $1::uuid
        AND (
          position(lower($2) in lower(g.name)) > 0
          OR position(lower($3) in lower(g.name_normalized)) > 0
        )
      LIMIT 120
    `,
    [eventId, query.trim(), normalizedQuery],
  );

  const ranked = result.rows
    .map((row) => {
      const rank = rankNameMatch(row.name, query);
      if (!rank) return null;
      return {
        guestId: row.id,
        name: row.name,
        groupId: row.group_id,
        seat: row.table_name
          ? {
              tableName: row.table_name,
              seatNumber: row.seat_number ?? 1,
              label: row.seat_label ?? "",
            }
          : null,
        score: rank.score,
        matchKind: rank.kind,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt"))
    .slice(0, limit);

  const groupCache = new Map<string, string[]>();
  const results: FindSeatResult[] = [];
  for (const item of ranked) {
    let groupMembers: string[] | undefined;
    if (item.groupId) {
      const cached = groupCache.get(item.groupId);
      if (cached) {
        groupMembers = cached;
      } else {
        const members = await loadGroupMemberNames(eventId, item.groupId, item.guestId);
        const allMembers = [item.name, ...members].sort((a, b) => a.localeCompare(b, "pt"));
        groupCache.set(item.groupId, allMembers);
        groupMembers = allMembers;
      }
    }
    results.push({
      guestId: item.guestId,
      name: item.name,
      seat: item.seat,
      groupMembers,
      matchKind: item.matchKind,
    });
  }
  return results;
}

export async function searchGuestsForFindSeat(
  eventId: string,
  query: string,
): Promise<FindSeatResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < FIND_SEAT_MIN_NAME_LENGTH) return [];
  const legacyName = stripPlusSuffix(query.trim());

  const result = await neonQuery<SeatSearchRow>(
    `
      SELECT g.id, g.name, g.name_normalized, g.group_id,
             s.table_name, s.seat_number, s.label AS seat_label
      FROM public.guests g
      LEFT JOIN public.seats s ON s.id = g.seat_id
      WHERE g.event_id = $1::uuid
        AND g.deleted_at IS NULL
        AND g.archived_at IS NULL
        AND g.is_incorrect = false
        AND g.status <> 'declined'::public.guest_status
        AND (
          g.name_normalized = $2
          OR lower(g.name) = lower($3)
        )
      LIMIT $4::int
    `,
    [eventId, normalizedQuery, legacyName, (FIND_SEAT_MAX_RESULTS + 1) * 2],
  );

  const candidateRows = Array.from(new Map(result.rows.map((row) => [row.id, row])).values());
  const exactMatches = candidateRows
    .map((row) => {
      const rank = rankNameMatch(row.name, query);
      if (!rank || rank.kind !== "exact") return null;
      return {
        name: row.name,
        seat: row.table_name
          ? {
              tableName: row.table_name,
              tableKey: tableKeyFromName(row.table_name),
              seatNumber: row.seat_number ?? 1,
              label: row.seat_label ?? "",
            }
          : null,
        matchKind: "exact" as const,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  if (exactMatches.length > FIND_SEAT_MAX_RESULTS) return [];
  return exactMatches;
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const [guestResult, seatCountResult, seatRowsResult, groupCountResult] = await Promise.all([
    neonQuery<GuestStatRow>(
      `SELECT event_id, status, seat_id, plus_ones, name_normalized, name
       FROM public.guests WHERE event_id = $1::uuid`,
      [eventId],
    ),
    neonQuery<CountRow>(
      "SELECT count(*)::int AS count FROM public.seats WHERE event_id = $1::uuid",
      [eventId],
    ),
    neonQuery<{ table_name: string }>(
      "SELECT table_name FROM public.seats WHERE event_id = $1::uuid",
      [eventId],
    ),
    neonQuery<CountRow>(
      "SELECT count(*)::int AS count FROM public.guest_groups WHERE event_id = $1::uuid",
      [eventId],
    ),
  ]);

  const guestRows = guestResult.rows;
  const totalSeats = seatCountResult.rows[0]?.count ?? 0;
  const assignedSeats = guestRows.filter((g) => g.seat_id).length;
  const confirmed = guestRows.filter((g) => g.status === "confirmed").length;
  const checkedIn = guestRows.filter((g) => g.status === "checked_in").length;
  const declined = guestRows.filter((g) => g.status === "declined").length;
  const invited = guestRows.filter((g) => g.status === "invited").length;
  const totalGuests = guestRows.length;
  const plusOnesTotal = guestRows.reduce((sum, g) => sum + (g.plus_ones ?? 0), 0);
  const attendingStatuses = new Set(["confirmed", "checked_in"]);
  const expectedAttendance =
    guestRows.filter((g) => attendingStatuses.has(g.status)).length +
    guestRows
      .filter((g) => attendingStatuses.has(g.status))
      .reduce((sum, g) => sum + (g.plus_ones ?? 0), 0);
  const unassignedGuests = guestRows.filter((g) => !g.seat_id).length;

  const nameBuckets = new Map<string, number>();
  for (const row of guestRows) {
    const key = row.name_normalized || normalizeGuestName(row.name ?? "");
    if (!key) continue;
    nameBuckets.set(key, (nameBuckets.get(key) ?? 0) + 1);
  }
  const duplicateGuests = [...nameBuckets.values()]
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + count, 0);
  const uniqueTables = new Set(seatRowsResult.rows.map((s) => s.table_name)).size;
  const responded = confirmed + checkedIn + declined;
  const confirmationRate = totalGuests > 0 ? Math.round((responded / totalGuests) * 100) : 0;

  return {
    totalGuests,
    invited,
    confirmed,
    checkedIn,
    declined,
    plusOnesTotal,
    expectedAttendance,
    unassignedGuests,
    duplicateGuests,
    assignedSeats,
    totalSeats,
    uniqueTables,
    confirmationRate,
    capacityUsed: assignedSeats,
    capacityAvailable: Math.max(0, totalSeats - assignedSeats),
    groupCount: groupCountResult.rows[0]?.count ?? 0,
  };
}

export async function listGuestStatsByEventIds(
  eventIds: string[],
): Promise<Record<string, EventListGuestStats>> {
  if (!eventIds.length) return {};
  const result = await neonQuery<{ event_id: string; status: GuestStatus; seat_id: string | null }>(
    `SELECT event_id, status, seat_id
     FROM public.guests
     WHERE event_id = ANY($1::uuid[])`,
    [eventIds],
  );
  const stats: Record<string, EventListGuestStats> = {};
  for (const eventId of eventIds) {
    stats[eventId] = { totalGuests: 0, confirmed: 0, checkedIn: 0, unassigned: 0 };
  }
  for (const row of result.rows) {
    const bucket = stats[row.event_id];
    if (!bucket) continue;
    bucket.totalGuests += 1;
    if (row.status === "confirmed") bucket.confirmed += 1;
    if (row.status === "checked_in") bucket.checkedIn += 1;
    if (!row.seat_id) bucket.unassigned += 1;
  }
  return stats;
}

export async function bulkConfirmGuests(
  eventId: string,
  guestIds: string[],
): Promise<number> {
  void eventId;
  let count = 0;
  for (const id of guestIds) {
    const guest = await getGuestById(id);
    if (!guest || guest.status !== "invited") continue;
    await confirmGuest(id);
    count++;
  }
  return count;
}

export async function bulkCheckInGuests(
  eventId: string,
  guestIds: string[],
): Promise<number> {
  void eventId;
  let count = 0;
  for (const id of guestIds) {
    const guest = await getGuestById(id);
    if (!guest || guest.status === "checked_in") continue;
    await checkInGuest(id);
    count++;
  }
  return count;
}

export async function bulkAssignTable(
  eventId: string,
  guestIds: string[],
  tableName: string,
): Promise<{ assigned: number; errors: string[] }> {
  const seatResult = await neonQuery<SeatTableRow>(
    `SELECT id, table_name, seat_number
     FROM public.seats
     WHERE event_id = $1::uuid AND table_name = $2
     ORDER BY seat_number`,
    [eventId, tableName],
  );
  const guests = await listGuestsByEvent(eventId);
  const occupied = new Set(guests.filter((guest) => guest.seatId).map((guest) => guest.seatId));
  const freeSeats = seatResult.rows.filter((seat) => !occupied.has(seat.id));

  let assigned = 0;
  const errors: string[] = [];
  for (let i = 0; i < guestIds.length; i++) {
    const guestId = guestIds[i];
    const seat = freeSeats[i];
    if (!seat) {
      errors.push("Sem lugares livres suficientes nesta mesa.");
      break;
    }
    try {
      await assignSeatToGuest(guestId, seat.id);
      assigned++;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Erro ao atribuir lugar.");
    }
  }
  return { assigned, errors };
}

const STATUS_RANK: Record<GuestStatus, number> = {
  checked_in: 4,
  confirmed: 3,
  invited: 2,
  declined: 1,
};

function pickStrongerStatus(a: GuestStatus, b: GuestStatus): GuestStatus {
  return STATUS_RANK[b] > STATUS_RANK[a] ? b : a;
}

function joinNotes(primary: string, secondary: string): string {
  const parts = [primary, secondary].map((value) => value.trim()).filter(Boolean);
  return [...new Set(parts)].join(" · ");
}

export async function mergeGuests(
  eventId: string,
  primaryId: string,
  secondaryIds: string[],
): Promise<EventGuest> {
  const primary = await getGuestById(primaryId);
  if (!primary || primary.eventId !== eventId) {
    throw new Error("Convidado principal não encontrado.");
  }

  const uniqueSecondaryIds = [
    ...new Set(secondaryIds.filter((id) => id && id !== primaryId)),
  ];
  if (!uniqueSecondaryIds.length) {
    throw new Error("Seleccione pelo menos um duplicado para fundir.");
  }

  const secondaries: EventGuest[] = [];
  for (const id of uniqueSecondaryIds) {
    const guest = await getGuestById(id);
    if (!guest || guest.eventId !== eventId) continue;
    secondaries.push(guest);
  }
  if (!secondaries.length) throw new Error("Nenhum duplicado válido para fundir.");

  let mergedStatus = primary.status;
  let mergedSeatId = primary.seatId;
  let mergedEmail = primary.email;
  let mergedPhone = primary.phone;
  let mergedGroupId = primary.groupId;
  let mergedPlusOnes = primary.plusOnes;
  let mergedDietary = primary.dietaryNotes;
  let mergedNotes = primary.guestNotes;
  let mergedLabel = primary.label;
  let mergedCheckedInAt = primary.checkedInAt;

  for (const secondary of secondaries) {
    mergedStatus = pickStrongerStatus(mergedStatus, secondary.status);
    if (!mergedEmail && secondary.email) mergedEmail = secondary.email;
    if (!mergedPhone && secondary.phone) mergedPhone = secondary.phone;
    if (!mergedGroupId && secondary.groupId) mergedGroupId = secondary.groupId;
    mergedPlusOnes = Math.max(mergedPlusOnes, secondary.plusOnes);
    mergedDietary = joinNotes(mergedDietary, secondary.dietaryNotes);
    mergedNotes = joinNotes(mergedNotes, secondary.guestNotes);
    if (mergedLabel === "none" && secondary.label !== "none") mergedLabel = secondary.label;
    if (!mergedSeatId && secondary.seatId) mergedSeatId = secondary.seatId;
    if (!mergedCheckedInAt && secondary.checkedInAt) mergedCheckedInAt = secondary.checkedInAt;
  }

  if (mergedSeatId && mergedSeatId !== primary.seatId) {
    await clearSeatAssignment(mergedSeatId, primaryId);
  }

  const updated = await updateGuest(primaryId, {
    name: primary.name,
    email: mergedEmail,
    phone: mergedPhone,
    clientType: primary.clientType,
    status: mergedStatus,
    seatId: mergedSeatId,
    groupId: mergedGroupId,
    plusOnes: mergedPlusOnes,
    dietaryNotes: mergedDietary,
    guestNotes: mergedNotes,
    label: mergedLabel,
  });

  if (mergedStatus === "checked_in" && !updated.checkedInAt) {
    await checkInGuest(primaryId);
  }

  for (const secondary of secondaries) {
    if (secondary.seatId && secondary.seatId !== mergedSeatId) {
      await neonQuery("UPDATE public.guests SET seat_id = NULL WHERE id = $1::uuid", [secondary.id]);
    }
    await recordManualMergeResolution(eventId, primaryId, secondary);
    await removeGuestSilently(secondary.id);
  }

  const finalGuest = await getGuestById(primaryId);
  if (!finalGuest) throw new Error("Falha ao fundir convidados.");
  await logGuestAudit(
    primaryId,
    eventId,
    finalGuest.name,
    "Duplicados fundidos",
    `${secondaries.length} registo(s) unificado(s) — variantes memorizadas para sync futuro`,
  );
  return finalGuest;
}

async function clearSeatAssignment(
  seatId: string,
  exceptGuestId?: string,
): Promise<void> {
  if (exceptGuestId) {
    await neonQuery(
      `UPDATE public.guests
       SET seat_id = NULL
       WHERE seat_id = $1::uuid AND id <> $2::uuid`,
      [seatId, exceptGuestId],
    );
  } else {
    await neonQuery(
      "UPDATE public.guests SET seat_id = NULL WHERE seat_id = $1::uuid",
      [seatId],
    );
  }
}
