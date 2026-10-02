import { createHash, timingSafeEqual } from "crypto";
import { eventToDbInsert, mapEvent } from "@/lib/events/db/mappers";
import { generateFindSeatCode, normalizeFindSeatCode } from "@/lib/events/find-seat-code";
import type { EventFormData, EventPublicInfo, ManagedEvent, SheetsSyncMode } from "@/lib/events/types";
import type { EventType } from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type EventRow = Tables<"events">;
type NeonEventRow = { row: EventRow };
type NeonClientNameRow = { id: string; client_name: string };

function accessCodesMatch(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function isFindSeatCompatibilitySchemaError(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    message.includes("find_seat_previous_code") ||
    message.includes("find_seat_previous_code_valid_until")
  );
}

async function enrichEventsWithClientNames(rows: EventRow[]): Promise<ManagedEvent[]> {
  if (!rows.length) return [];
  const clientIds = [...new Set(rows.map((row) => row.client_id).filter((id): id is string => Boolean(id)))];
  const clientNames = new Map<string, string>();
  if (clientIds.length) {
    const result = await neonQuery<NeonClientNameRow>(
      `SELECT id, client_name FROM public.clients WHERE id = ANY($1::uuid[])`,
      [clientIds],
    );
    for (const client of result.rows) clientNames.set(client.id, client.client_name);
  }
  return rows.map((row) =>
    mapEvent(row, row.client_id ? clientNames.get(row.client_id) ?? null : null),
  );
}

async function listEventsFromNeon(includeArchived: boolean): Promise<ManagedEvent[]> {
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row
     FROM public.events e
     ${includeArchived ? "" : "WHERE e.is_active = true"}
     ORDER BY e.date DESC NULLS LAST`,
  );
  return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
}

export function listEvents(): Promise<ManagedEvent[]> {
  return listEventsFromNeon(false);
}

export function listAllEvents(): Promise<ManagedEvent[]> {
  return listEventsFromNeon(true);
}

export async function listEventsByClientId(clientId: string): Promise<ManagedEvent[]> {
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row
     FROM public.events e
     WHERE e.client_id = $1
     ORDER BY e.date DESC NULLS LAST`,
    [clientId],
  );
  return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
}

export async function getEventById(id: string): Promise<ManagedEvent | null> {
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row FROM public.events e WHERE e.id = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  if (!row) return null;
  const [event] = await enrichEventsWithClientNames([row]);
  return event ?? null;
}

export async function ensureFindSeatCodeForEvent(eventId: string): Promise<ManagedEvent> {
  const existing = await getEventById(eventId);
  if (!existing) throw new Error("Evento não encontrado.");
  if (normalizeFindSeatCode(existing.findSeatCode ?? "")) return existing;

  const result = await neonQuery<NeonEventRow>(
    `WITH saved AS (
       UPDATE public.events
       SET find_seat_code = $2
       WHERE id = $1 AND find_seat_code = ''
       RETURNING *
     ) SELECT to_jsonb(saved) AS row FROM saved`,
    [eventId, generateFindSeatCode(existing.name)],
  );
  const row = result.rows[0]?.row;
  if (!row) {
    const refreshed = await getEventById(eventId);
    if (!refreshed) throw new Error("Evento não encontrado.");
    return refreshed;
  }
  const [event] = await enrichEventsWithClientNames([row]);
  if (!event) throw new Error("Falha ao gravar código Find Your Seat.");
  return event;
}

