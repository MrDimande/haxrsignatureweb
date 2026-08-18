import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type {
  GuestImportBatch,
  GuestImportBatchStatus,
} from "@/lib/events/types";

function mapBatch(row: {
  id: string;
  event_id: string;
  filename: string;
  created_at: string;
  updated_at: string;
  operator_user_id: string;
  operator_email: string;
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  invalid_rows: number;
  removed_rows: number;
  status: GuestImportBatchStatus;
}): GuestImportBatch {
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

export async function createImportBatch(
  input: CreateImportBatchInput
): Promise<GuestImportBatch> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_import_batches")
    .insert({
      event_id: input.eventId,
      filename: input.filename,
      operator_user_id: input.operatorUserId,
      operator_email: input.operatorEmail,
      total_rows: input.totalRows,
      valid_rows: input.validRows,
      duplicate_rows: input.duplicateRows,
      invalid_rows: input.invalidRows,
      removed_rows: input.removedRows ?? 0,
      status: input.status ?? "completed",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guest_import_batches">(data);
  if (!row) throw new Error("Falha ao criar lote de importação.");
  return mapBatch(row);
}

export async function listImportBatchesByEvent(
  eventId: string
): Promise<GuestImportBatch[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_import_batches")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const batches = asTableRows<"guest_import_batches">(data).map(mapBatch);

  // Fetch active removal audits to power the Undo functionality
  const { data: auditData, error: auditError } = await supabase
    .from("guest_bulk_audit")
    .select("id, batch_id, created_at")
    .eq("event_id", eventId)
    .eq("action", "remove_import_batch")
    .is("undone_at", null)
    .order("created_at", { ascending: false });

  if (auditError) {
    console.error("Failed to fetch bulk audits for import batches:", auditError);
  } else if (auditData) {
    for (const batch of batches) {
      if (batch.status === "removed") {
        const audit = (auditData as { id: string; batch_id: string; created_at: string }[]).find(a => a.batch_id === batch.id);
        if (audit) {
          batch.latestReversibleRemoval = {
            auditId: audit.id,
            createdAt: audit.created_at,
          };
        }
      }
    }
  }

  return batches;
}

export async function getImportBatchById(
  batchId: string
): Promise<GuestImportBatch | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_import_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guest_import_batches">(data);
  return row ? mapBatch(row) : null;
}

export async function updateImportBatchTotals(
  batchId: string,
  eventId: string,
  patch: Partial<{
    removedRows: number;
    status: GuestImportBatchStatus;
  }>
): Promise<GuestImportBatch> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.removedRows !== undefined) payload.removed_rows = patch.removedRows;
  if (patch.status !== undefined) payload.status = patch.status;

  const { data, error } = await supabase
    .from("guest_import_batches")
    .update(payload as never)
    .eq("id", batchId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guest_import_batches">(data);
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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_bulk_audit")
    .insert({
      event_id: input.eventId,
      batch_id: input.batchId ?? null,
      action: input.action,
      guest_ids: input.guestIds,
      operator_email: input.operatorEmail,
      impact: input.impact,
      undo_payload: input.undoPayload ?? null,
    } as never)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const id = (data as { id?: string } | null)?.id;
  if (!id) throw new Error("Falha ao registar auditoria em massa.");
  return id;
}

export async function getBulkAuditById(auditId: string, eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_bulk_audit")
    .select("*")
    .eq("id", auditId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return asTableRow<"guest_bulk_audit">(data);
}

export async function markBulkAuditUndone(
  auditId: string,
  eventId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("guest_bulk_audit")
    .update({ undone_at: new Date().toISOString() } as never)
    .eq("id", auditId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
}

/** Atomic batch removal via PostgreSQL RPC. */
export async function removeImportBatchAtomic(
  eventId: string,
  batchId: string,
  operatorEmail: string
): Promise<RemoveImportBatchResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("remove_guest_import_batch_atomic", {
    p_event_id: eventId,
    p_batch_id: batchId,
    p_operator_user_id: operatorEmail,
    p_operator_email: operatorEmail,
  } as never);

  if (error) throw new Error(error.message);
  return data as RemoveImportBatchResult;
}

/** Atomic batch removal undo via PostgreSQL RPC. */
export async function undoImportBatchRemovalAtomic(
  eventId: string,
  auditId: string,
  operatorEmail: string
): Promise<UndoImportBatchRemovalResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("undo_guest_import_batch_removal_atomic", {
    p_event_id: eventId,
    p_audit_id: auditId,
    p_operator_user_id: operatorEmail,
    p_operator_email: operatorEmail,
  } as never);

  if (error) throw new Error(error.message);
  return data as UndoImportBatchRemovalResult;
}
