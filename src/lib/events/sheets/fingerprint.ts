import { createHash } from "node:crypto";
import {
  normalizeEmail,
  normalizeGuestName,
  normalizePhone,
} from "@/lib/events/normalize";

export type SheetImportSource = "google_sheet" | "csv_upload";

export type SheetRowFingerprintInput = {
  eventId: string;
  source: SheetImportSource;
  name: string;
  email?: string;
  phone?: string;
  plusOnes?: number;
  groupName?: string;
};

export type NormalizedSheetRowIdentity = {
  normalizedEmail: string;
  normalizedPhone: string;
  normalizedName: string;
  partyHint: string;
};

/** Normaliza campos usados no fingerprint e nas tabelas de ledger. */
export function normalizeSheetRowForFingerprint(
  input: Pick<
    SheetRowFingerprintInput,
    "name" | "email" | "phone" | "plusOnes" | "groupName"
  >
): NormalizedSheetRowIdentity {
  const normalizedEmail = input.email?.trim()
    ? normalizeEmail(input.email)
    : "";
  const normalizedPhone = input.phone?.trim()
    ? normalizePhone(input.phone)
    : "";
  const normalizedName = input.name?.trim()
    ? normalizeGuestName(input.name)
    : "";

  const plusPart =
    input.plusOnes !== undefined && input.plusOnes > 0
      ? String(input.plusOnes)
      : "0";
  const groupPart = input.groupName?.trim()
    ? normalizeGuestName(input.groupName)
    : "";

  const partyHint = [plusPart, groupPart].filter(Boolean).join("|");

  return {
    normalizedEmail,
    normalizedPhone,
    normalizedName,
    partyHint,
  };
}

function buildFingerprintMaterial(
  input: SheetRowFingerprintInput,
  normalized: NormalizedSheetRowIdentity
): string {
  const parts = [
    input.eventId.trim(),
    input.source,
    normalized.normalizedEmail,
    normalized.normalizedPhone,
    normalized.normalizedName,
    normalized.partyHint,
  ];
  return parts.join("\u001f");
}

/** Fingerprint determinístico SHA-256 — estável entre syncs; ignora row_number. */
export function buildSheetRowFingerprint(
  input: SheetRowFingerprintInput
): string {
  const normalized = normalizeSheetRowForFingerprint(input);
  const material = buildFingerprintMaterial(input, normalized);
  return createHash("sha256").update(material, "utf8").digest("hex");
}

export function buildSheetRowFingerprintBundle(input: SheetRowFingerprintInput): {
  fingerprint: string;
  normalized: NormalizedSheetRowIdentity;
} {
  const normalized = normalizeSheetRowForFingerprint(input);
  const fingerprint = createHash("sha256")
    .update(buildFingerprintMaterial(input, normalized), "utf8")
    .digest("hex");
  return { fingerprint, normalized };
}
