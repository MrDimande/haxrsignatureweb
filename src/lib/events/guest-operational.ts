import type { EventGuest } from "@/lib/events/types";

/**
 * A guest is operational only while the record is valid and actionable.
 * Historical records remain available to the administration views, but must
 * never be targeted by RSVP reminders or counted as current attendance.
 */
export function isOperationalGuest(
  guest: Pick<EventGuest, "archivedAt" | "deletedAt" | "isIncorrect">,
): boolean {
  return !guest.archivedAt && !guest.deletedAt && !guest.isIncorrect;
}
