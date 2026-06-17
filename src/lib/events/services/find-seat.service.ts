import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import {
  FIND_SEAT_MIN_NAME_LENGTH,
  isValidFindSeatCode,
  normalizeFindSeatCode,
} from "@/lib/events/find-seat-code";
import type { FindSeatSearchResponse } from "@/lib/events/types";

const MAX_QUERY_LENGTH = 80;

export async function searchFindSeat(
  eventId: string,
  query: string,
  accessCode: string
): Promise<FindSeatSearchResponse> {
  const normalizedQuery = query.trim();
  const normalizedCode = normalizeFindSeatCode(accessCode);

  if (!isValidFindSeatCode(normalizedCode)) {
    return { ok: false, error: "invalid_access" };
  }

  if (normalizedQuery.length < FIND_SEAT_MIN_NAME_LENGTH) {
    return { ok: false, error: "query_too_short" };
  }

  if (normalizedQuery.length > MAX_QUERY_LENGTH) {
    return { ok: false, error: "query_too_long" };
  }

  const event = await eventsRepo.verifyFindSeatAccess(eventId, normalizedCode);
  if (!event) {
    return { ok: false, error: "invalid_access" };
  }

  const results = await guestsRepo.searchGuestsForFindSeat(
    eventId,
    normalizedQuery
  );

  if (!results.length) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    event,
    results,
  };
}
