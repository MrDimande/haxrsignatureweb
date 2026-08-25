import { parseEventLookup } from "@/lib/events/services/lookup-parser";
import {
  getGuestByEventAndToken,
  safeSyncGuestContactProfile,
  upsertEventContactProfile,
} from "@/lib/events/repositories/event-contact-profiles.repository";
import { createAdminClient } from "@/lib/supabase/server";
import type { CheckinLookup, RsvpSubmitInput } from "@/lib/events/types";

function getClient() {
  return createAdminClient();
}

export async function performRsvp(input: RsvpSubmitInput): Promise<CheckinLookup> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc("perform_event_rsvp", {
    p_event_id: input.eventId,
    p_token: input.token,
    p_attendance: input.attendance,
    p_name: input.name,
    p_email: input.email ?? "",
    p_phone: input.phone ?? "",
    p_plus_ones: input.plusOnes,
    p_dietary_notes: input.dietaryNotes ?? "",
    p_guest_notes: input.guestNotes ?? "",
  } as never);

  if (error) throw new Error(error.message);
  const result = parseEventLookup(data);

  if (result.ok) {
    const guest = await getGuestByEventAndToken(input.eventId, input.token);
    if (guest) {
      await safeSyncGuestContactProfile({
        eventId: input.eventId,
        guest,
        source: "rsvp",
      });
    } else {
      await upsertEventContactProfile({
        eventId: input.eventId,
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        source: "rsvp",
      }).catch((syncError) => {
        console.error("[rsvp] contact profile sync failed:", syncError);
      });
    }
  }

  return result;
}

export { lookupCheckin } from "@/lib/events/services/checkin.service";
