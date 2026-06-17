"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import { generateEventFindSeatQrDataUrl } from "@/lib/events/qr";
import { buildFindSeatUrl } from "@/lib/events/tokens";
import type { EventFormData, ManagedEvent } from "@/lib/events/types";

export async function getEventsAction() {
  return runAction(() => eventsRepo.listEvents());
}

export async function saveEventAction(data: EventFormData, id?: string) {
  const result = await runAction(() =>
    id ? eventsRepo.updateEvent(id, data) : eventsRepo.createEvent(data)
  );
  if (result.success) {
    revalidatePath("/admin/events");
    if (id) revalidatePath(`/admin/events/${id}`);
  }
  return result;
}

export async function archiveEventAction(id: string) {
  const result = await runAction(() => eventsRepo.archiveEvent(id));
  if (result.success) {
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/admin/dashboard");
  }
  return result;
}

export async function deleteEventAction(id: string) {
  const result = await runAction(() => eventsRepo.deleteEvent(id));
  if (result.success) {
    revalidatePath("/admin/events");
    revalidatePath("/admin/dashboard");
  }
  return result;
}

export async function getEventFindSeatQrAction(eventId: string) {
  return runAction(async () => {
    const event = await eventsRepo.getEventById(eventId);
    if (!event) throw new Error("Evento não encontrado.");
    const dataUrl = await generateEventFindSeatQrDataUrl(eventId);
    return {
      dataUrl,
      url: buildFindSeatUrl(eventId, event.findSeatCode),
      code: event.findSeatCode,
    };
  });
}

export type { ManagedEvent };
