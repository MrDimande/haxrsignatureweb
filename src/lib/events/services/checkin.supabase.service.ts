import { createAdminClient } from "@/lib/supabase/server";
import type { CheckinLookup } from "@/lib/events/types";
import { parseEventLookup } from "@/lib/events/services/lookup-parser";

function getClient() {
  return createAdminClient();
}

export async function lookupCheckin(
  eventId: string,
  token: string
): Promise<CheckinLookup> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc("lookup_event_checkin", {
    p_event_id: eventId,
    p_token: token,
  } as never);

  if (error) throw new Error(error.message);
  return parseEventLookup(data);
}

export async function performCheckin(
  eventId: string,
  token: string
): Promise<CheckinLookup> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc("perform_event_checkin", {
    p_event_id: eventId,
    p_token: token,
  } as never);

  if (error) throw new Error(error.message);
  const result = parseEventLookup(data);
  return {
    ...result,
    checkedIn: Boolean((data as Record<string, unknown>)?.checkedIn),
    alreadyCheckedIn: Boolean(
      (data as Record<string, unknown>)?.alreadyCheckedIn
    ),
  };
}
