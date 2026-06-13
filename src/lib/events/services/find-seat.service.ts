import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { FindSeatSearchResponse } from "@/lib/events/types";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

export async function searchFindSeat(
  eventId: string,
  query: string
): Promise<FindSeatSearchResponse> {
  const normalized = query.trim();

  if (normalized.length < MIN_QUERY_LENGTH) {
    return { ok: false, error: "query_too_short" };
  }

  if (normalized.length > MAX_QUERY_LENGTH) {
    return { ok: false, error: "query_too_long" };
  }

  const event = await eventsRepo.getEventPublicInfo(eventId);
  if (!event) {
    return { ok: false, error: "event_not_found" };
  }

  const results = await guestsRepo.searchGuestsByName(eventId, normalized);

  return {
    ok: true,
    event,
    results,
  };
}
