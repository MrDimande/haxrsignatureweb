import type {
  GuestImportBatch,
  GuestImportBatchStatus,
} from "@/lib/events/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type ImportBatchRow = Tables<"guest_import_batches">;
type BulkAuditRow = Tables<"guest_bulk_audit">;
type BatchJsonRow = { row: ImportBatchRow };
type AuditJsonRow = { row: BulkAuditRow };
type AuditIdRow = { id: string };
type ActiveRemovalAuditRow = {
  id: string;
  batch_id: string | null;
  created_at: string;
};

export type CreateImportBatchInput = {
  eventId: string;
  filename: string;
  operatorUserId: string;
  operatorEmail: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  removedRows?: number;
  status?: GuestImportBatchStatus;
};

export type RemoveImportBatchResult = {
  success: boolean;
  batchId: string;
  removedGuestCount: number;
  alreadyRemovedCount: number;
  protectedCount: number;
  auditId: string;
  status: "removed";
};

export type UndoImportBatchRemovalResult = {
  success: boolean;
  batchId: string;
  restoredGuestCount: number;
  auditId: string;
  status: "completed";
};

function mapBatch(row: ImportBatchRow): GuestImportBatch {
  return {
    id: row.id,
    eventId: row.event_id,
    filename: row.filename,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    operatorUserId: row.operator_user_id,
    operatorEmail: row.operator_email,
    totalRows: row.total_rows,
    validRows: row.valid_rows,
    duplicateRows: row.duplicate_rows,
    invalidRows: row.invalid_rows,
    removedRows: row.removed_rows,
    status: row.status,
  };
}

export async function createImportBatch(
  input: CreateImportBatchInput,
): Promise<GuestImportBatch> {
  const result = await neonQuery<BatchJsonRow>(
    `
      WITH saved AS (
        INSERT INTO public.guest_import_batches (
          event_id,
          filename,
          operator_user_id,
          operator_email,
          total_rows,
          valid_rows,
          duplicate_rows,
          invalid_rows,
          removed_rows,
          status
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5::int,
          $6::int,
          $7::int,
          $8::int,
          $9::int,
          $10::public.guest_import_batch_status
        )
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.eventId,
      input.filename,
      input.operatorUserId,
      input.operatorEmail,
      input.totalRows,
      input.validRows,
      input.duplicateRows,
      input.invalidRows,
      input.removedRows ?? 0,
      input.status ?? "completed",
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar lote de importação.");
  return mapBatch(row);
}

export async function listImportBatchesByEvent(
  eventId: string,
): Promise<GuestImportBatch[]> {
  const [batchResult, auditResult] = await Promise.all([
    neonQuery<BatchJsonRow>(
      `
        SELECT to_jsonb(b) AS row
        FROM public.guest_import_batches b
        WHERE b.event_id = $1::uuid
        ORDER BY b.created_at DESC
      `,
      [eventId],
    ),
    neonQuery<ActiveRemovalAuditRow>(
      `
        SELECT id, batch_id, created_at
        FROM public.guest_bulk_audit
        WHERE event_id = $1::uuid
          AND action = 'remove_import_batch'
          AND undone_at IS NULL
        ORDER BY created_at DESC
      `,
      [eventId],
    ),
  ]);

  const batches = batchResult.rows.map(({ row }) => mapBatch(row));
  for (const batch of batches) {
    if (batch.status !== "removed") continue;
    const audit = auditResult.rows.find((item) => item.batch_id === batch.id);
    if (audit) {
      batch.latestReversibleRemoval = {
        auditId: audit.id,
        createdAt: audit.created_at,
      };
    }
  }

  return batches;
}

export async function getImportBatchById(
  batchId: string,
): Promise<GuestImportBatch | null> {
  const result = await neonQuery<BatchJsonRow>(
    `
      SELECT to_jsonb(b) AS row
      FROM public.guest_import_batches b
      WHERE b.id = $1::uuid
      LIMIT 1
    `,
    [batchId],
  );

  const row = result.rows[0]?.row;
  return row ? mapBatch(row) : null;
}

export async function updateImportBatchTotals(
  batchId: string,
  eventId: string,
  patch: Partial<{
    removedRows: number;
    status: GuestImportBatchStatus;
  }>,
): Promise<GuestImportBatch> {
  const result = await neonQuery<BatchJsonRow>(
    `
      WITH saved AS (
        UPDATE public.guest_import_batches
        SET removed_rows = COALESCE($3::int, removed_rows),
            status = COALESCE($4::public.guest_import_batch_status, status),
            updated_at = now()
        WHERE id = $1::uuid
          AND event_id = $2::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [batchId, eventId, patch.removedRows ?? null, patch.status ?? null],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Lote não encontrado.");
  return mapBatch(row);
}

export async function insertBulkAudit(input: {
  eventId: string;
  batchId?: string | null;
  action: string;
  guestIds: string[];
  operatorEmail: string;
  impact: Record<string, unknown>;
  undoPayload?: Record<string, unknown> | null;
}): Promise<string> {
  const result = await neonQuery<AuditIdRow>(
    `
      INSERT INTO public.guest_bulk_audit (
        event_id,
        batch_id,
        action,
        guest_ids,
        operator_email,
        impact,
        undo_payload
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        $4::uuid[],
        $5,
        $6::jsonb,
        $7::jsonb
      )
      RETURNING id
    `,
    [
      input.eventId,
      input.batchId ?? null,
      input.action,
      input.guestIds,
      input.operatorEmail,
      JSON.stringify(input.impact),
      input.undoPayload ? JSON.stringify(input.undoPayload) : null,
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) throw new Error("Falha ao registar auditoria em massa.");
  return id;
}

export async function getBulkAuditById(
  auditId: string,
  eventId: string,
): Promise<BulkAuditRow | null> {
  const result = await neonQuery<AuditJsonRow>(
    `
      SELECT to_jsonb(a) AS row
      FROM public.guest_bulk_audit a
      WHERE a.id = $1::uuid
        AND a.event_id = $2::uuid
      LIMIT 1
    `,
    [auditId, eventId],
  );
  return result.rows[0]?.row ?? null;
}

export async function markBulkAuditUndone(
  auditId: string,
  eventId: string,
): Promise<void> {
  await neonQuery(
    `
      UPDATE public.guest_bulk_audit
      SET undone_at = now()
      WHERE id = $1::uuid
        AND event_id = $2::uuid
    `,
    [auditId, eventId],
  );
}

export async function removeImportBatchAtomic(
  eventId: string,
  batchId: string,
  operatorEmail: string,
): Promise<RemoveImportBatchResult> {
  const result = await neonQuery<{ result: RemoveImportBatchResult }>(
    `
      SELECT public.remove_guest_import_batch_atomic(
        $1::uuid,
        $2::uuid,
        $3,
        $3
      ) AS result
    `,
    [eventId, batchId, operatorEmail],
  );

  const payload = result.rows[0]?.result;
  if (!payload) throw new Error("Falha ao remover lote de importação.");
  return payload;
}

export async function undoImportBatchRemovalAtomic(
  eventId: string,
  auditId: string,
  operatorEmail: string,
): Promise<UndoImportBatchRemovalResult> {
  const result = await neonQuery<{ result: UndoImportBatchRemovalResult }>(
    `
      SELECT public.undo_guest_import_batch_removal_atomic(
        $1::uuid,
        $2::uuid,
        $3,
        $3
      ) AS result
    `,
    [eventId, auditId, operatorEmail],
  );

  const payload = result.rows[0]?.result;
  if (!payload) throw new Error("Falha ao desfazer remoção do lote de importação.");
  return payload;
}
