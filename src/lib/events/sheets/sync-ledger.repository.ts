import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type { SheetImportSource } from "@/lib/events/sheets/fingerprint";
import type { SheetGuestRow } from "@/lib/events/sheets/types";
import {
  getExistingGuestIdForFingerprint as getExistingGuestIdForFingerprintNeon,
  getLedgerByFingerprint as getLedgerByFingerprintNeon,
  getLedgerById as getLedgerByIdNeon,
  markLedgerSeen as markLedgerSeenNeon,
  updateLedgerById as updateLedgerByIdNeon,
  upsertImportRow as upsertImportRowNeon,
  upsertLedgerAction as upsertLedgerActionNeon,
} from "@/lib/events/sheets/sync-ledger.neon.repository";
import {
  getExistingGuestIdForFingerprint as getExistingGuestIdForFingerprintSupabase,
  getLedgerByFingerprint as getLedgerByFingerprintSupabase,
  getLedgerById as getLedgerByIdSupabase,
  markLedgerSeen as markLedgerSeenSupabase,
  updateLedgerById as updateLedgerByIdSupabase,
  upsertImportRow as upsertImportRowSupabase,
  upsertLedgerAction as upsertLedgerActionSupabase,
} from "@/lib/events/sheets/sync-ledger.supabase.repository";
import type {
  LedgerAction,
  SheetSyncLedgerRow,
  UpsertImportRowInput,
  UpsertLedgerActionInput,
} from "@/lib/events/sheets/sync-ledger.supabase.repository";

export type {
  LedgerAction,
  SheetSyncLedgerRow,
  UpsertImportRowInput,
  UpsertLedgerActionInput,
} from "@/lib/events/sheets/sync-ledger.supabase.repository";

export function upsertImportRow(input: UpsertImportRowInput): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? upsertImportRowNeon(input)
    : upsertImportRowSupabase(input);
}

export function getLedgerById(
  ledgerId: string,
): Promise<SheetSyncLedgerRow | null> {
  return shouldUseNeonServerDatabase()
    ? getLedgerByIdNeon(ledgerId)
    : getLedgerByIdSupabase(ledgerId);
}

export function updateLedgerById(
  ledgerId: string,
  patch: {
    guestId?: string | null;
    action?: LedgerAction;
    reason?: string | null;
    rowPayload?: SheetGuestRow | null;
  },
): Promise<SheetSyncLedgerRow> {
  return shouldUseNeonServerDatabase()
    ? updateLedgerByIdNeon(ledgerId, patch)
    : updateLedgerByIdSupabase(ledgerId, patch);
}

export function getLedgerByFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<SheetSyncLedgerRow | null> {
  return shouldUseNeonServerDatabase()
    ? getLedgerByFingerprintNeon(eventId, source, rowFingerprint)
    : getLedgerByFingerprintSupabase(eventId, source, rowFingerprint);
}

export function upsertLedgerAction(
  input: UpsertLedgerActionInput,
): Promise<SheetSyncLedgerRow> {
  return shouldUseNeonServerDatabase()
    ? upsertLedgerActionNeon(input)
    : upsertLedgerActionSupabase(input);
}

export function markLedgerSeen(ledgerId: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? markLedgerSeenNeon(ledgerId)
    : markLedgerSeenSupabase(ledgerId);
}

export function getExistingGuestIdForFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<string | null> {
  return shouldUseNeonServerDatabase()
    ? getExistingGuestIdForFingerprintNeon(eventId, source, rowFingerprint)
    : getExistingGuestIdForFingerprintSupabase(eventId, source, rowFingerprint);
}
