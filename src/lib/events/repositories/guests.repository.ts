import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import {
  guestToDbInsert,
  mapGuest,
} from "@/lib/events/db/mappers";
import { generateQrToken } from "@/lib/events/tokens";
import { GUEST_LABEL_LABELS, GUEST_STATUS_LABELS } from "@/lib/events/constants";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  EventGuest,
  EventListGuestStats,
  EventStats,
  FindSeatResult,
  GuestFormData,
  GuestStatus,
  SheetsSyncMode,
} from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

const guestSelect = "*, seats(*), checkins(checkin_time)";

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
  return asTableRows<"guests">(data).map(mapGuest);
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

export async function createGuest(
  eventId: string,
  data: GuestFormData
): Promise<EventGuest> {
  const supabase = createAdminClient();

  if (data.seatId) {
    await clearSeatAssignment(data.seatId);
  }

  const { data: saved, error } = await supabase
    .from("guests")
    .insert(
      guestToDbInsert(eventId, data, generateQrToken()) as never
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

  if (data.seatId && data.seatId !== existing.seatId) {
    await clearSeatAssignment(data.seatId, id);
  }

  const { data: saved, error } = await supabase
    .from("guests")
    .update({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      client_type: data.clientType,
      seat_id: data.seatId || null,
      status: data.status,
      plus_ones: data.plusOnes,
      dietary_notes: data.dietaryNotes.trim(),
      guest_notes: data.guestNotes.trim(),
      label: data.label,
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
  const supabase = createAdminClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (guest) {
    await logGuestAudit(guest.id, guest.eventId, guest.name, "Convidado eliminado");
  }
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
    email: row.email.trim(),
    phone: row.phone.trim(),
    client_type: row.clientType,
    guest_source: syncMode === "rsvp" ? "sheet_rsvp" : "sheet_master",
  };

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

export async function searchGuestsByName(
  eventId: string,
  query: string,
  limit = 8
): Promise<FindSeatResult[]> {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("name, seats(table_name, seat_number, label)")
    .eq("event_id", eventId)
    .ilike("name", `%${escapeIlike(normalized)}%`)
    .order("name")
    .limit(limit);

  if (error) throw new Error(error.message);

  return asTableRows<"guests">(data).map((row) => {
    const seatRow = firstRelation(
      (row as { seats?: Tables<"seats"> | Tables<"seats">[] | null }).seats
    );
    return {
      name: row.name,
      seat: seatRow
        ? {
            tableName: seatRow.table_name,
            seatNumber: seatRow.seat_number,
            label: seatRow.label,
          }
        : null,
    };
  });
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const supabase = createAdminClient();
  const [guests, seatsResult, seatRows] = await Promise.all([
    listGuestsByEvent(eventId),
    supabase
      .from("seats")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase.from("seats").select("table_name").eq("event_id", eventId),
  ]);

  if (seatsResult.error) throw new Error(seatsResult.error.message);
  if (seatRows.error) throw new Error(seatRows.error.message);

  const totalSeats = seatsResult.count ?? 0;
  const assignedSeats = guests.filter((g) => g.seatId).length;
  const confirmed = guests.filter((g) => g.status === "confirmed").length;
  const checkedIn = guests.filter((g) => g.status === "checked_in").length;
  const declined = guests.filter((g) => g.status === "declined").length;
  const invited = guests.filter((g) => g.status === "invited").length;
  const totalGuests = guests.length;
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
    assignedSeats,
    totalSeats,
    uniqueTables,
    confirmationRate,
    capacityUsed: assignedSeats,
    capacityAvailable: Math.max(0, totalSeats - assignedSeats),
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