export async function createEvent(data: EventFormData): Promise<ManagedEvent> {
  const payload = eventToDbInsert(data);
  const result = await neonQuery<NeonEventRow>(
    `WITH saved AS (
       INSERT INTO public.events (
         business_id, client_id, name, type, date, location, notes, find_seat_code
       ) VALUES ($1, $2, $3, $4::public.event_type, $5, $6, $7, $8)
       RETURNING *
     ) SELECT to_jsonb(saved) AS row FROM saved`,
    [
      payload.business_id,
      payload.client_id,
      payload.name,
      payload.type,
      payload.date,
      payload.location,
      payload.notes,
      payload.find_seat_code,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar evento.");
  const [event] = await enrichEventsWithClientNames([row]);
  if (!event) throw new Error("Falha ao criar evento.");
  return event;
}

export async function updateEvent(id: string, data: EventFormData): Promise<ManagedEvent> {
  const payload = eventToDbInsert(data, id);
  const values = [
    id,
    payload.business_id,
    payload.client_id,
    payload.name,
    payload.type,
    payload.date,
    payload.location,
    payload.notes,
  ];
  const result = payload.find_seat_code
    ? await neonQuery<NeonEventRow>(
        `WITH saved AS (
           UPDATE public.events SET
             business_id = $2, client_id = $3, name = $4,
             type = $5::public.event_type, date = $6, location = $7,
             notes = $8, find_seat_code = $9
           WHERE id = $1 RETURNING *
         ) SELECT to_jsonb(saved) AS row FROM saved`,
        [...values, payload.find_seat_code],
      )
    : await neonQuery<NeonEventRow>(
        `WITH saved AS (
           UPDATE public.events SET
             business_id = $2, client_id = $3, name = $4,
             type = $5::public.event_type, date = $6, location = $7, notes = $8
           WHERE id = $1 RETURNING *
         ) SELECT to_jsonb(saved) AS row FROM saved`,
        values,
      );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Evento não encontrado.");
  const [event] = await enrichEventsWithClientNames([row]);
  if (!event) throw new Error("Evento não encontrado.");
  return event;
}

export async function verifyFindSeatAccess(
  eventId: string,
  accessCode: string,
): Promise<EventPublicInfo | null> {
  const normalizedCode = normalizeFindSeatCode(accessCode);
  if (normalizedCode.length < 4) return null;
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row
     FROM public.events e
     WHERE e.id = $1 AND e.is_active = true
     LIMIT 1`,
    [eventId],
  );
  const row = result.rows[0]?.row;
  if (!row) return null;
  const storedCode = normalizeFindSeatCode(row.find_seat_code ?? "");
  const previousCode = normalizeFindSeatCode(row.find_seat_previous_code ?? "");
  const previousStillValid =
    Boolean(previousCode) &&
    Boolean(row.find_seat_previous_code_valid_until) &&
    new Date(row.find_seat_previous_code_valid_until ?? "").getTime() > Date.now();
  const currentMatches = Boolean(storedCode) && accessCodesMatch(storedCode, normalizedCode);
  const previousMatches = previousStillValid && accessCodesMatch(previousCode, normalizedCode);
  if (!currentMatches && !previousMatches) return null;
  return { id: row.id, name: row.name, type: row.type as EventType, date: row.date, location: row.location };
}

export async function getEventPublicInfo(id: string): Promise<EventPublicInfo | null> {
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row
     FROM public.events e
     WHERE e.id = $1 AND e.is_active = true
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  return row
    ? { id: row.id, name: row.name, type: row.type as EventType, date: row.date, location: row.location }
    : null;
}

export async function archiveEvent(id: string): Promise<void> {
  await neonQuery("UPDATE public.events SET is_active = false WHERE id = $1", [id]);
}

export async function deleteEvent(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.events WHERE id = $1", [id]);
}

export async function updateEventSheetConnection(
  eventId: string,
  googleSheetUrl: string,
  googleSheetGid: string,
  sheetsSyncMode?: SheetsSyncMode,
): Promise<ManagedEvent> {
  const result = await neonQuery<NeonEventRow>(
    `WITH saved AS (
       UPDATE public.events
       SET google_sheet_url = $2,
           google_sheet_gid = $3,
           sheets_sync_mode = COALESCE($4::public.sheets_sync_mode, sheets_sync_mode)
       WHERE id = $1 RETURNING *
     ) SELECT to_jsonb(saved) AS row FROM saved`,
    [eventId, googleSheetUrl.trim(), googleSheetGid.trim() || "0", sheetsSyncMode ?? null],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Evento não encontrado.");
  const [event] = await enrichEventsWithClientNames([row]);
  if (!event) throw new Error("Evento não encontrado.");
  return event;
}

export async function recordSheetSync(
  eventId: string,
  syncedAt: string,
  summary: string,
): Promise<void> {
  await neonQuery(
    `UPDATE public.events
     SET sheets_last_synced_at = $2, sheets_sync_summary = $3
     WHERE id = $1`,
    [eventId, syncedAt, summary],
  );
}

export async function listEventsPendingPostEventReport(
  limit = 20,
): Promise<ManagedEvent[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await neonQuery<NeonEventRow>(
    `SELECT to_jsonb(e) AS row
     FROM public.events e
     WHERE e.date IS NOT NULL
       AND e.date < $1::timestamptz::date
       AND e.post_event_report_sent_at IS NULL
       AND e.client_id IS NOT NULL
     ORDER BY e.date ASC
     LIMIT $2`,
    [cutoff, limit],
  );
  return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
}

export async function markPostEventReportSent(eventId: string): Promise<void> {
  await neonQuery(
    "UPDATE public.events SET post_event_report_sent_at = now() WHERE id = $1",
    [eventId],
  );
}
