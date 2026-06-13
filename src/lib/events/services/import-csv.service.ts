import { mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";
import { findGuestMatch } from "@/lib/events/sheets/match";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { SheetSyncResult } from "@/lib/events/types";

export async function importGuestsFromCsv(
  eventId: string,
  csvText: string
): Promise<SheetSyncResult> {
  const rows = mapCsvToGuestRows(csvText);
  const existingGuests = await guestsRepo.listGuestsByEvent(eventId);

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
    try {
      const match = findGuestMatch(existingGuests, row, usedIds);

      if (match) {
        usedIds.add(match.id);
        await guestsRepo.updateGuestFromSheet(match.id, row);
        result.updated++;
      } else {
        const created = await guestsRepo.createGuestFromSheet(eventId, row);
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
