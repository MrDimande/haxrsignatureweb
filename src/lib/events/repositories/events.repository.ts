import { createHash, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { eventToDbInsert, mapEvent } from "@/lib/events/db/mappers";
import {
  generateFindSeatCode,
  normalizeFindSeatCode,
} from "@/lib/events/find-seat-code";
import type {
  EventFormData,
  EventPublicInfo,
  ManagedEvent,
  SheetsSyncMode,
} from "@/lib/events/types";
import type { EventType } from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
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

async function enrichEventsWithClientNames(
  rows: EventRow[],
): Promise<ManagedEvent[]> {
  if (!rows.length) return [];

  const clientIds = [
    ...new Set(
      rows.map((row) => row.client_id).filter((id): id is string => Boolean(id)),
    ),
  ];

  const clientNames = new Map<string, string>();
  if (clientIds.length) {
    if (shouldUseNeonServerDatabase()) {
      const result = await neonQuery<NeonClientNameRow>(
        `
          SELECT id, client_name
          FROM public.clients
          WHERE id = ANY($1::uuid[])
        `,
        [clientIds],
      );

      for (const client of result.rows) {
        clientNames.set(client.id, client.client_name);
      }
    } else {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_name")
        .in("id", clientIds);

      if (error) throw new Error(error.message);
      for (const client of asTableRows<"clients">(data)) {
        clientNames.set(client.id, client.client_name);
      }
    }
  }

  return rows.map((row) =>
    mapEvent(row, row.client_id ? clientNames.get(row.client_id) ?? null : null),
  );
}

async function listEventsFromNeon(includeArchived: boolean): Promise<ManagedEvent[]> {
  const result = await neonQuery<NeonEventRow>(`
    SELECT to_jsonb(e) AS row
    FROM public.events e
    ${includeArchived ? "" : "WHERE e.is_active = true"}
    ORDER BY e.date DESC NULLS LAST
  `);

  return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
}

export async function listEvents(): Promise<ManagedEvent[]> {
  if (shouldUseNeonServerDatabase()) {
    return listEventsFromNeon(false);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return enrichEventsWithClientNames(asTableRows<"events">(data));
}

/** Inclui eventos arquivados — usado no dashboard e agrupamento por pipeline. */
export async function listAllEvents(): Promise<ManagedEvent[]> {
  if (shouldUseNeonServerDatabase()) {
    return listEventsFromNeon(true);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return enrichEventsWithClientNames(asTableRows<"events">(data));
}

export async function listEventsByClientId(
  clientId: string,
): Promise<ManagedEvent[]> {
  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        SELECT to_jsonb(e) AS row
        FROM public.events e
        WHERE e.client_id = $1
        ORDER BY e.date DESC NULLS LAST
      `,
      [clientId],
    );
    return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return enrichEventsWithClientNames(asTableRows<"events">(data));
}

export async function getEventById(id: string): Promise<ManagedEvent | null> {
  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        SELECT to_jsonb(e) AS row
        FROM public.events e
        WHERE e.id = $1
        LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0]?.row;
    if (!row) return null;
    const [event] = await enrichEventsWithClientNames([row]);
    return event ?? null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(data);
  if (!row) return null;
  const [event] = await enrichEventsWithClientNames([row]);
  return event ?? null;
}

/**
 * Garante find_seat_code no fluxo oficial Admin.
 * Não preenche ad hoc em produção via SQL — use esta função (autorizada).
 * Idempotente: se já existir código válido, devolve sem alterar.
 */
export async function ensureFindSeatCodeForEvent(
  eventId: string,
): Promise<ManagedEvent> {
  const existing = await getEventById(eventId);
  if (!existing) throw new Error("Evento não encontrado.");

  const current = normalizeFindSeatCode(existing.findSeatCode ?? "");
  if (current) return existing;

  const generated = generateFindSeatCode(existing.name);

  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        WITH saved AS (
          UPDATE public.events
          SET find_seat_code = $2
          WHERE id = $1
            AND find_seat_code = ''
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row
        FROM saved
      `,
      [eventId, generated],
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .update({ find_seat_code: generated } as never)
    .eq("id", eventId)
    .eq("find_seat_code", "")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const refreshed = await getEventById(eventId);
    if (!refreshed) throw new Error("Evento não encontrado.");
    return refreshed;
  }

  const [event] = await enrichEventsWithClientNames([
    asTableRow<"events">(data)!,
  ]);
  if (!event) throw new Error("Falha ao gravar código Find Your Seat.");
  return event;
}

export async function createEvent(data: EventFormData): Promise<ManagedEvent> {
  if (shouldUseNeonServerDatabase()) {
    const payload = eventToDbInsert(data);
    const result = await neonQuery<NeonEventRow>(
      `
        WITH saved AS (
          INSERT INTO public.events (
            business_id,
            client_id,
            name,
            type,
            date,
            location,
            notes,
            find_seat_code
          )
          VALUES ($1, $2, $3, $4::public.event_type, $5, $6, $7, $8)
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row
        FROM saved
      `,
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

  const supabase = createAdminClient();
  const { data: saved, error } = await supabase
    .from("events")
    .insert(eventToDbInsert(data) as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(saved);
  if (!row) throw new Error("Falha ao criar evento.");
  const [event] = await enrichEventsWithClientNames([row]);
  if (!event) throw new Error("Falha ao criar evento.");
  return event;
}

export async function updateEvent(
  id: string,
  data: EventFormData,
): Promise<ManagedEvent> {
  if (shouldUseNeonServerDatabase()) {
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
          `
            WITH saved AS (
              UPDATE public.events
              SET business_id = $2,
                  client_id = $3,
                  name = $4,
                  type = $5::public.event_type,
                  date = $6,
                  location = $7,
                  notes = $8,
                  find_seat_code = $9
              WHERE id = $1
              RETURNING *
            )
            SELECT to_jsonb(saved) AS row
            FROM saved
          `,
          [...values, payload.find_seat_code],
        )
      : await neonQuery<NeonEventRow>(
          `
            WITH saved AS (
              UPDATE public.events
              SET business_id = $2,
                  client_id = $3,
                  name = $4,
                  type = $5::public.event_type,
                  date = $6,
                  location = $7,
                  notes = $8
              WHERE id = $1
              RETURNING *
            )
            SELECT to_jsonb(saved) AS row
            FROM saved
          `,
          values,
        );

    const row = result.rows[0]?.row;
    if (!row) throw new Error("Evento não encontrado.");
    const [event] = await enrichEventsWithClientNames([row]);
    if (!event) throw new Error("Evento não encontrado.");
    return event;
  }

  const supabase = createAdminClient();
  const { data: saved, error } = await supabase
    .from("events")
    .update(eventToDbInsert(data, id) as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(saved);
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

  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        SELECT to_jsonb(e) AS row
        FROM public.events e
        WHERE e.id = $1
          AND e.is_active = true
        LIMIT 1
      `,
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
    const currentMatches =
      Boolean(storedCode) && accessCodesMatch(storedCode, normalizedCode);
    const previousMatches =
      previousStillValid && accessCodesMatch(previousCode, normalizedCode);

    if (!currentMatches && !previousMatches) return null;

    return {
      id: row.id,
      name: row.name,
      type: row.type as EventType,
      date: row.date,
      location: row.location,
    };
  }

  const supabase = createAdminClient();
  let { data, error } = await supabase
    .from("events")
    .select(
      "id, name, type, date, location, find_seat_code, find_seat_previous_code, find_seat_previous_code_valid_until",
    )
    .eq("id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (error && isFindSeatCompatibilitySchemaError(error)) {
    const fallback = await supabase
      .from("events")
      .select("id, name, type, date, location, find_seat_code")
      .eq("id", eventId)
      .eq("is_active", true)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(data);
  if (!row) return null;

  const storedCode = normalizeFindSeatCode(row.find_seat_code ?? "");
  const previousCode = normalizeFindSeatCode(
    ("find_seat_previous_code" in row ? row.find_seat_previous_code : null) ?? "",
  );
  const previousStillValid =
    Boolean(previousCode) &&
    "find_seat_previous_code_valid_until" in row &&
    Boolean(row.find_seat_previous_code_valid_until) &&
    new Date(row.find_seat_previous_code_valid_until ?? "").getTime() > Date.now();
  const currentMatches =
    Boolean(storedCode) && accessCodesMatch(storedCode, normalizedCode);
  const previousMatches =
    previousStillValid && accessCodesMatch(previousCode, normalizedCode);

  if (!currentMatches && !previousMatches) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type as EventType,
    date: row.date,
    location: row.location,
  };
}

export async function getEventPublicInfo(
  id: string,
): Promise<EventPublicInfo | null> {
  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        SELECT to_jsonb(e) AS row
        FROM public.events e
        WHERE e.id = $1
          AND e.is_active = true
        LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0]?.row;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type as EventType,
      date: row.date,
      location: row.location,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, type, date, location")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(data);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type as EventType,
    date: row.date,
    location: row.location,
  };
}

export async function archiveEvent(id: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await neonQuery("UPDATE public.events SET is_active = false WHERE id = $1", [id]);
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ is_active: false } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteEvent(id: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await neonQuery("DELETE FROM public.events WHERE id = $1", [id]);
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateEventSheetConnection(
  eventId: string,
  googleSheetUrl: string,
  googleSheetGid: string,
  sheetsSyncMode?: SheetsSyncMode,
): Promise<ManagedEvent> {
  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        WITH saved AS (
          UPDATE public.events
          SET google_sheet_url = $2,
              google_sheet_gid = $3,
              sheets_sync_mode = COALESCE($4::public.sheets_sync_mode, sheets_sync_mode)
          WHERE id = $1
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row
        FROM saved
      `,
      [
        eventId,
        googleSheetUrl.trim(),
        googleSheetGid.trim() || "0",
        sheetsSyncMode ?? null,
      ],
    );

    const row = result.rows[0]?.row;
    if (!row) throw new Error("Evento não encontrado.");
    const [event] = await enrichEventsWithClientNames([row]);
    if (!event) throw new Error("Evento não encontrado.");
    return event;
  }

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    google_sheet_url: googleSheetUrl.trim(),
    google_sheet_gid: googleSheetGid.trim() || "0",
  };

  if (sheetsSyncMode) {
    payload.sheets_sync_mode = sheetsSyncMode;
  }

  const { data, error } = await supabase
    .from("events")
    .update(payload as never)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"events">(data);
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
  if (shouldUseNeonServerDatabase()) {
    await neonQuery(
      `
        UPDATE public.events
        SET sheets_last_synced_at = $2,
            sheets_sync_summary = $3
        WHERE id = $1
      `,
      [eventId, syncedAt, summary],
    );
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({
      sheets_last_synced_at: syncedAt,
      sheets_sync_summary: summary,
    } as never)
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

/** Eventos com data passada há ≥1 dia, sem relatório enviado. */
export async function listEventsPendingPostEventReport(
  limit = 20,
): Promise<ManagedEvent[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonEventRow>(
      `
        SELECT to_jsonb(e) AS row
        FROM public.events e
        WHERE e.date IS NOT NULL
          AND e.date < $1::timestamptz::date
          AND e.post_event_report_sent_at IS NULL
          AND e.client_id IS NOT NULL
        ORDER BY e.date ASC
        LIMIT $2
      `,
      [cutoff, limit],
    );

    return enrichEventsWithClientNames(result.rows.map(({ row }) => row));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .not("date", "is", null)
    .lt("date", cutoff)
    .is("post_event_report_sent_at", null)
    .not("client_id", "is", null)
    .order("date", { ascending: true })
    .limit(limit);

  if (error) {
    if (error.message.includes("post_event_report_sent_at")) return [];
    throw new Error(error.message);
  }

  return enrichEventsWithClientNames(asTableRows<"events">(data));
}

export async function markPostEventReportSent(eventId: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await neonQuery(
      "UPDATE public.events SET post_event_report_sent_at = now() WHERE id = $1",
      [eventId],
    );
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ post_event_report_sent_at: new Date().toISOString() } as never)
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}
