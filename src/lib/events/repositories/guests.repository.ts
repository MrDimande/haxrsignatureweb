import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import {
  guestToDbInsert,
  mapGuest,
} from "@/lib/events/db/mappers";
import { normalizeGuestName, normalizeSearchQuery, rankNameMatch, parseGuestNameInput } from "@/lib/events/normalize";
import { generateQrToken } from "@/lib/events/tokens";
import { GUEST_LABEL_LABELS, GUEST_STATUS_LABELS } from "@/lib/events/constants";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import {
  formatValidationErrors,
  validateGuestForm,
} from "@/lib/events/services/guest-validation.service";
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

const guestSelect = "*, seats(*), checkins(checkin_time), guest_groups(name)";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listGuestsByEvent(eventId: string): Promise<EventGuest[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select(guestSelect)
    .eq("event_id", eventId)
    .order("name");

  if (error) throw new Error(error.message);
  const guests = asTableRows<"guests">(data).map(mapGuest);
  await backfillNameNormalized(eventId, guests);
  return guests;
}

export async function listGuestsPage(
  eventId: string,
  query: GuestListQuery = {}
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
            guest.nameNormalized &&
            other.nameNormalized === guest.nameNormalized
        )
      )
      .map((guest) => guest.id)
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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select(guestSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guests">(data);
  return row ? mapGuest(row) : null;
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
  data: GuestFormData
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

  const supabase = createAdminClient();

  if (normalizedData.seatId) {
    await clearSeatAssignment(normalizedData.seatId);
  }

  const { data: saved, error } = await supabase
    .from("guests")
    .insert(
      guestToDbInsert(eventId, normalizedData, generateQrToken()) as never
    )
    .select(guestSelect)
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guests">(saved);
  if (!row) throw new Error("Falha ao criar convidado.");
  const guest = mapGuest(row);
  await logGuestAudit(guest.id, eventId, guest.name, "Convidado criado");
  return guest;
}

export async function updateGuest(
  id: string,
  data: GuestFormData
): Promise<EventGuest> {
  const supabase = createAdminClient();
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

  const { data: saved, error } = await supabase
    .from("guests")
    .update({
      name: normalizedData.name.trim(),
      name_normalized: normalizeGuestName(normalizedData.name),
      email: normalizedData.email.trim(),
      phone: normalizedData.phone.trim(),
      client_type: normalizedData.clientType,
      seat_id: normalizedData.seatId || null,
      group_id: normalizedData.groupId || null,
      status: normalizedData.status,
      plus_ones: normalizedData.plusOnes,
      dietary_notes: normalizedData.dietaryNotes.trim(),
      guest_notes: normalizedData.guestNotes.trim(),
      label: normalizedData.label,
    } as never)
    .eq("id", id)
    .select(guestSelect)
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guests">(saved);
  if (!row) throw new Error("Falha ao actualizar convidado.");
  const guest = mapGuest(row);

  if (existing.status !== data.status) {
    await logGuestAudit(
      id,
      existing.eventId,
      guest.name,
      "Estado alterado",
      `${GUEST_STATUS_LABELS[existing.status]} → ${GUEST_STATUS_LABELS[data.status]}`
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
      `${GUEST_LABEL_LABELS[existing.label]} → ${GUEST_LABEL_LABELS[data.label]}`
    );
  }

  return guest;
}

