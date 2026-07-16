import { mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";
import { findGuestMatch } from "@/lib/events/sheets/match";
import {
  createEmptyIdempotentStats,
  createSyncBatchId,
  mergeIdempotentStats,
  processImportRowWithLedger,
  type IdempotentImportContext,
} from "@/lib/events/sheets/idempotent-import";
import * as groupsRepo from "@/lib/events/repositories/guest-groups.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as batchesRepo from "@/lib/events/repositories/guest-import-batches.repository";
import { validateSheetRow } from "@/lib/events/services/guest-validation.service";
import {
  buildImportPreview,
  rowsSelectedForImport,
  type ImportPreviewResult,
} from "@/lib/events/services/import-preview.service";
import type { SheetSyncResult } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

async function resolveGroupId(
  eventId: string,
  groupName: string | undefined,
  cache: Map<string, string>
): Promise<string | null> {
  const trimmed = groupName?.trim();
  if (!trimmed) return null;

  const key = trimmed.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const groups = await groupsRepo.listGroupsByEvent(eventId);
  const existing = groups.find(
    (group) => group.name.trim().toLowerCase() === key
  );

  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const created = await groupsRepo.createGroup(eventId, {
    name: trimmed,
    notes: "",
  });
  cache.set(key, created.id);
  return created.id;
}

export async function previewGuestsCsvImport(
  eventId: string,
  csvText: string,
  excludedKeys: string[] = []
): Promise<ImportPreviewResult> {
  const rows = mapCsvToGuestRows(csvText);
  const existingGuests = await guestsRepo.listGuestsByEvent(eventId, {
    includeDeleted: false,
  });
  return buildImportPreview(rows, existingGuests, excludedKeys);
}

export type ConfirmImportOptions = {
  filename: string;
  operatorUserId: string;
  operatorEmail: string;
  rows: SheetGuestRow[];
  previewSummary: ImportPreviewResult["summary"];
  includeExisting?: boolean;
};

export async function confirmGuestsCsvImport(
  eventId: string,
  options: ConfirmImportOptions
): Promise<SheetSyncResult & { batchId: string }> {
  const existingGuests = await guestsRepo.listGuestsByEvent(eventId, {
    includeDeleted: false,
  });
  const preview = buildImportPreview(
    options.rows,
    existingGuests,
    []
  );
  const rowsToImport = rowsSelectedForImport(
    preview,
    options.includeExisting !== false
  );

  const batch = await batchesRepo.createImportBatch({
    eventId,
    filename: options.filename,
    operatorUserId: options.operatorUserId,
    operatorEmail: options.operatorEmail,
    totalRows: options.previewSummary.totalRows,
    validRows: options.previewSummary.validRows,
    duplicateRows: options.previewSummary.duplicateRows,
    invalidRows: options.previewSummary.invalidRows,
    status: "completed",
  });

  const groupCache = new Map<string, string>();
  const usedIds = new Set<string>();
  const syncBatchId = createSyncBatchId();
  const ledgerStats = createEmptyIdempotentStats();

  const importCtx: IdempotentImportContext = {
    eventId,
    source: "csv_upload",
    syncBatchId,
    syncMode: "master",
    sourceFileName: options.filename,
    existingGuests,
    usedIds,
  };

  const result: SheetSyncResult & { batchId: string } = {
    created: 0,
    updated: 0,
    skipped: 0,
    totalRows: rowsToImport.length,
    syncedAt: new Date().toISOString(),
    errors: [],
    syncMode: "master",
    confirmedFromSheet: 0,
    pendingGuests: 0,
    declined: 0,
    syncBatchId,
    batchId: batch.id,
  };

  for (const row of rowsToImport) {
    const validationIssues = validateSheetRow(row, {
      eventId,
      existingGuests,
    });

    const blockingIssues = validationIssues.filter(
      (issue) => issue.code !== "possible_duplicate"
    );

    if (blockingIssues.length) {
      result.skipped++;
      result.errors.push(
        `Linha ${row.rowNumber}: ${blockingIssues.map((issue) => issue.message).join(" ")}`
      );
      continue;
    }

    if (validationIssues.some((issue) => issue.code === "possible_duplicate")) {
      const preemptiveMatch = findGuestMatch(existingGuests, row, usedIds);
      if (!preemptiveMatch) {
        result.skipped++;
        result.errors.push(
          `Linha ${row.rowNumber}: Duplicado detectado — «${row.name}» já existe. Use fundir duplicados no painel.`
        );
        continue;
      }
      result.errors.push(
        `Linha ${row.rowNumber}: Duplicado detectado — actualizado «${preemptiveMatch.name}».`
      );
    }

    try {
      const groupId = await resolveGroupId(eventId, row.groupName, groupCache);
      const enrichedRow = { ...row, groupId };

      const outcome = await processImportRowWithLedger(importCtx, enrichedRow);
      mergeIdempotentStats(ledgerStats, outcome);

      if (outcome.kind === "created") {
        result.created++;
        await guestsRepo.setGuestImportBatchId(
          outcome.guest.id,
          eventId,
          batch.id
        );
        existingGuests.push({
          ...outcome.guest,
          importBatchId: batch.id,
        });
      } else if (outcome.kind === "updated") {
        result.updated++;
        await guestsRepo.setGuestImportBatchId(
          outcome.guest.id,
          eventId,
          batch.id
        );
      } else {
        result.skipped++;
        result.errors.push(`Linha ${row.rowNumber}: ${outcome.reason}`);
      }
    } catch (err) {
      result.skipped++;
      const message =
        err instanceof Error ? err.message : "Erro ao processar linha.";
      result.errors.push(`Linha ${row.rowNumber}: ${message}`);
    }
  }

  const refreshed = await guestsRepo.listGuestsByEvent(eventId);
  result.pendingGuests = refreshed.filter((g) => g.status === "invited").length;
  result.importRowsSeen = ledgerStats.importRowsSeen;
  result.fingerprintsCreated = ledgerStats.fingerprintsCreated;
  result.ledgerMatched = ledgerStats.ledgerMatched;
  result.ledgerSkipped = ledgerStats.ledgerSkipped;

  await batchesRepo.insertBulkAudit({
    eventId,
    batchId: batch.id,
    action: "import_batch_committed",
    guestIds: refreshed
      .filter((guest) => guest.importBatchId === batch.id)
      .map((guest) => guest.id),
    operatorEmail: options.operatorEmail,
    impact: {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      filename: options.filename,
    },
  });

  return result;
}

/** Legacy path: import immediately without interactive preview UI. */
export async function importGuestsFromCsv(
  eventId: string,
  csvText: string,
  sourceFileName?: string
): Promise<SheetSyncResult> {
  const preview = await previewGuestsCsvImport(eventId, csvText);
  const rows = rowsSelectedForImport(preview, true);
  const committed = await confirmGuestsCsvImport(eventId, {
    filename: sourceFileName ?? "upload.csv",
    operatorUserId: "system",
    operatorEmail: "system",
    rows,
    previewSummary: preview.summary,
    includeExisting: true,
  });
  const { batchId: _batchId, ...result } = committed;
  return result;
}
