/**
 * Acções admin para sugestões de grupo (party parser).
 */

import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import {
  confirmPartySuggestions,
  dismissPartySuggestions,
} from "@/lib/events/repositories/guest-party-members.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { PartyParseResult } from "@/lib/events/party-parser";

export async function confirmPartySuggestion(
  eventId: string,
  guestId: string,
  plusOnes?: number
): Promise<void> {
  const guest = await guestsRepo.getGuestById(guestId);
  if (!guest || guest.eventId !== eventId) {
    throw new Error("Convidado não encontrado neste evento.");
  }

  const resolvedPlus =
    plusOnes !== undefined ? plusOnes : guest.plusOnes;

  await confirmPartySuggestions(eventId, guestId, resolvedPlus);

  await logGuestAudit(
    guestId,
    eventId,
    guest.name,
    "Grupo RSVP — confirmado",
    `Sugestão de grupo confirmada${plusOnes !== undefined ? ` (+${resolvedPlus})` : ""}.`
  );
}

export async function dismissPartySuggestion(
  eventId: string,
  guestId: string
): Promise<void> {
  const guest = await guestsRepo.getGuestById(guestId);
  if (!guest || guest.eventId !== eventId) {
    throw new Error("Convidado não encontrado neste evento.");
  }

  await dismissPartySuggestions(eventId, guestId);

  await logGuestAudit(
    guestId,
    eventId,
    guest.name,
    "Grupo RSVP — ignorado",
    "Sugestão de grupo ignorada pelo admin."
  );
}

export function parsePartyReviewItemId(itemId: string): string {
  const [source, ...rest] = itemId.split(":");
  if (source !== "party_parser") {
    throw new Error("Item de grupo inválido.");
  }
  const guestId = rest.join(":");
  if (!guestId) throw new Error("Item de grupo inválido.");
  return guestId;
}

export function suggestedPlusOnesFromParse(
  parse: PartyParseResult | null | undefined
): number | undefined {
  if (!parse) return undefined;
  return parse.suggestedPlusOnes > 0 ? parse.suggestedPlusOnes : undefined;
}
