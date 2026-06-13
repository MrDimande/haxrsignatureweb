import { fetchSheetCsv } from "@/lib/events/sheets/fetch";
import { analyzeSheetCsv, mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";
import { resolveRsvpRowStatus } from "@/lib/events/sheets/detect-mode";
import { findGuestMatch } from "@/lib/events/sheets/match";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { SheetSyncResult, SheetsSyncMode } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export { previewSheetGuests } from "@/lib/events/sheets/fetch";

function emptyResult(
  mode: SheetsSyncMode,
  totalRows: number
): SheetSyncResult {
  return {
    created: 0,
    updated: 0,
    skipped: 0,
    totalRows,
    syncedAt: new Date().toISOString(),
    errors: [],
    syncMode: mode,
    confirmedFromSheet: 0,
    pendingGuests: 0,
    declined: 0,
  };
}

function applyRsvpStatus(row: SheetGuestRow): SheetGuestRow | "declined" {
  const resolved = resolveRsvpRowStatus(row.statusRaw ?? "", row.status);

  if (resolved === "declined") return "declined";

  return {
    ...row,
    status: resolved === "checked_in" ? "checked_in" : "confirmed",
  };
}

export async function syncEventGuestsFromSheet(
  eventId: string
): Promise<SheetSyncResult> {
  const event = await eventsRepo.getEventById(eventId);
  if (!event) throw new Error("Evento não encontrado.");
  if (!event.googleSheetUrl.trim()) {
    throw new Error("Nenhuma Google Sheet ligada a este evento.");
  }

  const { csv } = await fetchSheetCsv(
    event.googleSheetUrl,
    event.googleSheetGid
  );

  const analysis = analyzeSheetCsv(csv);
  const syncMode = event.sheetsSyncMode ?? analysis.mode;
  const rows = mapCsvToGuestRows(csv);
  const existingGuests = await guestsRepo.listGuestsByEvent(eventId);

  const usedIds = new Set<string>();
  const result = emptyResult(syncMode, rows.length);

  for (const rawRow of rows) {
    let row: SheetGuestRow = rawRow;

    if (syncMode === "rsvp") {
      const applied = applyRsvpStatus(rawRow);
      if (applied === "declined") {
        result.declined++;
        continue;
      }
      row = applied;
    }

    try {
      const match = findGuestMatch(existingGuests, row, usedIds);

      if (match) {
        usedIds.add(match.id);
        await guestsRepo.updateGuestFromSheet(match.id, row, syncMode);
        result.updated++;
        if (syncMode === "rsvp" && row.status === "confirmed") {
          result.confirmedFromSheet++;
        }
      } else {
        const created = await guestsRepo.createGuestFromSheet(
          eventId,
          row,
          syncMode
        );
        existingGuests.push(created);
        result.created++;
        if (syncMode === "rsvp") result.confirmedFromSheet++;
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

  const summary =
    syncMode === "rsvp"
      ? `RSVP: ${result.confirmedFromSheet} confirmados · ${result.pendingGuests} por confirmar · ${result.created} novos`
      : `${result.created} novos · ${result.updated} actualizados · ${result.skipped} ignorados`;

  await eventsRepo.recordSheetSync(eventId, result.syncedAt, summary);

  return result;
}
