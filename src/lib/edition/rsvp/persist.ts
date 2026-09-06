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
import { generateQrToken } from "@/lib/events/tokens";
import {
  getEditionRsvpPersistenceBackend,
  insertEditionGuest,
  isEditionRsvpPersistenceConfigured,
  loadEventGuestCandidates,
  logEditionRsvpAudit,
  submitEditionRsvpRpc,
  updateEditionGuest,
} from "@/lib/edition/rsvp/persist.repository";

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

async function syncEditionGuestContactProfile(
  guestId: string,
  eventId: string,
  editionSlug: string,
): Promise<void> {
  const guest = await guestsRepo.getGuestById(guestId);
  if (!guest) return;

  await safeSyncGuestContactProfile({
    eventId,
    guest,
    source: "edition_rsvp",
    metadata: { editionSlug },
  });
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
  const notes = buildNotes({
    editionSlug: params.editionSlug,
    messageForBride: params.submission.messageForBride,
    size: params.submission.size,
    dressCodeConfirmed: params.submission.dressCodeConfirmed,
  });
  const name = params.submission.name.trim();

  let guestId: string;
  try {
    guestId = await insertEditionGuest({
      eventId: params.eventId,
      name,
      nameNormalized: params.nameNormalized,
      email: params.submission.email?.trim() ?? "",
      phone: params.submission.phone?.trim() ?? "",
      qrToken: generateQrToken(),
      status: params.status,
      plusOnes: params.plusOnes,
      guestNotes: notes,
    });
  } catch (error) {
    console.error("[edition/rsvp] direct guest insert failed");
    return {
      ok: false,
      error: error instanceof Error ? error.message : "persist_failed",
    };
  }

  await logEditionRsvpAudit({
    guestId,
    eventId: params.eventId,
    guestName: name,
    action: "RSVP Edition · novo convidado",
    details: params.submission.attending
      ? `Confirmado via edition (${params.editionSlug}) · ${params.partySize} pessoa(s)`
      : `Declinou via edition (${params.editionSlug})`,
  });

  await syncEditionGuestContactProfile(
    guestId,
    params.eventId,
    params.editionSlug,
  );

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
  const notes = buildNotes({
    editionSlug: params.editionSlug,
    messageForBride: params.submission.messageForBride,
    size: params.submission.size,
    dressCodeConfirmed: params.submission.dressCodeConfirmed,
  });

  const nextEmail = mergeNonEmptyContact(
    params.existing.email,
    params.submission.email,
  );
  const nextPhone = mergeNonEmptyContact(
    params.existing.phone,
    params.submission.phone,
  );
  const nextName = params.submission.name.trim();

  let updated = false;
  try {
    updated = await updateEditionGuest({
      guestId: params.guestId,
      eventId: params.eventId,
      name: nextName,
      nameNormalized: normalizeGuestName(nextName),
      email: nextEmail,
      phone: nextPhone,
      status: params.status,
      plusOnes: params.submission.attending ? params.plusOnes : 0,
      guestNotes: notes,
    });
  } catch (error) {
    console.error("[edition/rsvp] matched guest update failed");
    return {
      ok: false,
      error: error instanceof Error ? error.message : "persist_failed",
    };
  }

  if (!updated) {
    console.error("[edition/rsvp] matched guest update returned no row");
    return { ok: false, error: "persist_failed" };
  }

  await logEditionRsvpAudit({
    guestId: params.guestId,
    eventId: params.eventId,
    guestName: nextName,
    action: "RSVP Edition · actualizado",
    details: params.submission.attending
      ? `Confirmado via edition (${params.editionSlug}) · ${params.partySize} pessoa(s)`
      : `Declinou via edition (${params.editionSlug})`,
  });

  await syncEditionGuestContactProfile(
    params.guestId,
    params.eventId,
    params.editionSlug,
  );

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
  submission: EditionRsvpSubmission,
  options?: { presentedProxySecret?: string },
): Promise<EditionRsvpPersistResult> {
  const writeGate = evaluateEditionRsvpWriteGate({
    resolvedSlug: submission.slug,
    presentedProxySecret: options?.presentedProxySecret,
  });
  if (!writeGate.allowed) {
    console.warn(
      `[edition/rsvp] persist blocked by write gate reason=${writeGate.reason} mode=${writeGate.mode}`,
    );
    return {
      ok: false,
      error: "edition_rsvp_writes_disabled",
      skipped: "write_gate",
    };
  }

  const backend = getEditionRsvpPersistenceBackend();
  if (!isEditionRsvpPersistenceConfigured()) {
    return {
      ok: false,
      error: `${backend}_not_configured`,
      skipped: backend,
    };
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
    candidates,
  );

  if (match.kind === "cross_event") {
    return { ok: false, error: "guest_event_mismatch" };
  }

  if (match.kind === "ambiguous") {
    console.warn(
      `[edition/rsvp] ambiguous guest match via=${match.via} count=${match.count}`,
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
      binding.eventId,
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

  let payload;
  try {
    payload = await submitEditionRsvpRpc({
      eventId: binding.eventId,
      name: submission.name.trim(),
      nameNormalized,
      attending: submission.attending,
      partySize,
      editionSlug: binding.slug,
      email: submission.email?.trim() ?? "",
      phone: submission.phone?.trim() ?? "",
      messageForBride: submission.messageForBride?.trim() ?? "",
      size: submission.size?.trim() ?? "",
      dressCodeConfirmed: submission.dressCodeConfirmed ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "persist_failed";
    console.error(`[edition/rsvp] ${backend} persist failed:`, message);
    return { ok: false, error: message };
  }

  if (!payload?.ok || !payload.guestId || !payload.status) {
    return {
      ok: false,
      error: payload?.error ?? "persist_failed",
    };
  }

  await syncEditionGuestContactProfile(
    payload.guestId,
    binding.eventId,
    binding.slug,
  );

  return {
    ok: true,
    guestId: payload.guestId,
    status: payload.status,
    created: Boolean(payload.created),
    partySize: payload.partySize ?? partySize,
    plusOnes: payload.plusOnes ?? Math.max(0, partySize - 1),
  };
}