export async function deleteGuest(id: string): Promise<void> {
  const guest = await getGuestById(id);
  if (!guest) return;

  await logGuestAudit(
    guest.id,
    guest.eventId,
    guest.name,
    "Convidado eliminado"
  );

  const supabase = createAdminClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function removeGuestSilently(id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("checkins").delete().eq("guest_id", id);
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function assignSeatToGuest(
  guestId: string,
  seatId: string | null
): Promise<EventGuest> {
  const guest = await getGuestById(guestId);
  if (!guest) throw new Error("Convidado não encontrado.");

  if (seatId) {
    await clearSeatAssignment(seatId, guestId);
  }

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
  status: GuestStatus
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
  if (guest.status === "checked_in") {
    throw new Error("Convidado já fez check-in.");
  }
  const updated = await updateGuestStatus(id, "confirmed");
  return updated;
}

export async function checkInGuest(id: string): Promise<EventGuest> {
  const guest = await getGuestById(id);
  if (!guest) throw new Error("Convidado não encontrado.");

  const supabase = createAdminClient();
  const { error: guestError } = await supabase
    .from("guests")
    .update({ status: "checked_in", updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (guestError) throw new Error(guestError.message);

  const { error: checkinError } = await supabase.from("checkins").upsert(
    {
      guest_id: id,
      event_id: guest.eventId,
      checkin_time: new Date().toISOString(),
    } as never,
    { onConflict: "guest_id" }
  );

  if (checkinError) throw new Error(checkinError.message);

  const updated = await getGuestById(id);
  if (!updated) throw new Error("Falha ao registar check-in.");
  await logGuestAudit(id, guest.eventId, guest.name, "Check-in registado", "Admin");
  return updated;
}

export async function createGuestFromSheet(
  eventId: string,
  row: SheetGuestRow,
  syncMode: SheetsSyncMode = "master"
): Promise<EventGuest> {
  const supabase = createAdminClient();
  const guestSource =
    syncMode === "rsvp" ? "sheet_rsvp" : "sheet_master";
  const defaultStatus = syncMode === "rsvp" ? "confirmed" : row.status ?? "invited";

  const { data: saved, error } = await supabase
    .from("guests")
    .insert({
      event_id: eventId,
      name: row.name.trim(),
      name_normalized: normalizeGuestName(row.name),
      email: row.email.trim(),
      phone: row.phone.trim(),
      client_type: row.clientType,
      qr_token: generateQrToken(),
      status: row.status ?? defaultStatus,
      plus_ones: row.plusOnes ?? 0,
      dietary_notes: row.dietaryNotes?.trim() ?? "",
      guest_notes: row.guestNotes?.trim() ?? "",
      label: row.label ?? "none",
      guest_source: guestSource,
      group_id: row.groupId ?? null,
    } as never)
    .select(guestSelect)
    .single();

  if (error) throw new Error(error.message);
  const savedRow = asTableRow<"guests">(saved);
  if (!savedRow) throw new Error("Falha ao importar convidado.");
  return mapGuest(savedRow);
}

/** Actualiza dados da folha sem alterar lugar, QR token nem check-in. */
export async function updateGuestFromSheet(
  guestId: string,
  row: SheetGuestRow,
  syncMode: SheetsSyncMode = "master"
): Promise<EventGuest> {
  const existing = await getGuestById(guestId);
  if (!existing) throw new Error("Convidado não encontrado.");

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    name: row.name.trim(),
    name_normalized: normalizeGuestName(row.name),
    email: row.email.trim(),
    phone: row.phone.trim(),
    client_type: row.clientType,
    guest_source: syncMode === "rsvp" ? "sheet_rsvp" : "sheet_master",
  };

  if (row.groupId !== undefined) payload.group_id = row.groupId;

  if (row.plusOnes !== undefined) payload.plus_ones = row.plusOnes;
  if (row.dietaryNotes !== undefined) payload.dietary_notes = row.dietaryNotes;
  if (row.guestNotes !== undefined) payload.guest_notes = row.guestNotes;
  if (row.label !== undefined) payload.label = row.label;

  if (syncMode === "rsvp") {
    if (existing.status !== "checked_in" && row.status === "confirmed") {
      payload.status = "confirmed";
    }
  } else if (row.status && existing.status !== "checked_in") {
    payload.status = row.status;
  }

  const { data, error } = await supabase
    .from("guests")
    .update(payload as never)
    .eq("id", guestId)
    .select(guestSelect)
    .single();

  if (error) throw new Error(error.message);
  const savedRow = asTableRow<"guests">(data);
  if (!savedRow) throw new Error("Falha ao actualizar convidado.");
  return mapGuest(savedRow);
}

export async function regenerateGuestToken(id: string): Promise<EventGuest> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({ qr_token: generateQrToken() } as never)
    .eq("id", id)
    .select(guestSelect)
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guests">(data);
  if (!row) throw new Error("Convidado não encontrado.");
  return mapGuest(row);
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function backfillNameNormalized(
  eventId: string,
  guests: EventGuest[]
): Promise<void> {
  const needsBackfill = guests.filter(
    (guest) => !guest.nameNormalized || guest.nameNormalized !== normalizeGuestName(guest.name)
  );
  if (!needsBackfill.length) return;

  const supabase = createAdminClient();
  await Promise.all(
    needsBackfill.map((guest) =>
      supabase
        .from("guests")
        .update({
          name_normalized: normalizeGuestName(guest.name),
        } as never)
        .eq("id", guest.id)
        .eq("event_id", eventId)
    )
  );
}

async function loadGroupMemberNames(
  eventId: string,
  groupId: string | null,
  excludeGuestId?: string
): Promise<string[]> {
  if (!groupId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id, name")
    .eq("event_id", eventId)
    .eq("group_id", groupId)
    .order("name");

  if (error) throw new Error(error.message);

  return asTableRows<"guests">(data)
    .filter((row) => row.id !== excludeGuestId)
    .map((row) => row.name);
}

export async function searchGuestsByName(
  eventId: string,
  query: string,
  limit = 12
): Promise<FindSeatResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < 2) return [];

  const supabase = createAdminClient();
  const escaped = escapeIlike(query.trim());
  const escapedNormalized = escapeIlike(normalizedQuery);

  const { data, error } = await supabase
    .from("guests")
    .select("id, name, name_normalized, group_id, seats(table_name, seat_number, label)")
    .eq("event_id", eventId)
    .or(
      `name.ilike.%${escaped}%,name_normalized.ilike.%${escapedNormalized}%`
    )
    .limit(120);

  if (error) throw new Error(error.message);

  const ranked = asTableRows<"guests">(data)
    .map((row) => {
      const rank = rankNameMatch(row.name, query);
      if (!rank) return null;
      const seatRow = firstRelation(
        (row as { seats?: Tables<"seats"> | Tables<"seats">[] | null }).seats
      );
      return {
        guestId: row.id,
        name: row.name,
        groupId: row.group_id,
        seat: seatRow
          ? {
              tableName: seatRow.table_name,
              seatNumber: seatRow.seat_number,
              label: seatRow.label,
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
        const members = await loadGroupMemberNames(
          eventId,
          item.groupId,
          item.guestId
        );
        const allMembers = [item.name, ...members].sort((a, b) =>
          a.localeCompare(b, "pt")
        );
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

export async function getEventStats(eventId: string): Promise<EventStats> {
  const supabase = createAdminClient();
  const [guestResult, seatsResult, seatRows, groupCountResult] = await Promise.all([
    supabase
      .from("guests")
      .select("status, seat_id, plus_ones, name_normalized")
      .eq("event_id", eventId),
    supabase
      .from("seats")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase.from("seats").select("table_name").eq("event_id", eventId),
    supabase
      .from("guest_groups")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId),
  ]);

  if (guestResult.error) throw new Error(guestResult.error.message);
  if (seatsResult.error) throw new Error(seatsResult.error.message);
  if (seatRows.error) throw new Error(seatRows.error.message);
  if (groupCountResult.error) throw new Error(groupCountResult.error.message);

  const guestRows = asTableRows<"guests">(guestResult.data);
  const totalSeats = seatsResult.count ?? 0;
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

  const uniqueTables = new Set(
    asTableRows<"seats">(seatRows.data).map((s) => s.table_name)
  ).size;
  const responded = confirmed + checkedIn + declined;
  const confirmationRate =
    totalGuests > 0 ? Math.round((responded / totalGuests) * 100) : 0;

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
    groupCount: groupCountResult.count ?? 0,
  };
}

export async function listGuestStatsByEventIds(
  eventIds: string[]
): Promise<Record<string, EventListGuestStats>> {
  if (!eventIds.length) return {};

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("event_id, status, seat_id")
    .in("event_id", eventIds);

  if (error) throw new Error(error.message);

  const stats: Record<string, EventListGuestStats> = {};
  for (const eventId of eventIds) {
    stats[eventId] = {
      totalGuests: 0,
      confirmed: 0,
      checkedIn: 0,
      unassigned: 0,
    };
  }

  for (const row of asTableRows<"guests">(data)) {
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
  guestIds: string[]
): Promise<number> {
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
  guestIds: string[]
): Promise<number> {
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
  tableName: string
): Promise<{ assigned: number; errors: string[] }> {
  const supabase = createAdminClient();
  const { data: seatRows, error } = await supabase
    .from("seats")
    .select("*")
    .eq("event_id", eventId)
    .eq("table_name", tableName)
    .order("seat_number");

  if (error) throw new Error(error.message);

  const seats = asTableRows<"seats">(seatRows);
  const guests = await listGuestsByEvent(eventId);
  const occupied = new Set(
    guests.filter((guest) => guest.seatId).map((guest) => guest.seatId)
  );
  const freeSeats = seats.filter((seat) => !occupied.has(seat.id));

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
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Erro ao atribuir lugar.");
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
  const parts = [primary, secondary].map((v) => v.trim()).filter(Boolean);
  return [...new Set(parts)].join(" · ");
}

export async function mergeGuests(
  eventId: string,
  primaryId: string,
  secondaryIds: string[]
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

  if (!secondaries.length) {
    throw new Error("Nenhum duplicado válido para fundir.");
  }

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

  const supabase = createAdminClient();

  for (const secondary of secondaries) {
    mergedStatus = pickStrongerStatus(mergedStatus, secondary.status);
    if (!mergedEmail && secondary.email) mergedEmail = secondary.email;
    if (!mergedPhone && secondary.phone) mergedPhone = secondary.phone;
    if (!mergedGroupId && secondary.groupId) mergedGroupId = secondary.groupId;
    mergedPlusOnes = Math.max(mergedPlusOnes, secondary.plusOnes);
    mergedDietary = joinNotes(mergedDietary, secondary.dietaryNotes);
    mergedNotes = joinNotes(mergedNotes, secondary.guestNotes);
    if (mergedLabel === "none" && secondary.label !== "none") {
      mergedLabel = secondary.label;
    }
    if (!mergedSeatId && secondary.seatId) {
      mergedSeatId = secondary.seatId;
    }
    if (!mergedCheckedInAt && secondary.checkedInAt) {
      mergedCheckedInAt = secondary.checkedInAt;
    }
  }

  if (mergedSeatId && mergedSeatId !== primary.seatId) {
    await clearSeatAssignment(mergedSeatId, primaryId);
  }

  const mergedForm: GuestFormData = {
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
  };

  const updated = await updateGuest(primaryId, mergedForm);

  if (mergedStatus === "checked_in" && !updated.checkedInAt) {
    await checkInGuest(primaryId);
  }

  for (const secondary of secondaries) {
    if (secondary.seatId && secondary.seatId !== mergedSeatId) {
      await supabase
        .from("guests")
        .update({ seat_id: null } as never)
        .eq("id", secondary.id);
    }
    await removeGuestSilently(secondary.id);
  }

  const finalGuest = await getGuestById(primaryId);
  if (!finalGuest) throw new Error("Falha ao fundir convidados.");

  await logGuestAudit(
    primaryId,
    eventId,
    finalGuest.name,
    "Duplicados fundidos",
    `${secondaries.length} registo(s) unificado(s)`
  );

  return finalGuest;
}

async function clearSeatAssignment(
  seatId: string,
  exceptGuestId?: string
): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from("guests")
    .update({ seat_id: null } as never)
    .eq("seat_id", seatId);

  if (exceptGuestId) {
    query = query.neq("id", exceptGuestId);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}
