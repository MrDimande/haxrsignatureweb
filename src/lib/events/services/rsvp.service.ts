import { createAdminClient } from "@/lib/supabase/server";
import type { CheckinLookup } from "@/lib/events/types";
import type { EventType } from "@/lib/admin/types";
import type { GuestStatus } from "@/lib/events/types";

function getClient() {
  return createAdminClient();
}

function parseLookup(data: unknown): CheckinLookup {
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
          name: String(guest.name),
          status: guest.status as GuestStatus,
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
  };
}

export async function performRsvp(
  eventId: string,
  token: string
): Promise<CheckinLookup> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc("perform_event_rsvp", {
    p_event_id: eventId,
    p_token: token,
  } as never);

  if (error) throw new Error(error.message);
  return parseLookup(data);
}

export { lookupCheckin } from "@/lib/events/services/checkin.service";
