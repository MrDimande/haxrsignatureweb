import type { EventGuest, ManagedEvent } from "@/lib/events/types";
import {
  buildEditionInviteUrl,
  EDITION_INVITE_CATALOG,
} from "@/lib/edition/invite-catalog";

export {
  buildEditionInviteUrl,
  resolveEditionInviteSlug,
  getEditionInviteRef,
  resolveEditionInviteAssociation,
  isAuthorizedEditionInviteUrl,
  getAuthorizedEditionOrigin,
} from "@/lib/edition/invite-catalog";

/**
 * @deprecated Prefer EDITION_INVITE_CATALOG / resolveEditionInviteSlug.
 * Mantido para compatibilidade com imports existentes.
 */
export const EDITION_INVITE_SLUG_BY_REGISTRY: Record<string, string> =
  Object.fromEntries(
    Object.values(EDITION_INVITE_CATALOG)
      .filter((ref) => ref.status !== "draft")
      .map((ref) => [ref.registryKey, ref.inviteSlug])
  );

export function buildEditionOpenRsvpReminderMessage(
  event: ManagedEvent,
  guest: EventGuest,
  registryKey: string,
  options?: { deadlineLabel?: string }
): string | null {
  const inviteUrl = buildEditionInviteUrl(registryKey);
  if (!inviteUrl) return null;

  const date = event.date
    ? new Date(event.date).toLocaleDateString("pt-MZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Maputo",
      })
    : "em breve";

  const deadline = options?.deadlineLabel
    ? `Confirme até *${options.deadlineLabel}*.`
    : "Confirme a sua presença o quanto antes.";

  return [
    `Olá ${guest.name},`,
    "",
    `Ainda não recebemos a sua confirmação para *${event.name}* (${date}).`,
    event.location ? `Local: ${event.location}` : "",
    "",
    deadline,
    "",
    `Convite digital: ${inviteUrl}`,
    "",
    "Com carinho,",
    "Equipa HAXR Signature",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildEditionWhatsAppUrl(
  phone: string,
  message: string
): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const normalized = digits.startsWith("258")
    ? digits
    : digits.startsWith("0")
      ? `258${digits.slice(1)}`
      : `258${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
