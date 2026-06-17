import { fetchSheetCsv } from "@/lib/events/sheets/fetch";
import { analyzeSheetCsv, mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";
import { resolveRsvpRowStatus } from "@/lib/events/sheets/detect-mode";
import { findGuestMatch } from "@/lib/events/sheets/match";
import * as groupsRepo from "@/lib/events/repositories/guest-groups.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { validateSheetRow } from "@/lib/events/services/guest-validation.service";
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
  const groupCache = new Map<string, string>();
  const result = emptyResult(syncMode, rows.length);

  async function resolveGroupId(groupName?: string): Promise<string | null> {
    const trimmed = groupName?.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    const cached = groupCache.get(key);
    if (cached) return cached;

    const groups = await groupsRepo.listGroupsByEvent(eventId);
    const existing = groups.find(
      (group) => group.name.trim().toLowerCase() === key
    );
    if (existing) {
      groupCache.set(key, existing.id);
      return existing.id;
    }

    const created = await groupsRepo.createGroup(eventId, {
      name: trimmed,
      notes: "",
    });
    groupCache.set(key, created.id);
    return created.id;
  }

  for (const rawRow of rows) {
    let row: SheetGuestRow = rawRow;

    if (syncMode === "rsvp") {
      const applied = applyRsvpStatus(rawRow);
      if (applied === "declined") {
        result.declined++;
        const match = findGuestMatch(existingGuests, rawRow, usedIds);
        if (match) {
          usedIds.add(match.id);
          await guestsRepo.updateGuestStatus(match.id, "declined");
          result.updated++;
        } else {
          result.skipped++;
          result.errors.push(
            `Linha ${rawRow.rowNumber}: Recusa sem convidado correspondente — «${rawRow.name}».`
          );
        }
        continue;
      }
      row = applied;
    }

    try {
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
            `Linha ${row.rowNumber}: Duplicado detectado — «${row.name}» já existe.`
          );
          continue;
        }
        result.errors.push(
          `Linha ${row.rowNumber}: Duplicado detectado — actualizado «${preemptiveMatch.name}».`
        );
      }

      const groupId = await resolveGroupId(row.groupName);
      const enrichedRow = { ...row, groupId };
      const match = findGuestMatch(existingGuests, enrichedRow, usedIds);

      if (match) {
        usedIds.add(match.id);
        await guestsRepo.updateGuestFromSheet(match.id, enrichedRow, syncMode);
        result.updated++;
        if (syncMode === "rsvp" && enrichedRow.status === "confirmed") {
          result.confirmedFromSheet++;
        }
      } else {
        const created = await guestsRepo.createGuestFromSheet(
          eventId,
          enrichedRow,
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
