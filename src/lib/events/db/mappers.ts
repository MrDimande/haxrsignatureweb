import { normalizeGuestName } from "@/lib/events/normalize";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  EventFormData,
  EventGuest,
  EventSeat,
  GuestFormData,
  GuestLabel,
  GuestSource,
  ManagedEvent,
  SheetsSyncMode,
} from "@/lib/events/types";
import type { BusinessId, ClientType, EventType } from "@/lib/admin/types";

export function mapEvent(
  row: Tables<"events">,
  clientName?: string | null
): ManagedEvent {
  return {
    id: row.id,
    businessId: row.business_id as BusinessId,
    clientId: row.client_id ?? null,
    clientName: clientName ?? null,
    name: row.name,
    type: row.type as EventType,
    date: row.date,
    location: row.location,
    notes: row.notes,
    isActive: row.is_active,
    googleSheetUrl: row.google_sheet_url ?? "",
    googleSheetGid: row.google_sheet_gid ?? "0",
    sheetsLastSyncedAt: row.sheets_last_synced_at ?? null,
    sheetsSyncSummary: row.sheets_sync_summary ?? "",
    sheetsSyncMode: (row.sheets_sync_mode ?? "master") as SheetsSyncMode,
    findSeatCode: row.find_seat_code ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import { generateFindSeatCode, normalizeFindSeatCode } from "@/lib/events/find-seat-code";

export function eventToDbInsert(data: EventFormData, id?: string) {
  const trimmedCode = data.findSeatCode?.trim();
  const findSeatCode = trimmedCode
    ? normalizeFindSeatCode(trimmedCode)
    : id
      ? undefined
      : generateFindSeatCode(data.name);

  return {
    ...(id ? { id } : {}),
    business_id: data.businessId,
    client_id: data.clientId || null,
    name: data.name.trim(),
    type: data.type,
    date: data.date || null,
    location: data.location.trim(),
    notes: data.notes.trim(),
    ...(findSeatCode ? { find_seat_code: findSeatCode } : {}),
  };
}

export function mapSeat(
  row: Tables<"seats">,
  guest?: { id: string; name: string } | null
): EventSeat {
  return {
    id: row.id,
    eventId: row.event_id,
    tableName: row.table_name,
    seatNumber: row.seat_number,
    label: row.label,
    createdAt: row.created_at,
    guestId: guest?.id ?? null,
    guestName: guest?.name ?? null,
  };
}

type GuestRow = Tables<"guests"> & {
  seats?: Tables<"seats"> | Tables<"seats">[] | null;
  checkins?: Tables<"checkins"> | Tables<"checkins">[] | null;
  guest_groups?: { name: string } | { name: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapGuest(row: GuestRow): EventGuest {
  const seatRow = firstRelation(row.seats);
  const checkinRow = firstRelation(row.checkins);
  const groupRow = firstRelation(row.guest_groups);

  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    nameNormalized: row.name_normalized || normalizeGuestName(row.name),
    email: row.email,
    phone: row.phone,
    clientType: row.client_type as ClientType,
    seatId: row.seat_id,
    groupId: row.group_id ?? null,
    groupName: groupRow?.name ?? null,
    qrToken: row.qr_token,
    status: row.status,
    plusOnes: row.plus_ones ?? 0,
    dietaryNotes: row.dietary_notes ?? "",
    guestNotes: row.guest_notes ?? "",
    label: (row.label ?? "none") as GuestLabel,
    guestSource: (row.guest_source ?? "manual") as GuestSource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    seat: seatRow
      ? {
          tableName: seatRow.table_name,
          seatNumber: seatRow.seat_number,
          label: seatRow.label,
        }
      : null,
    checkedInAt: checkinRow?.checkin_time ?? null,
  };
}

export function guestToDbInsert(
  eventId: string,
  data: GuestFormData,
  qrToken: string,
  id?: string
) {
  const name = data.name.trim();
  return {
    ...(id ? { id } : {}),
    event_id: eventId,
    name,
    name_normalized: normalizeGuestName(name),
    email: data.email.trim(),
    phone: data.phone.trim(),
    client_type: data.clientType,
    seat_id: data.seatId || null,
    group_id: data.groupId || null,
    qr_token: qrToken,
    status: data.status,
    plus_ones: data.plusOnes,
    dietary_notes: data.dietaryNotes.trim(),
    guest_notes: data.guestNotes.trim(),
    label: data.label,
  };
}
