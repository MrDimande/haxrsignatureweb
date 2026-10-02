import type { GuestAuditEntry } from "@/lib/events/types";
import {
  listGuestAuditByEvent as listGuestAuditByEventNeon,
  logGuestAudit as logGuestAuditNeon,
} from "@/lib/events/repositories/guest-audit.neon.repository";

export function logGuestAudit(
  guestId: string,
  eventId: string,
  guestName: string,
  action: string,
  details = "",
): Promise<void> {
  return logGuestAuditNeon(guestId, eventId, guestName, action, details);
}

export function listGuestAuditByEvent(
  eventId: string,
  limit = 80,
): Promise<GuestAuditEntry[]> {
  return listGuestAuditByEventNeon(eventId, limit);
}
