import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { eventToDbInsert, mapEvent } from "@/lib/events/db/mappers";
import type { EventFormData, EventPublicInfo, ManagedEvent, SheetsSyncMode } from "@/lib/events/types";
import type { EventType } from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";

async function enrichEventsWithClientNames(
  rows: Tables<"events">[]
): Promise<ManagedEvent[]> {
  if (!rows.length) return [];

  const clientIds = [
    ...new Set(rows.map((row) => row.client_id).filter((id): id is string => Boolean(id))),
  ];

  const clientNames = new Map<string, string>();
  if (clientIds.length) {
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

  return rows.map((row) =>
    mapEvent(row, row.client_id ? clientNames.get(row.client_id) ?? null : null)
  );
}

export async function listEvents(): Promise<ManagedEvent[]> {
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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return enrichEventsWithClientNames(asTableRows<"events">(data));
}

export async function listEventsByClientId(
  clientId: string
): Promise<ManagedEvent[]> {
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

export async function createEvent(data: EventFormData): Promise<ManagedEvent> {
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
  data: EventFormData
): Promise<ManagedEvent> {
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

export async function getEventPublicInfo(
  id: string
): Promise<EventPublicInfo | null> {
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
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ is_active: false } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateEventSheetConnection(
  eventId: string,
  googleSheetUrl: string,
  googleSheetGid: string,
  sheetsSyncMode?: SheetsSyncMode
): Promise<ManagedEvent> {
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
  summary: string
): Promise<void> {
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
