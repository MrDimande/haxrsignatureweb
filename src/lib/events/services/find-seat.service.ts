import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import {
  FIND_SEAT_MIN_NAME_LENGTH,
  isValidFindSeatCode,
  normalizeFindSeatCode,
} from "@/lib/events/find-seat-code";
import { normalizeSearchQuery } from "@/lib/events/normalize";
import { getPublicEventFloorPlan } from "@/lib/events/floor-plan/repository";
import type { FindSeatSearchResponse } from "@/lib/events/types";

const MAX_QUERY_LENGTH = 80;

export type FindSeatServiceDependencies = {
  verifyAccess: typeof eventsRepo.verifyFindSeatAccess;
  searchGuests: typeof guestsRepo.searchGuestsForFindSeat;
  getPublicFloorPlan: typeof getPublicEventFloorPlan;
};

const DEFAULT_DEPENDENCIES: FindSeatServiceDependencies = {
  verifyAccess: eventsRepo.verifyFindSeatAccess,
  searchGuests: guestsRepo.searchGuestsForFindSeat,
  getPublicFloorPlan: getPublicEventFloorPlan,
};

export async function searchFindSeat(
  eventId: string,
  query: string,
  accessCode: string,
  dependencies: FindSeatServiceDependencies = DEFAULT_DEPENDENCIES
): Promise<FindSeatSearchResponse> {
  const normalizedQuery = normalizeSearchQuery(query);
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

  const event = await dependencies.verifyAccess(eventId, normalizedCode);
  if (!event) {
    return { ok: false, error: "invalid_access" };
  }

  const results = await dependencies.searchGuests(
    eventId,
    normalizedQuery
  );

  if (!results.length) {
    return { ok: false, error: "not_found" };
  }

  const floorPlan = await dependencies.getPublicFloorPlan(eventId);

  return {
    ok: true,
    event,
    results,
    floorPlan,
  };
}
