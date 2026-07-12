import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeGuestName } from "@/lib/events/normalize";
import { getEditionEventBinding } from "@/lib/edition/registry";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { safeSyncGuestContactProfile } from "@/lib/events/repositories/event-contact-profiles.repository";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

export type EditionRsvpPersistResult =
  | {
      ok: true;
      guestId: string;
      status: "confirmed" | "declined";
      created: boolean;
      partySize: number;
      plusOnes: number;
    }
  | {
      ok: false;
      error: string;
      skipped?: string;
    };

export async function persistEditionRsvp(
  submission: EditionRsvpSubmission
): Promise<EditionRsvpPersistResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "supabase_not_configured", skipped: "supabase" };
  }

  const binding = getEditionEventBinding(submission.slug);
  if (!binding) {
    return {
      ok: false,
      error: "event_not_linked",
      skipped: "missing_event_id",
    };
  }

  const partySize = submission.attending ? submission.guests : 0;
  const nameNormalized = normalizeGuestName(submission.name);

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("submit_edition_rsvp", {
    p_event_id: binding.eventId,
    p_name: submission.name.trim(),
    p_name_normalized: nameNormalized,
    p_attending: submission.attending,
    p_party_size: partySize,
    p_edition_slug: binding.slug,
    p_email: submission.email?.trim() ?? "",
    p_phone: submission.phone?.trim() ?? "",
    p_message_for_bride: submission.messageForBride?.trim() ?? "",
    p_size: submission.size?.trim() ?? "",
    p_dress_code_confirmed: submission.dressCodeConfirmed ?? null,
  } as never);

  if (error) {
    console.error("[edition/rsvp] Supabase persist failed:", error.message);
    return { ok: false, error: error.message };
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    guestId?: string;
    status?: "confirmed" | "declined";
    created?: boolean;
    partySize?: number;
    plusOnes?: number;
  } | null;

  if (!payload?.ok || !payload.guestId || !payload.status) {
    return {
      ok: false,
      error: payload?.error ?? "persist_failed",
    };
  }

  const guest = await guestsRepo.getGuestById(payload.guestId);
  if (guest) {
    await safeSyncGuestContactProfile({
      eventId: binding.eventId,
      guest,
      source: "edition_rsvp",
      metadata: { editionSlug: binding.slug },
    });
  }

  return {
    ok: true,
    guestId: payload.guestId,
    status: payload.status,
    created: Boolean(payload.created),
    partySize: payload.partySize ?? partySize,
    plusOnes: payload.plusOnes ?? Math.max(0, partySize - 1),
  };
}
