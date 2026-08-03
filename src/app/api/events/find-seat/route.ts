import { searchFindSeat } from "@/lib/events/services/find-seat.service";
import {
  getRequestIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";
import { createFindSeatPostHandler } from "@/lib/events/find-seat-api";

export const POST = createFindSeatPostHandler({
  search: searchFindSeat,
  rateLimit: persistentRateLimit,
  getIp: getRequestIp,
  limits: {
    ip: RATE_LIMITS.findSeat,
    event: RATE_LIMITS.findSeatPerEvent,
    code: RATE_LIMITS.findSeatPerCode,
  },
  reportUnavailable: () => {
    console.error("[api/events/find-seat] request unavailable");
  },
});
