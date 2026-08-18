import { namesAreEquivalent, normalizePhone } from "@/lib/events/normalize";
import type { EventGuest } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export type ImportPreviewIssueCode =
  | "empty_name"
  | "empty_contact"
  | "invalid_phone"
  | "duplicate_in_file"
  | "existing_guest"
  | "excluded";

export type ImportPreviewRowStatus =
  | "valid"
  | "duplicate"
  | "invalid"
  | "existing"
  | "excluded";

export type ImportPreviewRow = {
  rowKey: string;
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  status: ImportPreviewRowStatus;
  issues: ImportPreviewIssueCode[];
  existingGuestId?: string;
  existingGuestName?: string;
  excluded: boolean;
  editable: SheetGuestRow;
};

export type ImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  existingRows: number;
  excludedRows: number;
  finalImportTotal: number;
};

export type ImportPreviewResult = {
  rows: ImportPreviewRow[];
  summary: ImportPreviewSummary;
};

const MIN_PHONE_DIGITS = 8;

export function isValidImportPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return true;
  return normalizePhone(trimmed).length >= MIN_PHONE_DIGITS;
}

function classifyRow(
  row: SheetGuestRow,
  existingGuests: EventGuest[],
  seenNameKeys: Map<string, number>,
  excludedKeys: Set<string>
): ImportPreviewRow {
  const rowKey = `r${row.rowNumber}`;
  const issues: ImportPreviewIssueCode[] = [];
  const name = row.name.trim();
  const email = row.email.trim();
  const phone = row.phone.trim();

  if (!name) issues.push("empty_name");
  if (!email && !phone) issues.push("empty_contact");
  if (phone && !isValidImportPhone(phone)) issues.push("invalid_phone");

  const nameKey = name.toLowerCase();
  if (name && seenNameKeys.has(nameKey)) {
    issues.push("duplicate_in_file");
  } else if (name) {
    seenNameKeys.set(nameKey, row.rowNumber);
  }

  const existing = existingGuests.find((guest) =>
    namesAreEquivalent(guest.name, name)
  );
  if (existing) {
    issues.push("existing_guest");
  }

  const excluded = excludedKeys.has(rowKey);
  if (excluded) issues.push("excluded");

  let status: ImportPreviewRowStatus = "valid";
  if (excluded) status = "excluded";
  else if (
    issues.includes("empty_name") ||
    issues.includes("invalid_phone") ||
    issues.includes("empty_contact")
  ) {
    status = "invalid";
  } else if (issues.includes("duplicate_in_file")) {
    status = "duplicate";
  } else if (issues.includes("existing_guest")) {
    status = "existing";
  }

  return {
    rowKey,
    rowNumber: row.rowNumber,
    name,
    email,
    phone,
    status,
    issues,
    existingGuestId: existing?.id,
    existingGuestName: existing?.name,
    excluded,
    editable: { ...row, name, email, phone },
  };
}

export function buildImportPreview(
  rows: SheetGuestRow[],
  existingGuests: EventGuest[],
  excludedKeys: Iterable<string> = []
): ImportPreviewResult {
  const excluded = new Set(excludedKeys);
  const seenNameKeys = new Map<string, number>();
  const previewRows = rows.map((row) =>
    classifyRow(row, existingGuests, seenNameKeys, excluded)
  );

  const summary: ImportPreviewSummary = {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.status === "valid").length,
    duplicateRows: previewRows.filter((row) => row.status === "duplicate")
      .length,
    invalidRows: previewRows.filter((row) => row.status === "invalid").length,
    existingRows: previewRows.filter((row) => row.status === "existing")
      .length,
    excludedRows: previewRows.filter((row) => row.status === "excluded")
      .length,
    finalImportTotal: previewRows.filter(
      (row) => row.status === "valid" || row.status === "existing"
    ).length,
  };

  return { rows: previewRows, summary };
}

export function rowsSelectedForImport(
  preview: ImportPreviewResult,
  includeExisting = true
): SheetGuestRow[] {
  return preview.rows
    .filter((row) => {
      if (row.excluded) return false;
      if (row.status === "invalid" || row.status === "duplicate") return false;
      if (row.status === "existing") return includeExisting;
      return row.status === "valid";
    })
    .map((row) => row.editable);
}
