import type { EventGuest, ManagedEvent } from "@/lib/events/types";

/** Slug Edition público por chave de catálogo (admin ↔ convite digital) */
export const EDITION_INVITE_SLUG_BY_REGISTRY: Record<string, string> = {
  "rose-elegance": "jessicachadelingerie",
};

const EDITION_BASE_URL =
  process.env.NEXT_PUBLIC_EDITION_SITE_URL?.trim() ||
  "https://edition.haxrsignature.com";

export function resolveEditionInviteSlug(
  registryKey: string
): string | null {
  return EDITION_INVITE_SLUG_BY_REGISTRY[registryKey.trim()] ?? null;
}

export function buildEditionInviteUrl(registryKey: string): string | null {
  const slug = resolveEditionInviteSlug(registryKey);
  if (!slug) return null;
  return `${EDITION_BASE_URL.replace(/\/$/, "")}/${slug}`;
}

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
