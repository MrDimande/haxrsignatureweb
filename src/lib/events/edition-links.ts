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

export type EditionRsvpOperationsCopy = {
  title: string;
  description: string;
  pendingWithoutEmailHint: string;
  exportLabel: string;
  reminderDeadlineLabel?: string;
};

/** Keeps RSVP operations tied to the current event. */
export function getEditionRsvpOperationsCopy(
  registryKey: string | null | undefined
): EditionRsvpOperationsCopy {
  if (registryKey === "rose-elegance" || registryKey === "jessicachadelingerie") {
    return {
      title: "Monitorização da despedida",
      description:
        "Acompanhe confirmações do convite digital, lembrete manual por WhatsApp (sem email) e exportação final para a Jessica.",
      pendingWithoutEmailHint:
        "Use WhatsApp para relembrar manualmente (prazo RSVP: 20 de Julho de 2026).",
      exportLabel: "Exportar CSV (RSVP + presentes)",
      reminderDeadlineLabel: "20 de Julho de 2026",
    };
  }
  if (registryKey === "baby-aylla-couture") {
    return {
      title: "Monitorização do aniversário",
      description:
        "Acompanhe confirmações de presença para celebrar a Baby Aylla, envie lembretes adequados ao convite e exporte a lista de convidados.",
      pendingWithoutEmailHint:
        "Use WhatsApp para um lembrete de confirmação de presença.",
      exportLabel: "Exportar CSV (convidados + presentes)",
    };
  }
  return {
    title: "Monitorização RSVP",
    description:
      "Acompanhe confirmações do convite digital, envie lembretes manuais por WhatsApp e exporte a lista de convidados quando necessário.",
    pendingWithoutEmailHint: "Use WhatsApp para relembrar manualmente.",
    exportLabel: "Exportar CSV (RSVP + presentes)",
  };
}
