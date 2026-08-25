import type { GuestAuditEntry } from "@/lib/events/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type GuestAuditRow = Tables<"guest_audit_log">;
type AuditJsonRow = { row: GuestAuditRow };

export async function logGuestAudit(
  guestId: string,
  eventId: string,
  guestName: string,
  action: string,
  details = "",
): Promise<void> {
  await neonQuery(
    `
      INSERT INTO public.guest_audit_log (
        guest_id,
        event_id,
        guest_name,
        action,
        details
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5)
    `,
    [guestId, eventId, guestName.trim(), action, details],
  );
}

export async function listGuestAuditByEvent(
  eventId: string,
  limit = 80,
): Promise<GuestAuditEntry[]> {
  const result = await neonQuery<AuditJsonRow>(
    `
      SELECT to_jsonb(a) AS row
      FROM public.guest_audit_log a
      WHERE a.event_id = $1::uuid
      ORDER BY a.changed_at DESC
      LIMIT $2::int
    `,
    [eventId, limit],
  );

  return result.rows.map(({ row }) => ({
    id: row.id,
    guestId: row.guest_id,
    eventId: row.event_id,
    guestName: row.guest_name,
    action: row.action,
    details: row.details,
    changedAt: row.changed_at,
  }));
}
