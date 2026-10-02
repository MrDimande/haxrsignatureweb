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
import type {
  LedgerAction,
  SheetSyncLedgerRow,
  UpsertImportRowInput,
  UpsertLedgerActionInput,
} from "@/lib/events/sheets/sync-ledger.neon.repository";

export type {
  LedgerAction,
  SheetSyncLedgerRow,
  UpsertImportRowInput,
  UpsertLedgerActionInput,
} from "@/lib/events/sheets/sync-ledger.neon.repository";

export function upsertImportRow(input: UpsertImportRowInput): Promise<void> {
  return upsertImportRowNeon(input);
}

export function getLedgerById(
  ledgerId: string,
): Promise<SheetSyncLedgerRow | null> {
  return getLedgerByIdNeon(ledgerId);
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
  return updateLedgerByIdNeon(ledgerId, patch);
}

export function getLedgerByFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<SheetSyncLedgerRow | null> {
  return getLedgerByFingerprintNeon(eventId, source, rowFingerprint);
}

export function upsertLedgerAction(
  input: UpsertLedgerActionInput,
): Promise<SheetSyncLedgerRow> {
  return upsertLedgerActionNeon(input);
}

export function markLedgerSeen(ledgerId: string): Promise<void> {
  return markLedgerSeenNeon(ledgerId);
}

export function getExistingGuestIdForFingerprint(
  eventId: string,
  source: SheetImportSource,
  rowFingerprint: string,
): Promise<string | null> {
  return getExistingGuestIdForFingerprintNeon(eventId, source, rowFingerprint);
}
