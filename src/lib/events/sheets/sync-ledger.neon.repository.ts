import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
import type { SheetImportSource, NormalizedSheetRowIdentity } from "@/lib/events/sheets/fingerprint";
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

type LedgerJsonRow = { row: SheetSyncLedgerRow };

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function upsertImportRow(
  input: UpsertImportRowInput,
): Promise<void> {
  await neonQuery(
    `
      INSERT INTO public.event_sheet_import_rows (
        event_id, source, source_url, source_gid, source_file_name,
        source_row_number, row_fingerprint, row_payload,
        normalized_email, normalized_phone, normalized_name,
        sync_batch_id, first_seen_at, last_seen_at
      )
      VALUES (
        $1::uuid, $2, $3, $4, $5, $6::int, $7, $8::jsonb,
        $9, $10, $11, $12::uuid, now(), now()
      )
      ON CONFLICT (event_id, source, row_fingerprint)
      DO UPDATE SET
        source_url = EXCLUDED.source_url,
        source_gid = EXCLUDED.source_gid,
        source_file_name = EXCLUDED.source_file_name,
        source_row_number = EXCLUDED.source_row_number,
        row_payload = EXCLUDED.row_payload,
        normalized_email = EXCLUDED.normalized_email,
        normalized_phone = EXCLUDED.normalized_phone,
        normalized_name = EXCLUDED.normalized_name,
        sync_batch_id = EXCLUDED.sync_batch_id,
        last_seen_at = EXCLUDED.last_seen_at
    `,
    [
      input.eventId,
      input.source,
      input.sourceUrl ?? null,
      input.sourceGid ?? null,
      input.sourceFileName ?? null,
      input.sourceRowNumber ?? null,
      input.rowFingerprint,
      JSON.stringify(input.rowPayload),
      nullable(input.normalized.normalizedEmail),
      nullable(input.normalized.normalizedPhone),
      nullable(input.normalized.normalizedName),
      input.syncBatchId,
    ],
  );
}

export async function getLedgerById(
  ledgerId: string,
): Promise<SheetSyncLedgerRow | null> {
  const result = await neonQuery<LedgerJsonRow>(
    `SELECT to_jsonb(l) AS row
     FROM public.event_sheet_sync_ledger l
     WHERE l.id = $1::uuid
     LIMIT 1`,
    [ledgerId],
  );
  return result.rows[0]?.row ?? null;
}

export async function updateLedgerById(
  ledgerId: string,
  patch: {
    guestId?: string | null;
    action?: LedgerAction;
    reason?: string | null;
    rowPayload?: SheetGuestRow | null;
  },
): Promise<SheetSyncLedgerRow> {
  const sets = ["last_seen_at = now()"];
  const values: unknown[] = [ledgerId];

  if (patch.guestId !== undefined) {
    values.push(patch.guestId);
    sets.push(`guest_id = $${values.length}::uuid`);
  }
  if (patch.action !== undefined) {
    values.push(patch.action);
    sets.push(`action = $${values.length}`);
  }
  if (patch.reason !== undefined) {
    values.push(patch.reason);
    sets.push(`reason = $${values.length}`);
  }
  if (patch.rowPayload !== undefined) {
    values.push(patch.rowPayload === null ? null : JSON.stringify(patch.rowPayload));
    sets.push(`row_payload = $${values.length}::jsonb`);
  }

  const result = await neonQuery<LedgerJsonRow>(
    `
      WITH saved AS (
        UPDATE public.event_sheet_sync_ledger
        SET ${sets.join(", ")}
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    values,
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("[sync-ledger] updateLedgerById: no row returned");
  return row;
}

export async function getLedgerByFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<SheetSyncLedgerRow | null> {
  const result = await neonQuery<LedgerJsonRow>(
    `
      SELECT to_jsonb(l) AS row
      FROM public.event_sheet_sync_ledger l
      WHERE l.event_id = $1::uuid
        AND l.source = $2
        AND l.row_fingerprint = $3
      LIMIT 1
    `,
    [eventId, source, rowFingerprint],
  );
  return result.rows[0]?.row ?? null;
}

export async function upsertLedgerAction(
  input: UpsertLedgerActionInput,
): Promise<SheetSyncLedgerRow> {
  const result = await neonQuery<LedgerJsonRow>(
    `
      WITH saved AS (
        INSERT INTO public.event_sheet_sync_ledger (
          event_id, source, row_fingerprint, guest_id, action, reason,
          sync_batch_id, row_payload, created_at, updated_at, last_seen_at
        )
        VALUES (
          $1::uuid, $2, $3, $4::uuid, $5, $6,
          $7::uuid, $8::jsonb, now(), now(), now()
        )
        ON CONFLICT (event_id, source, row_fingerprint)
        DO UPDATE SET
          guest_id = EXCLUDED.guest_id,
          action = EXCLUDED.action,
          reason = EXCLUDED.reason,
          sync_batch_id = EXCLUDED.sync_batch_id,
          row_payload = EXCLUDED.row_payload,
          last_seen_at = EXCLUDED.last_seen_at
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.eventId,
      input.source,
      input.rowFingerprint,
      input.guestId ?? null,
      input.action,
      input.reason ?? null,
      input.syncBatchId,
      input.rowPayload === undefined || input.rowPayload === null
        ? null
        : JSON.stringify(input.rowPayload),
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("[sync-ledger] upsertLedgerAction: no row returned");
  return row;
}

export async function markLedgerSeen(ledgerId: string): Promise<void> {
  await neonQuery(
    `UPDATE public.event_sheet_sync_ledger
     SET last_seen_at = now()
     WHERE id = $1::uuid`,
    [ledgerId],
  );
}

export async function getExistingGuestIdForFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<string | null> {
  const ledger = await getLedgerByFingerprint(eventId, source, rowFingerprint);
  return ledger?.guest_id ?? null;
}
