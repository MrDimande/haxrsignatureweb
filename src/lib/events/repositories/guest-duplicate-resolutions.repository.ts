import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type {
  DuplicateResolutionCandidate,
  DuplicateResolutionStatus,
} from "@/lib/events/duplicate-resolution-plan";
import type { EventGuest } from "@/lib/events/types";
import {
  createDuplicateResolution as createDuplicateResolutionNeon,
  findResolutionByEmailPhoneName as findResolutionByEmailPhoneNameNeon,
  findResolutionByFingerprint as findResolutionByFingerprintNeon,
  findResolutionCandidateForImport as findResolutionCandidateForImportNeon,
  findResolutionForImportRow as findResolutionForImportRowNeon,
  getDuplicateResolutionById as getDuplicateResolutionByIdNeon,
  listEventDuplicateResolutions as listEventDuplicateResolutionsNeon,
  markResolutionIgnored as markResolutionIgnoredNeon,
  recordManualMergeResolution as recordManualMergeResolutionNeon,
  updateDuplicateResolution as updateDuplicateResolutionNeon,
} from "@/lib/events/repositories/guest-duplicate-resolutions.neon.repository";
import {
  createDuplicateResolution as createDuplicateResolutionSupabase,
  findResolutionByEmailPhoneName as findResolutionByEmailPhoneNameSupabase,
  findResolutionByFingerprint as findResolutionByFingerprintSupabase,
  findResolutionCandidateForImport as findResolutionCandidateForImportSupabase,
  findResolutionForImportRow as findResolutionForImportRowSupabase,
  getDuplicateResolutionById as getDuplicateResolutionByIdSupabase,
  listEventDuplicateResolutions as listEventDuplicateResolutionsSupabase,
  markResolutionIgnored as markResolutionIgnoredSupabase,
  recordManualMergeResolution as recordManualMergeResolutionSupabase,
  updateDuplicateResolution as updateDuplicateResolutionSupabase,
} from "@/lib/events/repositories/guest-duplicate-resolutions.supabase.repository";
import type {
  CreateDuplicateResolutionInput,
  GuestDuplicateResolutionRow,
  ImportRowResolutionLookup,
} from "@/lib/events/repositories/guest-duplicate-resolutions.supabase.repository";

export type {
  CreateDuplicateResolutionInput,
  DuplicateResolutionSource,
  GuestDuplicateResolutionRow,
  ImportRowResolutionLookup,
  SheetImportSource,
} from "@/lib/events/repositories/guest-duplicate-resolutions.supabase.repository";

export {
  buildDuplicateFingerprintsForGuest,
} from "@/lib/events/repositories/guest-duplicate-resolutions.supabase.repository";

export function createDuplicateResolution(
  input: CreateDuplicateResolutionInput,
): Promise<GuestDuplicateResolutionRow> {
  return shouldUseNeonServerDatabase()
    ? createDuplicateResolutionNeon(input)
    : createDuplicateResolutionSupabase(input);
}

export function recordManualMergeResolution(
  eventId: string,
  primaryGuestId: string,
  secondary: EventGuest,
  resolvedBy = "admin",
): Promise<GuestDuplicateResolutionRow> {
  return shouldUseNeonServerDatabase()
    ? recordManualMergeResolutionNeon(eventId, primaryGuestId, secondary, resolvedBy)
    : recordManualMergeResolutionSupabase(eventId, primaryGuestId, secondary, resolvedBy);
}

export function findResolutionByFingerprint(
  eventId: string,
  fingerprint: string,
): Promise<GuestDuplicateResolutionRow | null> {
  return shouldUseNeonServerDatabase()
    ? findResolutionByFingerprintNeon(eventId, fingerprint)
    : findResolutionByFingerprintSupabase(eventId, fingerprint);
}

export function findResolutionByEmailPhoneName(
  eventId: string,
  input: {
    normalizedEmail: string;
    normalizedPhone: string;
    normalizedName: string;
  },
): Promise<GuestDuplicateResolutionRow | null> {
  return shouldUseNeonServerDatabase()
    ? findResolutionByEmailPhoneNameNeon(eventId, input)
    : findResolutionByEmailPhoneNameSupabase(eventId, input);
}

export function findResolutionForImportRow(
  input: ImportRowResolutionLookup,
): Promise<GuestDuplicateResolutionRow | null> {
  return shouldUseNeonServerDatabase()
    ? findResolutionForImportRowNeon(input)
    : findResolutionForImportRowSupabase(input);
}

export function getDuplicateResolutionById(
  resolutionId: string,
): Promise<GuestDuplicateResolutionRow | null> {
  return shouldUseNeonServerDatabase()
    ? getDuplicateResolutionByIdNeon(resolutionId)
    : getDuplicateResolutionByIdSupabase(resolutionId);
}

export function updateDuplicateResolution(
  resolutionId: string,
  patch: {
    resolutionStatus?: DuplicateResolutionStatus;
    primaryGuestId?: string;
    notes?: string | null;
    resolvedBy?: string | null;
  },
): Promise<GuestDuplicateResolutionRow> {
  return shouldUseNeonServerDatabase()
    ? updateDuplicateResolutionNeon(resolutionId, patch)
    : updateDuplicateResolutionSupabase(resolutionId, patch);
}

export function markResolutionIgnored(
  resolutionId: string,
  notes?: string | null,
): Promise<GuestDuplicateResolutionRow> {
  return shouldUseNeonServerDatabase()
    ? markResolutionIgnoredNeon(resolutionId, notes)
    : markResolutionIgnoredSupabase(resolutionId, notes);
}

export function listEventDuplicateResolutions(
  eventId: string,
): Promise<GuestDuplicateResolutionRow[]> {
  return shouldUseNeonServerDatabase()
    ? listEventDuplicateResolutionsNeon(eventId)
    : listEventDuplicateResolutionsSupabase(eventId);
}

export function findResolutionCandidateForImport(
  input: ImportRowResolutionLookup,
): Promise<DuplicateResolutionCandidate | null> {
  return shouldUseNeonServerDatabase()
    ? findResolutionCandidateForImportNeon(input)
    : findResolutionCandidateForImportSupabase(input);
}
