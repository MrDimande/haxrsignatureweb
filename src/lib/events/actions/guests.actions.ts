"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import {
  sendGuestInviteEmail,
} from "@/lib/events/services/guest-invite-email.service";
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

export async function sendGuestInviteEmailAction(
  eventId: string,
  guestId: string
) {
  const result = await runAction(async () => {
    const event = await eventsRepo.getEventById(eventId);
    if (!event) throw new Error("Evento não encontrado.");

    const guest = await guestsRepo.getGuestById(guestId);
    if (!guest || guest.eventId !== eventId) {
      throw new Error("Convidado não encontrado.");
    }

    const sent = await sendGuestInviteEmail(event, guest);
    if (sent.skipped === "no_email") {
      throw new Error("Este convidado não tem email registado.");
    }
    if (sent.skipped === "resend_not_configured") {
      throw new Error("Resend não configurado — não foi possível enviar email.");
    }
    if (!sent.sent) {
      throw new Error(sent.error ?? "Falha ao enviar convite.");
    }

    await logGuestAudit(
      guest.id,
      eventId,
      guest.name,
      "Convite reenviado por email"
    );
    return { email: guest.email };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkSendGuestInviteEmailsAction(
  eventId: string,
  guestIds: string[]
) {
  const result = await runAction(async () => {
    if (!guestIds.length) throw new Error("Seleccione pelo menos um convidado.");

    const event = await eventsRepo.getEventById(eventId);
    if (!event) throw new Error("Evento não encontrado.");

    const guests = await guestsRepo.listGuestsByEvent(eventId);
    const selected = guests.filter((guest) => guestIds.includes(guest.id));

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const guest of selected) {
      const single = await sendGuestInviteEmail(event, guest);
      if (single.sent) {
        sent++;
        await logGuestAudit(
          guest.id,
          eventId,
          guest.name,
          "Convite reenviado por email"
        );
      } else if (single.skipped) {
        skipped++;
      } else {
        failed++;
        if (single.error && errors.length < 8) {
          errors.push(`${guest.name}: ${single.error}`);
        }
      }
    }

    return { sent, skipped, failed, errors };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export type { EventGuest };
