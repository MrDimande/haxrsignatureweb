"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import {
  evaluateEditionPublishHealthForAdminEvent,
  publishEditionInvite,
  type EvaluatePublishHealthResult,
  type PublishEditionInviteResult,
} from "@/lib/edition/publish-edition-invite";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";

/**
 * Resolves Admin event + guest count server-side.
 * Never accepts Edition event_id from the browser.
 */
const serverDeps = {
  async loadAdminEvent(adminEventId: string) {
    const event = await eventsRepo.getEventById(adminEventId);
    if (!event) return null;
    return {
      id: event.id,
      editionRegistryKey: event.editionRegistryKey,
      isActive: event.isActive,
      date: event.date,
      name: event.name,
    };
  },
  async countGuests(adminEventId: string) {
    try {
      const guests = await guestsRepo.listGuestsByEvent(adminEventId);
      return guests.length;
    } catch {
      return 0;
    }
  },
};

export async function evaluateEditionPublishHealthAction(
  adminEventId: string
) {
  return runAction(async (): Promise<EvaluatePublishHealthResult> => {
    const id = typeof adminEventId === "string" ? adminEventId.trim() : "";
    if (!id) {
      return {
        ok: false,
        code: "admin_event_not_found",
        error: "Identificador do evento Admin em falta.",
      };
    }
    return evaluateEditionPublishHealthForAdminEvent(id, serverDeps);
  });
}

export async function publishEditionInviteAction(adminEventId: string) {
  const result = await runAction(
    async (): Promise<PublishEditionInviteResult> => {
      const id = typeof adminEventId === "string" ? adminEventId.trim() : "";
      if (!id) {
        return {
          ok: false,
          code: "admin_event_not_found",
          error: "Identificador do evento Admin em falta.",
        };
      }
      return publishEditionInvite(id, serverDeps);
    }
  );

  if (result.success && result.data.ok) {
    revalidatePath(`/admin/events/${adminEventId}`);
  }

  return result;
}
