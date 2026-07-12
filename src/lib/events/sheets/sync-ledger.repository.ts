import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow } from "@/lib/supabase/helpers";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type { SheetImportSource } from "@/lib/events/sheets/fingerprint";
import type { NormalizedSheetRowIdentity } from "@/lib/events/sheets/fingerprint";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export type LedgerAction =
  | "created"
  | "updated"
  | "matched"
  | "skipped"
  | "ignored"
  | "error";

export type SheetSyncLedgerRow = Tables<"event_sheet_sync_ledger">;

export type UpsertImportRowInput = {
  eventId: string;
  source: SheetImportSource;
  rowFingerprint: string;
  rowPayload: SheetGuestRow;
  normalized: NormalizedSheetRowIdentity;
  syncBatchId: string;
  sourceUrl?: string | null;
  sourceGid?: string | null;
  sourceFileName?: string | null;
  sourceRowNumber?: number | null;
};

export type UpsertLedgerActionInput = {
  eventId: string;
  source: SheetImportSource;
  rowFingerprint: string;
  guestId?: string | null;
  action: LedgerAction;
  reason?: string | null;
  syncBatchId: string;
  rowPayload?: SheetGuestRow | null;
};

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function upsertImportRow(
  input: UpsertImportRowInput
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: readError } = await supabase
    .from("event_sheet_import_rows")
    .select("id")
    .eq("event_id", input.eventId)
    .eq("source", input.source)
    .eq("row_fingerprint", input.rowFingerprint)
    .maybeSingle();

  if (readError) {
    throw new Error(`[sync-ledger] upsertImportRow read: ${readError.message}`);
  }

  const rowPayload = input.rowPayload as unknown as Json;
  const base = {
    event_id: input.eventId,
    source: input.source,
    source_url: input.sourceUrl ?? null,
    source_gid: input.sourceGid ?? null,
    source_file_name: input.sourceFileName ?? null,
    source_row_number: input.sourceRowNumber ?? null,
    row_fingerprint: input.rowFingerprint,
    row_payload: rowPayload,
    normalized_email: toNullableText(input.normalized.normalizedEmail),
    normalized_phone: toNullableText(input.normalized.normalizedPhone),
    normalized_name: toNullableText(input.normalized.normalizedName),
    sync_batch_id: input.syncBatchId,
    last_seen_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from("event_sheet_import_rows")
      .update(base as never)
      .eq("id", (existing as { id: string }).id);
    if (error) {
      throw new Error(`[sync-ledger] upsertImportRow update: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("event_sheet_import_rows").insert({
    ...base,
    first_seen_at: now,
  } as never);

  if (error) {
    throw new Error(`[sync-ledger] upsertImportRow insert: ${error.message}`);
  }
}

export async function getLedgerById(
  ledgerId: string
): Promise<SheetSyncLedgerRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_sheet_sync_ledger")
    .select("*")
    .eq("id", ledgerId)
    .maybeSingle();

  if (error) {
    throw new Error(`[sync-ledger] getLedgerById: ${error.message}`);
  }

  return asTableRow<"event_sheet_sync_ledger">(data);
}

export async function updateLedgerById(
  ledgerId: string,
  patch: {
    guestId?: string | null;
    action?: LedgerAction;
    reason?: string | null;
    rowPayload?: SheetGuestRow | null;
  }
): Promise<SheetSyncLedgerRow> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    updated_at: now,
    last_seen_at: now,
  };

  if (patch.guestId !== undefined) payload.guest_id = patch.guestId;
  if (patch.action !== undefined) payload.action = patch.action;
  if (patch.reason !== undefined) payload.reason = patch.reason;
  if (patch.rowPayload !== undefined) {
    payload.row_payload = (patch.rowPayload ?? null) as Json | null;
  }

  const { data, error } = await supabase
    .from("event_sheet_sync_ledger")
    .update(payload as never)
    .eq("id", ledgerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[sync-ledger] updateLedgerById: ${error.message}`);
  }

  const row = asTableRow<"event_sheet_sync_ledger">(data);
  if (!row) throw new Error("[sync-ledger] updateLedgerById: no row returned");
  return row;
}

export async function getLedgerByFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string
): Promise<SheetSyncLedgerRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_sheet_sync_ledger")
    .select("*")
    .eq("event_id", eventId)
    .eq("source", source)
    .eq("row_fingerprint", rowFingerprint)
    .maybeSingle();

  if (error) {
    throw new Error(`[sync-ledger] getLedgerByFingerprint: ${error.message}`);
  }

  return asTableRow<"event_sheet_sync_ledger">(data);
}

export async function upsertLedgerAction(
  input: UpsertLedgerActionInput
): Promise<SheetSyncLedgerRow> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const existing = await getLedgerByFingerprint(
    input.eventId,
    input.source,
    input.rowFingerprint
  );

  const payload = {
    event_id: input.eventId,
    source: input.source,
    row_fingerprint: input.rowFingerprint,
    guest_id: input.guestId ?? null,
    action: input.action,
    reason: input.reason ?? null,
    sync_batch_id: input.syncBatchId,
    row_payload: (input.rowPayload ?? null) as Json | null,
    last_seen_at: now,
    updated_at: now,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("event_sheet_sync_ledger")
      .update(payload as never)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`[sync-ledger] upsertLedgerAction update: ${error.message}`);
    }
    const row = asTableRow<"event_sheet_sync_ledger">(data);
    if (!row) throw new Error("[sync-ledger] upsertLedgerAction: no row returned");
    return row;
  }

  const { data, error } = await supabase
    .from("event_sheet_sync_ledger")
    .insert({
      ...payload,
      created_at: now,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[sync-ledger] upsertLedgerAction insert: ${error.message}`);
  }

  const row = asTableRow<"event_sheet_sync_ledger">(data);
  if (!row) throw new Error("[sync-ledger] upsertLedgerAction: no row returned");
  return row;
}

export async function markLedgerSeen(
  ledgerId: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("event_sheet_sync_ledger")
    .update({ last_seen_at: now } as never)
    .eq("id", ledgerId);

  if (error) {
    throw new Error(`[sync-ledger] markLedgerSeen: ${error.message}`);
  }
}

export async function getExistingGuestIdForFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string
): Promise<string | null> {
  const ledger = await getLedgerByFingerprint(eventId, source, rowFingerprint);
  return ledger?.guest_id ?? null;
}
