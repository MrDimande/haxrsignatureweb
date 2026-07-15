import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeGuestName } from "@/lib/events/normalize";
import { getEditionEventBinding } from "@/lib/edition/registry";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { safeSyncGuestContactProfile } from "@/lib/events/repositories/event-contact-profiles.repository";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";
import {
  matchEditionRsvpGuest,
  mergeNonEmptyContact,
  wouldRpcNameMatchWrongContact,
  type EditionGuestMatchCandidate,
} from "@/lib/edition/rsvp/guest-match";
import { evaluateEditionRsvpWriteGate } from "@/lib/edition/rsvp/write-gate";
import { asTableRows } from "@/lib/supabase/helpers";
import type { Tables } from "@/lib/supabase/database.types";
import { generateQrToken } from "@/lib/events/tokens";

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

export { wouldRpcNameMatchWrongContact };

function buildNotes(input: {
  editionSlug: string;
  messageForBride?: string;
  size?: string;
  dressCodeConfirmed?: boolean | null;
}): string {
  let notes = [
    input.editionSlug || "edition",
    "convite digital",
    new Date().toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" }),
  ]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" · ");

  const message = input.messageForBride?.trim().slice(0, 280) ?? "";
  const size = input.size?.trim().slice(0, 12) ?? "";
  if (message) notes += `\nMensagem: ${message}`;
  if (size) notes += `\nTamanho: ${size}`;
  if (input.dressCodeConfirmed != null) {
    notes += `\nDress code: ${
      input.dressCodeConfirmed
        ? "confirmado (uma peça rosa)"
        : "não confirmado"
    }`;
  }
  return notes;
}

async function loadEventGuestCandidates(
  eventId: string
): Promise<EditionGuestMatchCandidate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select(
      "id, event_id, name, name_normalized, email, phone, guest_source, qr_token"
    )
    .eq("event_id", eventId);

  if (error) {
    console.error("[edition/rsvp] guest lookup failed");
    throw new Error(error.message);
  }

  return asTableRows<"guests">(data).map((row: Tables<"guests">) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    nameNormalized: row.name_normalized ?? normalizeGuestName(row.name),
    email: row.email ?? "",
    phone: row.phone ?? "",
    guestSource: row.guest_source ?? "manual",
    qrToken: row.qr_token ?? undefined,
  }));
}

