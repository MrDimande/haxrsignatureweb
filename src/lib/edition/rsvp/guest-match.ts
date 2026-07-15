import {
  normalizeEmail,
  normalizeGuestName,
  normalizePhone,
} from "@/lib/events/normalize";

export type EditionGuestMatchCandidate = {
  id: string;
  eventId: string;
  name: string;
  nameNormalized: string;
  email: string;
  phone: string;
  guestSource: string;
  qrToken?: string;
};

export type EditionRsvpMatchInput = {
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  guestId?: string;
  qrToken?: string;
};

export type EditionGuestMatchResult =
  | { kind: "none" }
  | {
      kind: "unique";
      guest: EditionGuestMatchCandidate;
      via: "guest_id" | "qr_token" | "phone" | "email" | "name_edition";
    }
  | { kind: "ambiguous"; via: "phone" | "email" | "name_edition" | "qr_token"; count: number }
  | { kind: "cross_event"; via: "guest_id" };

function sameEvent(
  guest: EditionGuestMatchCandidate,
  eventId: string
): boolean {
  return guest.eventId === eventId;
}

/**
 * Localiza guest existente para RSVP Edition.
 * Ordem: guest_id → qr_token → telefone → email → nome (edition_rsvp).
 * Nome isolado nunca tem prioridade sobre contacto.
 * Ambíguo → sem actualização silenciosa.
 */
export function matchEditionRsvpGuest(
  input: EditionRsvpMatchInput,
  candidates: EditionGuestMatchCandidate[]
): EditionGuestMatchResult {
  const eventId = input.eventId;
  const inEvent = candidates.filter((g) => sameEvent(g, eventId));

  if (input.guestId?.trim()) {
    const id = input.guestId.trim();
    const anywhere = candidates.find((g) => g.id === id);
    if (anywhere && !sameEvent(anywhere, eventId)) {
      return { kind: "cross_event", via: "guest_id" };
    }
    const hit = inEvent.find((g) => g.id === id);
    if (hit) {
      return { kind: "unique", guest: hit, via: "guest_id" };
    }
  }

  if (input.qrToken?.trim()) {
    const token = input.qrToken.trim();
    const hits = inEvent.filter((g) => g.qrToken && g.qrToken === token);
    if (hits.length === 1) {
      return { kind: "unique", guest: hits[0], via: "qr_token" };
    }
    if (hits.length > 1) {
      return { kind: "ambiguous", via: "qr_token", count: hits.length };
    }
  }

  const phoneKey = input.phone ? normalizePhone(input.phone) : "";
  if (phoneKey.length >= 9) {
    const hits = inEvent.filter(
      (g) => g.phone && normalizePhone(g.phone) === phoneKey
    );
    if (hits.length === 1) {
      return { kind: "unique", guest: hits[0], via: "phone" };
    }
    if (hits.length > 1) {
      return { kind: "ambiguous", via: "phone", count: hits.length };
    }
  }

  const emailKey = input.email ? normalizeEmail(input.email) : "";
  if (emailKey.includes("@")) {
    const hits = inEvent.filter(
      (g) => g.email && normalizeEmail(g.email) === emailKey
    );
    if (hits.length === 1) {
      return { kind: "unique", guest: hits[0], via: "email" };
    }
    if (hits.length > 1) {
      return { kind: "ambiguous", via: "email", count: hits.length };
    }
  }

  const nameKey = normalizeGuestName(input.name);
  if (nameKey) {
    // Se veio telefone/email e não houve match único, não cair no nome
    // (evita actualizar o guest errado com o mesmo nome e contacto diferente).
    const phoneAttempted = phoneKey.length >= 9;
    const emailAttempted = emailKey.includes("@");
    if (phoneAttempted || emailAttempted) {
      return { kind: "none" };
    }

    const hits = inEvent.filter(
      (g) =>
        g.guestSource === "edition_rsvp" &&
        g.nameNormalized === nameKey
    );
    if (hits.length === 1) {
      return { kind: "unique", guest: hits[0], via: "name_edition" };
    }
    if (hits.length > 1) {
      return { kind: "ambiguous", via: "name_edition", count: hits.length };
    }
  }

  return { kind: "none" };
}

/** True when RPC name-only match would update a guest with a different contact. */
export function wouldRpcNameMatchWrongContact(
  nameNormalized: string,
  submission: Pick<EditionRsvpMatchInput, "email" | "phone">,
  candidates: EditionGuestMatchCandidate[],
  eventId: string
): boolean {
  const phoneKey = submission.phone ? normalizePhone(submission.phone) : "";
  const emailKey = submission.email ? normalizeEmail(submission.email) : "";
  const phoneAttempted = phoneKey.length >= 9;
  const emailAttempted = emailKey.includes("@");
  if (!phoneAttempted && !emailAttempted) return false;

  return candidates.some((g) => {
    if (g.eventId !== eventId) return false;
    if (g.guestSource !== "edition_rsvp") return false;
    if (g.nameNormalized !== nameNormalized) return false;

    if (phoneAttempted && g.phone && normalizePhone(g.phone) !== phoneKey) {
      return true;
    }
    if (emailAttempted && g.email && normalizeEmail(g.email) !== emailKey) {
      return true;
    }
    return false;
  });
}

/** Não sobrescreve valores existentes com strings vazias. */
export function mergeNonEmptyContact(
  existing: string,
  incoming: string | undefined
): string {
  const next = incoming?.trim() ?? "";
  if (!next) return existing;
  return next;
}
