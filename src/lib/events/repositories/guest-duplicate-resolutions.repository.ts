import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import {
  normalizeEmail,
  normalizeGuestName,
  normalizePhone,
} from "@/lib/events/normalize";
import {
  pickBestDuplicateResolution,
  scoreResolutionMatch,
  type DuplicateResolutionCandidate,
  type DuplicateResolutionMatchKind,
  type DuplicateResolutionStatus,
} from "@/lib/events/duplicate-resolution-plan";
import {
  buildSheetRowFingerprint,
  type SheetImportSource,
} from "@/lib/events/sheets/fingerprint";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type { EventGuest } from "@/lib/events/types";

export type GuestDuplicateResolutionRow = Tables<"guest_duplicate_resolutions">;

export type DuplicateResolutionSource =
  | "manual_merge"
  | "google_sheet"
  | "csv_upload"
  | "rsvp"
  | "admin";

export type CreateDuplicateResolutionInput = {
  eventId: string;
  primaryGuestId: string;
  duplicateGuestId?: string | null;
  duplicateName?: string | null;
  duplicateEmail?: string | null;
  duplicatePhone?: string | null;
  duplicateFingerprint?: string | null;
  source?: DuplicateResolutionSource | null;
  resolutionStatus: DuplicateResolutionStatus;
  resolvedBy?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ImportRowResolutionLookup = {
  eventId: string;
  fingerprint: string;
  normalizedEmail: string;
  normalizedPhone: string;
  normalizedName: string;
};

function toNullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mapRow(row: GuestDuplicateResolutionRow): {
  id: string;
  primaryGuestId: string;
  resolutionStatus: DuplicateResolutionStatus;
  duplicateFingerprint: string | null;
  duplicateEmail: string | null;
  duplicatePhone: string | null;
  duplicateNameNormalized: string | null;
  metadataFingerprints: string[] | null;
} {
  const metadata = row.metadata as { fingerprints?: Record<string, string> } | null;
  const metadataFingerprints = metadata?.fingerprints
    ? Object.values(metadata.fingerprints).filter(Boolean)
    : null;

  return {
    id: row.id,
    primaryGuestId: row.primary_guest_id,
    resolutionStatus: row.resolution_status as DuplicateResolutionStatus,
    duplicateFingerprint: row.duplicate_fingerprint,
    duplicateEmail: row.duplicate_email,
    duplicatePhone: row.duplicate_phone,
    duplicateNameNormalized: row.duplicate_name_normalized,
    metadataFingerprints,
  };
}

function toCandidate(
  row: ReturnType<typeof mapRow>,
  matchKind: DuplicateResolutionMatchKind
): DuplicateResolutionCandidate {
  return {
    id: row.id,
    primaryGuestId: row.primaryGuestId,
    resolutionStatus: row.resolutionStatus,
    matchKind,
  };
}

export function buildDuplicateFingerprintsForGuest(
  eventId: string,
  guest: Pick<EventGuest, "name" | "email" | "phone" | "plusOnes" | "groupId">
): { google_sheet: string; csv_upload: string } {
  const base = {
    eventId,
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    plusOnes: guest.plusOnes,
    groupName: undefined as string | undefined,
  };

  return {
    google_sheet: buildSheetRowFingerprint({
      ...base,
      source: "google_sheet",
    }),
    csv_upload: buildSheetRowFingerprint({
      ...base,
      source: "csv_upload",
    }),
  };
}

export async function createDuplicateResolution(
  input: CreateDuplicateResolutionInput
): Promise<GuestDuplicateResolutionRow> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const duplicateName = input.duplicateName?.trim() ?? "";
  const duplicateEmail = input.duplicateEmail?.trim()
    ? normalizeEmail(input.duplicateEmail)
    : "";
  const duplicatePhone = input.duplicatePhone?.trim()
    ? normalizePhone(input.duplicatePhone)
    : "";

  const payload = {
    event_id: input.eventId,
    primary_guest_id: input.primaryGuestId,
    duplicate_guest_id: input.duplicateGuestId ?? null,
    duplicate_name: toNullableText(duplicateName),
    duplicate_name_normalized: duplicateName
      ? normalizeGuestName(duplicateName)
      : null,
    duplicate_email: toNullableText(duplicateEmail),
    duplicate_phone: toNullableText(duplicatePhone),
    duplicate_fingerprint: toNullableText(input.duplicateFingerprint ?? null),
    source: input.source ?? "manual_merge",
    resolution_status: input.resolutionStatus,
    resolved_by: toNullableText(input.resolvedBy ?? null),
    resolved_at: now,
    notes: toNullableText(input.notes ?? null),
    metadata: (input.metadata ?? null) as Json | null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[duplicate-resolutions] create: ${error.message}`);
  }

  const row = asTableRow<"guest_duplicate_resolutions">(data);
  if (!row) throw new Error("[duplicate-resolutions] create: no row returned");
  return row;
}

export async function recordManualMergeResolution(
  eventId: string,
  primaryGuestId: string,
  secondary: EventGuest,
  resolvedBy = "admin"
): Promise<GuestDuplicateResolutionRow> {
  const fingerprints = buildDuplicateFingerprintsForGuest(eventId, secondary);

  return createDuplicateResolution({
    eventId,
    primaryGuestId,
    duplicateGuestId: secondary.id,
    duplicateName: secondary.name,
    duplicateEmail: secondary.email,
    duplicatePhone: secondary.phone,
    duplicateFingerprint: fingerprints.google_sheet,
    source: "manual_merge",
    resolutionStatus: "merged",
    resolvedBy,
    notes: `Fundido em convidado principal (${primaryGuestId})`,
    metadata: {
      guest_source: secondary.guestSource,
      group_id: secondary.groupId,
      fingerprints,
    },
  });
}

export async function findResolutionByFingerprint(
  eventId: string,
  fingerprint: string
): Promise<GuestDuplicateResolutionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .select("*")
    .eq("event_id", eventId)
    .eq("duplicate_fingerprint", fingerprint)
    .order("resolved_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[duplicate-resolutions] findByFingerprint: ${error.message}`);
  }

  return asTableRow<"guest_duplicate_resolutions">(data);
}