async function insertEditionGuestDirect(params: {
  eventId: string;
  submission: EditionRsvpSubmission;
  editionSlug: string;
  partySize: number;
  plusOnes: number;
  status: "confirmed" | "declined";
  nameNormalized: string;
}): Promise<EditionRsvpPersistResult> {
  const supabase = createAdminClient();
  const notes = buildNotes({
    editionSlug: params.editionSlug,
    messageForBride: params.submission.messageForBride,
    size: params.submission.size,
    dressCodeConfirmed: params.submission.dressCodeConfirmed,
  });
  const name = params.submission.name.trim();

  const { data, error } = await supabase
    .from("guests")
    .insert({
      event_id: params.eventId,
      name,
      name_normalized: params.nameNormalized,
      email: params.submission.email?.trim() ?? "",
      phone: params.submission.phone?.trim() ?? "",
      qr_token: generateQrToken(),
      status: params.status,
      plus_ones: params.plusOnes,
      guest_notes: notes,
      guest_source: "edition_rsvp",
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[edition/rsvp] direct guest insert failed");
    return { ok: false, error: error?.message ?? "persist_failed" };
  }

  const guestId = (data as { id: string }).id;

  await supabase.from("guest_audit_log").insert({
    guest_id: guestId,
    event_id: params.eventId,
    guest_name: name,
    action: "RSVP Edition · novo convidado",
    details: params.submission.attending
      ? `Confirmado via edition (${params.editionSlug}) · ${params.partySize} pessoa(s)`
      : `Declinou via edition (${params.editionSlug})`,
  } as never);

  const guest = await guestsRepo.getGuestById(guestId);
  if (guest) {
    await safeSyncGuestContactProfile({
      eventId: params.eventId,
      guest,
      source: "edition_rsvp",
      metadata: { editionSlug: params.editionSlug },
    });
  }

  return {
    ok: true,
    guestId,
    status: params.status,
    created: true,
    partySize: params.partySize,
    plusOnes: params.plusOnes,
  };
}

async function updateMatchedGuest(params: {
  guestId: string;
  eventId: string;
  submission: EditionRsvpSubmission;
  existing: EditionGuestMatchCandidate;
  editionSlug: string;
  partySize: number;
  plusOnes: number;
  status: "confirmed" | "declined";
}): Promise<EditionRsvpPersistResult> {
  const supabase = createAdminClient();
  const notes = buildNotes({
    editionSlug: params.editionSlug,
    messageForBride: params.submission.messageForBride,
    size: params.submission.size,
    dressCodeConfirmed: params.submission.dressCodeConfirmed,
  });

  const nextEmail = mergeNonEmptyContact(
    params.existing.email,
    params.submission.email
  );
  const nextPhone = mergeNonEmptyContact(
    params.existing.phone,
    params.submission.phone
  );
  const nextName = params.submission.name.trim();

  const { data, error } = await supabase
    .from("guests")
    .update({
      name: nextName,
      name_normalized: normalizeGuestName(nextName),
      email: nextEmail,
      phone: nextPhone,
      status: params.status,
      plus_ones: params.submission.attending ? params.plusOnes : 0,
      guest_notes: notes,
      guest_source: "edition_rsvp",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", params.guestId)
    .eq("event_id", params.eventId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[edition/rsvp] matched guest update failed");
    return { ok: false, error: error?.message ?? "persist_failed" };
  }

  await supabase.from("guest_audit_log").insert({
    guest_id: params.guestId,
    event_id: params.eventId,
    guest_name: nextName,
    action: "RSVP Edition · actualizado",
    details: params.submission.attending
      ? `Confirmado via edition (${params.editionSlug}) · ${params.partySize} pessoa(s)`
      : `Declinou via edition (${params.editionSlug})`,
  } as never);

  const guest = await guestsRepo.getGuestById(params.guestId);
  if (guest) {
    await safeSyncGuestContactProfile({
      eventId: params.eventId,
      guest,
      source: "edition_rsvp",
      metadata: { editionSlug: params.editionSlug },
    });
  }

  return {
    ok: true,
    guestId: params.guestId,
    status: params.status,
    created: false,
    partySize: params.partySize,
    plusOnes: params.plusOnes,
  };
}

export async function persistEditionRsvp(
  submission: EditionRsvpSubmission
): Promise<EditionRsvpPersistResult> {
  const writeGate = evaluateEditionRsvpWriteGate();
  if (!writeGate.allowed) {
    console.warn(
      `[edition/rsvp] persist blocked by write gate reason=${writeGate.reason} mode=${writeGate.mode}`
    );
    return {
      ok: false,
      error: "edition_rsvp_writes_disabled",
      skipped: "write_gate",
    };
  }

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
  const plusOnes = submission.attending ? Math.max(0, partySize - 1) : 0;
  const status = submission.attending ? "confirmed" : "declined";
  const nameNormalized = normalizeGuestName(submission.name);

  let candidates: EditionGuestMatchCandidate[];
  try {
    candidates = await loadEventGuestCandidates(binding.eventId);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "guest_lookup_failed",
    };
  }

  const match = matchEditionRsvpGuest(
    {
      eventId: binding.eventId,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
    },
    candidates
  );

  if (match.kind === "cross_event") {
    return { ok: false, error: "guest_event_mismatch" };
  }

  if (match.kind === "ambiguous") {
    console.warn(
      `[edition/rsvp] ambiguous guest match via=${match.via} count=${match.count}`
    );
    return { ok: false, error: "ambiguous_guest_match" };
  }

  if (match.kind === "unique") {
    if (
      match.via === "phone" ||
      match.via === "email" ||
      match.via === "guest_id" ||
      match.via === "qr_token"
    ) {
      return updateMatchedGuest({
        guestId: match.guest.id,
        eventId: binding.eventId,
        submission,
        existing: match.guest,
        editionSlug: binding.slug,
        partySize,
        plusOnes,
        status,
      });
    }
  }

  if (
    wouldRpcNameMatchWrongContact(
      nameNormalized,
      submission,
      candidates,
      binding.eventId
    )
  ) {
    return insertEditionGuestDirect({
      eventId: binding.eventId,
      submission,
      editionSlug: binding.slug,
      partySize,
      plusOnes,
      status,
      nameNormalized,
    });
  }

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
