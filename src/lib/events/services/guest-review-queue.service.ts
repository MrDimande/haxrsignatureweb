import type { EventGuest, ReviewQueueResult } from "@/lib/events/types";
import { buildGuestReviewQueue as buildGuestReviewQueueNeon } from "@/lib/events/services/guest-review-queue.neon.service";

export {
  LEDGER_REVIEW_REASONS,
  REVIEW_CLOSED_REASONS,
  buildLedgerReviewItem,
  buildResolutionReviewItem,
  buildReviewQueueSummary,
  isLedgerQueueCandidate,
  isQueueClosedReason,
  mapLedgerReasonToType,
  parseReviewItemId,
  parseRowPayloadFromUnknown,
} from "@/lib/events/services/guest-review-queue.shared";

export function buildGuestReviewQueue(
  eventId: string,
  guests?: EventGuest[],
): Promise<ReviewQueueResult> {
  return buildGuestReviewQueueNeon(eventId, guests);
}