export async function findResolutionByEmailPhoneName(
  eventId: string,
  input: {
    normalizedEmail: string;
    normalizedPhone: string;
    normalizedName: string;
  }
): Promise<GuestDuplicateResolutionRow | null> {
  const supabase = createAdminClient();
  const filters: string[] = [];

  if (input.normalizedEmail) {
    filters.push(`duplicate_email.eq.${input.normalizedEmail}`);
  }
  if (input.normalizedPhone && input.normalizedPhone.length >= 8) {
    filters.push(`duplicate_phone.eq.${input.normalizedPhone}`);
  }
  if (input.normalizedName) {
    filters.push(`duplicate_name_normalized.eq.${input.normalizedName}`);
  }

  if (!filters.length) return null;

  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .select("*")
    .eq("event_id", eventId)
    .or(filters.join(","))
    .order("resolved_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(
      `[duplicate-resolutions] findByEmailPhoneName: ${error.message}`
    );
  }

  const rows = asTableRows<"guest_duplicate_resolutions">(data);
  if (!rows.length) return null;

  const candidates: DuplicateResolutionCandidate[] = [];
  for (const row of rows) {
    const mapped = mapRow(row);
    const matchKind = scoreResolutionMatch({
      fingerprint: "",
      normalizedEmail: input.normalizedEmail,
      normalizedPhone: input.normalizedPhone,
      normalizedName: input.normalizedName,
      storedFingerprint: mapped.duplicateFingerprint,
      storedFingerprints: mapped.metadataFingerprints,
      storedEmail: mapped.duplicateEmail,
      storedPhone: mapped.duplicatePhone,
      storedNameNormalized: mapped.duplicateNameNormalized,
    });
    if (matchKind !== "none") {
      candidates.push(toCandidate(mapped, matchKind));
    }
  }

  const best = pickBestDuplicateResolution(candidates);
  if (!best) return null;

  return rows.find((row) => row.id === best.id) ?? null;
}

