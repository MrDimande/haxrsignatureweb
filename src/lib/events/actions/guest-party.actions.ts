"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import {
  confirmPartySuggestion,
  dismissPartySuggestion,
} from "@/lib/events/services/guest-party-actions.service";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

export async function confirmPartySuggestionAction(
  eventId: string,
  guestId: string,
  plusOnes?: number
) {
  const result = await runAction(() =>
    confirmPartySuggestion(eventId, guestId, plusOnes)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function dismissPartySuggestionAction(
  eventId: string,
  guestId: string
) {
  const result = await runAction(() =>
    dismissPartySuggestion(eventId, guestId)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}
