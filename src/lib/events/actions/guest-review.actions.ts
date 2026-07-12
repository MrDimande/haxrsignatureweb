"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import {
  attachReviewItemToGuest,
  ignoreReviewItem,
  markReviewItemNeedsReview,
  markReviewItemResolved,
  restoreGuestFromReviewItem,
} from "@/lib/events/services/guest-review-actions.service";
import { buildGuestReviewQueue } from "@/lib/events/services/guest-review-queue.service";
import type { ReviewQueueResult } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

export async function loadGuestReviewQueueAction(
  eventId: string
): Promise<{ success: true; data: ReviewQueueResult } | { success: false; error: string }> {
  return runAction(() => buildGuestReviewQueue(eventId));
}

export async function attachReviewItemAction(
  eventId: string,
  itemId: string,
  targetGuestId: string
) {
  const result = await runAction(() =>
    attachReviewItemToGuest(eventId, itemId, targetGuestId)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function ignoreReviewItemAction(eventId: string, itemId: string) {
  const result = await runAction(() => ignoreReviewItem(eventId, itemId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function restoreGuestFromReviewItemAction(
  eventId: string,
  itemId: string
) {
  const result = await runAction(() =>
    restoreGuestFromReviewItem(eventId, itemId)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function markReviewItemNeedsReviewAction(
  eventId: string,
  itemId: string
) {
  const result = await runAction(() =>
    markReviewItemNeedsReview(eventId, itemId)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function markReviewItemResolvedAction(
  eventId: string,
  itemId: string
) {
  const result = await runAction(() => markReviewItemResolved(eventId, itemId));
  if (result.success) revalidateEvent(eventId);
  return result;
}
