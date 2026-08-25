import type {
  GuestImportBatch,
  GuestImportBatchStatus,
} from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  createImportBatch as createImportBatchNeon,
  getBulkAuditById as getBulkAuditByIdNeon,
  getImportBatchById as getImportBatchByIdNeon,
  insertBulkAudit as insertBulkAuditNeon,
  listImportBatchesByEvent as listImportBatchesByEventNeon,
  markBulkAuditUndone as markBulkAuditUndoneNeon,
  removeImportBatchAtomic as removeImportBatchAtomicNeon,
  undoImportBatchRemovalAtomic as undoImportBatchRemovalAtomicNeon,
  updateImportBatchTotals as updateImportBatchTotalsNeon,
} from "@/lib/events/repositories/guest-import-batches.neon.repository";
import {
  createImportBatch as createImportBatchSupabase,
  getBulkAuditById as getBulkAuditByIdSupabase,
  getImportBatchById as getImportBatchByIdSupabase,
  insertBulkAudit as insertBulkAuditSupabase,
  listImportBatchesByEvent as listImportBatchesByEventSupabase,
  markBulkAuditUndone as markBulkAuditUndoneSupabase,
  removeImportBatchAtomic as removeImportBatchAtomicSupabase,
  undoImportBatchRemovalAtomic as undoImportBatchRemovalAtomicSupabase,
  updateImportBatchTotals as updateImportBatchTotalsSupabase,
} from "@/lib/events/repositories/guest-import-batches.supabase.repository";
import type {
  CreateImportBatchInput,
  RemoveImportBatchResult,
  UndoImportBatchRemovalResult,
} from "@/lib/events/repositories/guest-import-batches.supabase.repository";

export type {
  CreateImportBatchInput,
  RemoveImportBatchResult,
  UndoImportBatchRemovalResult,
} from "@/lib/events/repositories/guest-import-batches.supabase.repository";

export function createImportBatch(
  input: CreateImportBatchInput,
): Promise<GuestImportBatch> {
  return shouldUseNeonServerDatabase()
    ? createImportBatchNeon(input)
    : createImportBatchSupabase(input);
}

export function listImportBatchesByEvent(
  eventId: string,
): Promise<GuestImportBatch[]> {
  return shouldUseNeonServerDatabase()
    ? listImportBatchesByEventNeon(eventId)
    : listImportBatchesByEventSupabase(eventId);
}

export function getImportBatchById(
  batchId: string,
): Promise<GuestImportBatch | null> {
  return shouldUseNeonServerDatabase()
    ? getImportBatchByIdNeon(batchId)
    : getImportBatchByIdSupabase(batchId);
}

export function updateImportBatchTotals(
  batchId: string,
  eventId: string,
  patch: Partial<{
    removedRows: number;
    status: GuestImportBatchStatus;
  }>,
): Promise<GuestImportBatch> {
  return shouldUseNeonServerDatabase()
    ? updateImportBatchTotalsNeon(batchId, eventId, patch)
    : updateImportBatchTotalsSupabase(batchId, eventId, patch);
}

export function insertBulkAudit(
  input: Parameters<typeof insertBulkAuditSupabase>[0],
): Promise<string> {
  return shouldUseNeonServerDatabase()
    ? insertBulkAuditNeon(input)
    : insertBulkAuditSupabase(input);
}

export function getBulkAuditById(auditId: string, eventId: string) {
  return shouldUseNeonServerDatabase()
    ? getBulkAuditByIdNeon(auditId, eventId)
    : getBulkAuditByIdSupabase(auditId, eventId);
}

export function markBulkAuditUndone(
  auditId: string,
  eventId: string,
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? markBulkAuditUndoneNeon(auditId, eventId)
    : markBulkAuditUndoneSupabase(auditId, eventId);
}

export function removeImportBatchAtomic(
  eventId: string,
  batchId: string,
  operatorEmail: string,
): Promise<RemoveImportBatchResult> {
  return shouldUseNeonServerDatabase()
    ? removeImportBatchAtomicNeon(eventId, batchId, operatorEmail)
    : removeImportBatchAtomicSupabase(eventId, batchId, operatorEmail);
}

export function undoImportBatchRemovalAtomic(
  eventId: string,
  auditId: string,
  operatorEmail: string,
): Promise<UndoImportBatchRemovalResult> {
  return shouldUseNeonServerDatabase()
    ? undoImportBatchRemovalAtomicNeon(eventId, auditId, operatorEmail)
    : undoImportBatchRemovalAtomicSupabase(eventId, auditId, operatorEmail);
}
