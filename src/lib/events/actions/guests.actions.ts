"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { EventGuest, GuestFormData, GuestStatus } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

export async function saveGuestAction(
  eventId: string,
  data: GuestFormData,
  id?: string
) {
  const result = await runAction(() =>
    id
      ? guestsRepo.updateGuest(id, data)
      : guestsRepo.createGuest(eventId, data)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function deleteGuestAction(eventId: string, guestId: string) {
  const result = await runAction(() => guestsRepo.deleteGuest(guestId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function assignSeatAction(
  eventId: string,
  guestId: string,
  seatId: string | null
) {
  const result = await runAction(() =>
    guestsRepo.assignSeatToGuest(guestId, seatId)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function updateGuestStatusAction(
  eventId: string,
  guestId: string,
  status: GuestStatus
) {
  const result = await runAction(() =>
    guestsRepo.updateGuestStatus(guestId, status)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function confirmGuestAction(eventId: string, guestId: string) {
  const result = await runAction(() => guestsRepo.confirmGuest(guestId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function checkInGuestAction(eventId: string, guestId: string) {
  const result = await runAction(() => guestsRepo.checkInGuest(guestId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkConfirmGuestsAction(
  eventId: string,
  guestIds: string[]
) {
  const result = await runAction(() =>
    guestsRepo.bulkConfirmGuests(eventId, guestIds)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkCheckInGuestsAction(
  eventId: string,
  guestIds: string[]
) {
  const result = await runAction(() =>
    guestsRepo.bulkCheckInGuests(eventId, guestIds)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkAssignTableAction(
  eventId: string,
  guestIds: string[],
  tableName: string
) {
  const result = await runAction(() =>
    guestsRepo.bulkAssignTable(eventId, guestIds, tableName)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function importGuestsCsvAction(eventId: string, csvText: string) {
  const result = await runAction(async () => {
    const { importGuestsFromCsv } = await import(
      "@/lib/events/services/import-csv.service"
    );
    return importGuestsFromCsv(eventId, csvText);
  });
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function listGuestAuditAction(eventId: string) {
  const { listGuestAuditByEvent } = await import(
    "@/lib/events/repositories/guest-audit.repository"
  );
  return runAction(() => listGuestAuditByEvent(eventId));
}

export async function mergeGuestsAction(
  eventId: string,
  primaryId: string,
  secondaryIds: string[]
) {
  const result = await runAction(() =>
    guestsRepo.mergeGuests(eventId, primaryId, secondaryIds)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export type { EventGuest };
