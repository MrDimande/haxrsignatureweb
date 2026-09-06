import type { GuestAuditEntry } from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  listGuestAuditByEvent as listGuestAuditByEventNeon,
  logGuestAudit as logGuestAuditNeon,
} from "@/lib/events/repositories/guest-audit.neon.repository";
import {
  listGuestAuditByEvent as listGuestAuditByEventSupabase,
  logGuestAudit as logGuestAuditSupabase,
} from "@/lib/events/repositories/guest-audit.supabase.repository";

export function logGuestAudit(
  guestId: string,
  eventId: string,
  guestName: string,
  action: string,
  details = "",
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? logGuestAuditNeon(guestId, eventId, guestName, action, details)
    : logGuestAuditSupabase(guestId, eventId, guestName, action, details);
}

export function listGuestAuditByEvent(
  eventId: string,
  limit = 80,
): Promise<GuestAuditEntry[]> {
  return shouldUseNeonServerDatabase()
    ? listGuestAuditByEventNeon(eventId, limit)
    : listGuestAuditByEventSupabase(eventId, limit);
}