export async function findResolutionForImportRow(
  input: ImportRowResolutionLookup
): Promise<GuestDuplicateResolutionRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .select("*")
    .eq("event_id", input.eventId)
    .order("resolved_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`[duplicate-resolutions] findForImportRow: ${error.message}`);
  }

  const rows = asTableRows<"guest_duplicate_resolutions">(data);
  const candidates: DuplicateResolutionCandidate[] = [];

  for (const row of rows) {
    const mapped = mapRow(row);
    const matchKind = scoreResolutionMatch({
      fingerprint: input.fingerprint,
      normalizedEmail: input.normalizedEmail,
      normalizedPhone: input.normalizedPhone,
      normalizedName: input.normalizedName,
      storedFingerprint: mapped.duplicateFingerprint,
      storedFingerprints: mapped.metadataFingerprints,
      storedEmail: mapped.duplicateEmail,
      storedPhone: mapped.duplicatePhone,
      storedNameNormalized: mapped.duplicateNameNormalized,
    });

    if (matchKind !== "none") {
      candidates.push(toCandidate(mapped, matchKind));
    }
  }

  const best = pickBestDuplicateResolution(candidates);
  if (!best) return null;

  return rows.find((row) => row.id === best.id) ?? null;
}

export async function getDuplicateResolutionById(
  resolutionId: string
): Promise<GuestDuplicateResolutionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .select("*")
    .eq("id", resolutionId)
    .maybeSingle();

  if (error) {
    throw new Error(`[duplicate-resolutions] getById: ${error.message}`);
  }

  return asTableRow<"guest_duplicate_resolutions">(data);
}

export async function updateDuplicateResolution(
  resolutionId: string,
  patch: {
    resolutionStatus?: DuplicateResolutionStatus;
    primaryGuestId?: string;
    notes?: string | null;
    resolvedBy?: string | null;
  }
): Promise<GuestDuplicateResolutionRow> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    updated_at: now,
    resolved_at: now,
  };

  if (patch.resolutionStatus !== undefined) {
    payload.resolution_status = patch.resolutionStatus;
  }
  if (patch.primaryGuestId !== undefined) {
    payload.primary_guest_id = patch.primaryGuestId;
  }
  if (patch.notes !== undefined) {
    payload.notes = toNullableText(patch.notes);
  }
  if (patch.resolvedBy !== undefined) {
    payload.resolved_by = toNullableText(patch.resolvedBy);
  }

  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .update(payload as never)
    .eq("id", resolutionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[duplicate-resolutions] update: ${error.message}`);
  }

  const row = asTableRow<"guest_duplicate_resolutions">(data);
  if (!row) throw new Error("[duplicate-resolutions] update: no row");
  return row;
}

export async function markResolutionIgnored(
  resolutionId: string,
  notes?: string | null
): Promise<GuestDuplicateResolutionRow> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .update({
      resolution_status: "ignored",
      notes: toNullableText(notes ?? null),
      resolved_at: now,
      updated_at: now,
    } as never)
    .eq("id", resolutionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[duplicate-resolutions] markIgnored: ${error.message}`);
  }

  const row = asTableRow<"guest_duplicate_resolutions">(data);
  if (!row) throw new Error("[duplicate-resolutions] markIgnored: no row");
  return row;
}

export async function listEventDuplicateResolutions(
  eventId: string
): Promise<GuestDuplicateResolutionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_duplicate_resolutions")
    .select("*")
    .eq("event_id", eventId)
    .order("resolved_at", { ascending: false });

  if (error) {
    throw new Error(`[duplicate-resolutions] list: ${error.message}`);
  }

  return asTableRows<"guest_duplicate_resolutions">(data);
}

export async function findResolutionCandidateForImport(
  input: ImportRowResolutionLookup
): Promise<DuplicateResolutionCandidate | null> {
  const row = await findResolutionForImportRow(input);
  if (!row) return null;

  const mapped = mapRow(row);
  const matchKind = scoreResolutionMatch({
    fingerprint: input.fingerprint,
    normalizedEmail: input.normalizedEmail,
    normalizedPhone: input.normalizedPhone,
    normalizedName: input.normalizedName,
    storedFingerprint: mapped.duplicateFingerprint,
    storedFingerprints: mapped.metadataFingerprints,
    storedEmail: mapped.duplicateEmail,
    storedPhone: mapped.duplicatePhone,
    storedNameNormalized: mapped.duplicateNameNormalized,
  });

  if (matchKind === "none") return null;
  return toCandidate(mapped, matchKind);
}

export type { SheetImportSource };
