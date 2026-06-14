import type { EventType } from "@/lib/admin/types";
import type { CheckinLookup, GuestStatus } from "@/lib/events/types";

export function parseEventLookup(data: unknown): CheckinLookup {
  const row = data as Record<string, unknown>;
  if (!row?.ok) {
    return { ok: false, error: String(row?.error ?? "not_found") };
  }

  const guest = row.guest as Record<string, unknown> | undefined;
  const event = row.event as Record<string, unknown> | undefined;
  const seat = row.seat as Record<string, unknown> | null | undefined;

  return {
    ok: true,
    guest: guest
      ? {
          name: String(guest.name ?? ""),
          email: guest.email ? String(guest.email) : "",
          phone: guest.phone ? String(guest.phone) : "",
          status: guest.status as GuestStatus,
          plusOnes: Number(guest.plusOnes ?? 0),
          dietaryNotes: String(guest.dietaryNotes ?? ""),
          guestNotes: String(guest.guestNotes ?? ""),
        }
      : undefined,
    event: event
      ? {
          name: String(event.name),
          type: event.type as EventType,
          date: event.date ? String(event.date) : null,
          location: String(event.location ?? ""),
        }
      : undefined,
    seat: seat
      ? {
          tableName: String(seat.tableName),
          seatNumber: Number(seat.seatNumber),
          label: String(seat.label),
        }
      : null,
    checkedIn: Boolean(row.checkedIn),
    alreadyCheckedIn: Boolean(row.alreadyCheckedIn),
    confirmedRsvp: Boolean(row.confirmedRsvp),
    alreadyConfirmed: Boolean(row.alreadyConfirmed),
    declinedRsvp: Boolean(row.declinedRsvp),
    alreadyDeclined: Boolean(row.alreadyDeclined),
  };
}
