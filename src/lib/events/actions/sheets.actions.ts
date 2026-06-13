"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { mapSheetError } from "@/lib/events/sheets/errors";
import { parseGoogleSheetUrl } from "@/lib/events/sheets/parse-url";
import {
  previewSheetGuests,
  syncEventGuestsFromSheet,
} from "@/lib/events/sheets/sync.service";
import type { SheetConnectionInput } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

function wrapSheetAction<T>(fn: () => Promise<T>) {
  return runAction(async () => {
    try {
      return await fn();
    } catch (err) {
      const mapped = mapSheetError(err);
      throw new Error(`${mapped.title}: ${mapped.message}`);
    }
  });
}

export async function saveEventSheetConnectionAction(
  eventId: string,
  input: SheetConnectionInput
) {
  const result = await wrapSheetAction(async () => {
    const parsed = parseGoogleSheetUrl(
      input.googleSheetUrl,
      input.googleSheetGid
    );
    return eventsRepo.updateEventSheetConnection(
      eventId,
      input.googleSheetUrl,
      parsed.gid,
      input.sheetsSyncMode
    );
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function testEventSheetConnectionAction(
  eventId: string,
  input?: SheetConnectionInput
) {
  return wrapSheetAction(async () => {
    let url = input?.googleSheetUrl?.trim();
    let gid = input?.googleSheetGid;

    if (!url) {
      const event = await eventsRepo.getEventById(eventId);
      if (!event?.googleSheetUrl.trim()) {
        throw new Error("Nenhuma Google Sheet ligada a este evento.");
      }
      url = event.googleSheetUrl;
      gid = event.googleSheetGid;
    }

    const preview = await previewSheetGuests(url, gid);
    const parsed = parseGoogleSheetUrl(url, gid);
    return { ...preview, spreadsheetId: parsed.spreadsheetId, gid: parsed.gid };
  });
}

export async function syncEventSheetAction(
  eventId: string,
  input?: SheetConnectionInput
) {
  if (input?.googleSheetUrl?.trim()) {
    const save = await saveEventSheetConnectionAction(eventId, input);
    if (!save.success) return save;
  }

  const result = await wrapSheetAction(() => syncEventGuestsFromSheet(eventId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function getSheetErrorDetails(errorMessage: string) {
  return mapSheetError(new Error(errorMessage));
}

export async function exportEventGuestsCsvAction(eventId: string) {
  return runAction(async () => {
    const guests = await guestsRepo.listGuestsByEvent(eventId);
    const { buildSheetExportCsv } = await import(
      "@/lib/events/sheets/export-csv"
    );
    return buildSheetExportCsv(guests);
  });
}
