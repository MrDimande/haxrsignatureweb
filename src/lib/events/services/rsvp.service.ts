import { createAdminClient } from "@/lib/supabase/server";
import type { CheckinLookup, RsvpSubmitInput } from "@/lib/events/types";
import { parseEventLookup } from "@/lib/events/services/lookup-parser";

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
  return parseEventLookup(data);
}

export { lookupCheckin } from "@/lib/events/services/checkin.service";
