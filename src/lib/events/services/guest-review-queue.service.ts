import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type { EventGuest, ReviewQueueResult } from "@/lib/events/types";
import { buildGuestReviewQueue as buildGuestReviewQueueNeon } from "@/lib/events/services/guest-review-queue.neon.service";
import { buildGuestReviewQueue as buildGuestReviewQueueSupabase } from "@/lib/events/services/guest-review-queue.supabase.service";

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
} from "@/lib/events/services/guest-review-queue.supabase.service";

export function buildGuestReviewQueue(
  eventId: string,
  guests?: EventGuest[],
): Promise<ReviewQueueResult> {
  return shouldUseNeonServerDatabase()
    ? buildGuestReviewQueueNeon(eventId, guests)
    : buildGuestReviewQueueSupabase(eventId, guests);
}
