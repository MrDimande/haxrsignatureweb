"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import {
  confirmGuestsCsvImport,
  previewGuestsCsvImport,
} from "@/lib/events/services/import-csv.service";
import type { ImportPreviewResult } from "@/lib/events/services/import-preview.service";
import type { SheetGuestRow } from "@/lib/events/sheets/types";
import * as batchesRepo from "@/lib/events/repositories/guest-import-batches.repository";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

function getOperator() {
  const email = process.env.ADMIN_EMAIL?.trim() || "admin";
  return { email, userId: email };
}

export async function previewGuestImportAction(
  eventId: string,
  csvText: string,
  excludedKeys: string[] = []
) {
  return runAction(() =>
    previewGuestsCsvImport(eventId, csvText, excludedKeys)
  );
}

export async function confirmGuestImportAction(
  eventId: string,
  payload: {
    filename: string;
    rows: SheetGuestRow[];
    previewSummary: ImportPreviewResult["summary"];
    includeExisting?: boolean;
  }
) {
  const operator = getOperator();
  const result = await runAction(() =>
    confirmGuestsCsvImport(eventId, {
      filename: payload.filename,
      operatorUserId: operator.userId,
      operatorEmail: operator.email,
      rows: payload.rows,
      previewSummary: payload.previewSummary,
      includeExisting: payload.includeExisting,
    })
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function listGuestImportBatchesAction(eventId: string) {
  return runAction(() => batchesRepo.listImportBatchesByEvent(eventId));
}
