import { mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";
import { findGuestMatch } from "@/lib/events/sheets/match";
import * as groupsRepo from "@/lib/events/repositories/guest-groups.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import {
  validateSheetRow,
} from "@/lib/events/services/guest-validation.service";
import type { SheetSyncResult } from "@/lib/events/types";

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

export async function importGuestsFromCsv(
  eventId: string,
  csvText: string
): Promise<SheetSyncResult> {
  const rows = mapCsvToGuestRows(csvText);
  const existingGuests = await guestsRepo.listGuestsByEvent(eventId);
  const groupCache = new Map<string, string>();

  const usedIds = new Set<string>();
  const result: SheetSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    totalRows: rows.length,
    syncedAt: new Date().toISOString(),
    errors: [],
    syncMode: "master",
    confirmedFromSheet: 0,
    pendingGuests: 0,
    declined: 0,
  };

  for (const row of rows) {
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
      result.errors.push(
        `Linha ${row.rowNumber}: Possível duplicado detectado — «${row.name}».`
      );
    }

    try {
      const groupId = await resolveGroupId(eventId, row.groupName, groupCache);
      const enrichedRow = { ...row, groupId };

      const match = findGuestMatch(existingGuests, enrichedRow, usedIds);

      if (match) {
        usedIds.add(match.id);
        await guestsRepo.updateGuestFromSheet(match.id, enrichedRow);
        result.updated++;
      } else {
        const created = await guestsRepo.createGuestFromSheet(eventId, enrichedRow);
        existingGuests.push(created);
        result.created++;
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

  return result;
}
