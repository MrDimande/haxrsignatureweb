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
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
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

type ResolutionJsonRow = { row: GuestDuplicateResolutionRow };

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
  matchKind: DuplicateResolutionMatchKind,
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
  guest: Pick<EventGuest, "name" | "email" | "phone" | "plusOnes" | "groupId">,
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
    google_sheet: buildSheetRowFingerprint({ ...base, source: "google_sheet" }),
    csv_upload: buildSheetRowFingerprint({ ...base, source: "csv_upload" }),
  };
}

export async function createDuplicateResolution(
  input: CreateDuplicateResolutionInput,
): Promise<GuestDuplicateResolutionRow> {
  const now = new Date().toISOString();
  const duplicateName = input.duplicateName?.trim() ?? "";
  const duplicateEmail = input.duplicateEmail?.trim()
    ? normalizeEmail(input.duplicateEmail)
    : "";
  const duplicatePhone = input.duplicatePhone?.trim()
    ? normalizePhone(input.duplicatePhone)
    : "";
  const result = await neonQuery<ResolutionJsonRow>(
    `
      WITH saved AS (
        INSERT INTO public.guest_duplicate_resolutions (
          event_id, primary_guest_id, duplicate_guest_id,
          duplicate_name, duplicate_name_normalized,
          duplicate_email, duplicate_phone, duplicate_fingerprint,
          source, resolution_status, resolved_by, resolved_at,
          notes, metadata, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid,
          $4, $5, $6, $7, $8,
          $9, $10, $11, $12::timestamptz,
          $13, $14::jsonb, $12::timestamptz
        ) RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.eventId,
      input.primaryGuestId,
      input.duplicateGuestId ?? null,
      toNullableText(duplicateName),
      duplicateName ? normalizeGuestName(duplicateName) : null,
      toNullableText(duplicateEmail),
      toNullableText(duplicatePhone),
      toNullableText(input.duplicateFingerprint ?? null),
      input.source ?? "manual_merge",
      input.resolutionStatus,
      toNullableText(input.resolvedBy ?? null),
      now,
      toNullableText(input.notes ?? null),
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("[duplicate-resolutions] create: no row returned");
  return row;
}

export async function recordManualMergeResolution(
  eventId: string,
  primaryGuestId: string,
  secondary: EventGuest,
  resolvedBy = "admin",
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
  fingerprint: string,
): Promise<GuestDuplicateResolutionRow | null> {
  const result = await neonQuery<ResolutionJsonRow>(
    `
      SELECT to_jsonb(r) AS row
      FROM public.guest_duplicate_resolutions r
      WHERE r.event_id = $1::uuid
        AND r.duplicate_fingerprint = $2
      ORDER BY r.resolved_at DESC
      LIMIT 1
    `,
    [eventId, fingerprint],
  );
  return result.rows[0]?.row ?? null;
}

export async function findResolutionByEmailPhoneName(
  eventId: string,
  input: { normalizedEmail: string; normalizedPhone: string; normalizedName: string },
): Promise<GuestDuplicateResolutionRow | null> {
  if (!input.normalizedEmail && !input.normalizedName && input.normalizedPhone.length < 8) {
    return null;
  }
  const result = await neonQuery<ResolutionJsonRow>(
    `
      SELECT to_jsonb(r) AS row
      FROM public.guest_duplicate_resolutions r
      WHERE r.event_id = $1::uuid
        AND (
          ($2 <> '' AND r.duplicate_email = $2)
          OR ($3 <> '' AND length($3) >= 8 AND r.duplicate_phone = $3)
          OR ($4 <> '' AND r.duplicate_name_normalized = $4)
        )
      ORDER BY r.resolved_at DESC
      LIMIT 20
    `,
    [eventId, input.normalizedEmail, input.normalizedPhone, input.normalizedName],
  );
  const rows = result.rows.map(({ row }) => row);
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
    if (matchKind !== "none") candidates.push(toCandidate(mapped, matchKind));
  }
  const best = pickBestDuplicateResolution(candidates);
  if (!best) return null;
  return rows.find((row) => row.id === best.id) ?? null;
}

export async function findResolutionForImportRow(
  input: ImportRowResolutionLookup,
): Promise<GuestDuplicateResolutionRow | null> {
  const result = await neonQuery<ResolutionJsonRow>(
    `
      SELECT to_jsonb(r) AS row
      FROM public.guest_duplicate_resolutions r
      WHERE r.event_id = $1::uuid
      ORDER BY r.resolved_at DESC
      LIMIT 100
    `,
    [input.eventId],
  );
  const rows = result.rows.map(({ row }) => row);
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
    if (matchKind !== "none") candidates.push(toCandidate(mapped, matchKind));
  }
  const best = pickBestDuplicateResolution(candidates);
  if (!best) return null;
  return rows.find((row) => row.id === best.id) ?? null;
}

export async function getDuplicateResolutionById(
  resolutionId: string,
): Promise<GuestDuplicateResolutionRow | null> {
  const result = await neonQuery<ResolutionJsonRow>(
    `SELECT to_jsonb(r) AS row FROM public.guest_duplicate_resolutions r WHERE r.id = $1::uuid LIMIT 1`,
    [resolutionId],
  );
  return result.rows[0]?.row ?? null;
}

export async function updateDuplicateResolution(
  resolutionId: string,
  patch: {
    resolutionStatus?: DuplicateResolutionStatus;
    primaryGuestId?: string;
    notes?: string | null;
    resolvedBy?: string | null;
  },
): Promise<GuestDuplicateResolutionRow> {
  const now = new Date().toISOString();
  const result = await neonQuery<ResolutionJsonRow>(
    `
      WITH saved AS (
        UPDATE public.guest_duplicate_resolutions
        SET resolution_status = COALESCE($2, resolution_status),
            primary_guest_id = COALESCE($3::uuid, primary_guest_id),
            notes = CASE WHEN $4::boolean THEN $5 ELSE notes END,
            resolved_by = CASE WHEN $6::boolean THEN $7 ELSE resolved_by END,
            resolved_at = $8::timestamptz,
            updated_at = $8::timestamptz
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      resolutionId,
      patch.resolutionStatus ?? null,
      patch.primaryGuestId ?? null,
      patch.notes !== undefined,
      patch.notes !== undefined ? toNullableText(patch.notes) : null,
      patch.resolvedBy !== undefined,
      patch.resolvedBy !== undefined ? toNullableText(patch.resolvedBy) : null,
      now,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("[duplicate-resolutions] update: no row");
  return row;
}

export async function markResolutionIgnored(
  resolutionId: string,
  notes?: string | null,
): Promise<GuestDuplicateResolutionRow> {
  const now = new Date().toISOString();
  const result = await neonQuery<ResolutionJsonRow>(
    `
      WITH saved AS (
        UPDATE public.guest_duplicate_resolutions
        SET resolution_status = 'ignored',
            notes = $2,
            resolved_at = $3::timestamptz,
            updated_at = $3::timestamptz
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [resolutionId, toNullableText(notes ?? null), now],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("[duplicate-resolutions] markIgnored: no row");
  return row;
}

export async function listEventDuplicateResolutions(
  eventId: string,
): Promise<GuestDuplicateResolutionRow[]> {
  const result = await neonQuery<ResolutionJsonRow>(
    `
      SELECT to_jsonb(r) AS row
      FROM public.guest_duplicate_resolutions r
      WHERE r.event_id = $1::uuid
      ORDER BY r.resolved_at DESC
    `,
    [eventId],
  );
  return result.rows.map(({ row }) => row);
}

export async function findResolutionCandidateForImport(
  input: ImportRowResolutionLookup,
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
