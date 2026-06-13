import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import type { GuestAuditEntry } from "@/lib/events/types";

export async function logGuestAudit(
  guestId: string,
  eventId: string,
  guestName: string,
  action: string,
  details = ""
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("guest_audit_log").insert({
    guest_id: guestId,
    event_id: eventId,
    guest_name: guestName.trim(),
    action,
    details,
  } as never);

  if (error) throw new Error(error.message);
}

export async function listGuestAuditByEvent(
  eventId: string,
  limit = 80
): Promise<GuestAuditEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_audit_log")
    .select("*")
    .eq("event_id", eventId)
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return asTableRows<"guest_audit_log">(data).map((row) => ({
    id: row.id,
    guestId: row.guest_id,
    eventId: row.event_id,
    guestName: row.guest_name,
    action: row.action,
    details: row.details,
    changedAt: row.changed_at,
  }));
}
