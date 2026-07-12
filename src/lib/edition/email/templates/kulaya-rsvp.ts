import {
  buildBrandEmailHtml,
  buildEmailDetailCard,
  buildEmailStatusHero,
  HAXR_EDITION_PRODUCT,
} from "@/lib/email/brand-shell";
import {
  EDITION_SITE_URL,
  getEditionEventBinding,
} from "@/lib/edition/registry";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

const BRAND = "HAXR Signature";
const ADMIN_BASE = "https://www.haxrsignature.com/admin/events";

function buildGuestSummary(submission: EditionRsvpSubmission): string {
  if (!submission.attending) {
    return "Não comparecerá ao evento";
  }
  if (submission.guests <= 1) {
    return "1 pessoa · apenas o convidado";
  }
  return `${submission.guests} pessoas · ${submission.guests - 1} acompanhante(s)`;
}

export function buildKulayaRsvpTeamEmail(
  submission: EditionRsvpSubmission,
  eventName: string,
  slug: string
): { subject: string; html: string } {
  const statusLabel = submission.attending
    ? "Presença confirmada"
    : "Impossibilidade registada";
  const guestSummary = buildGuestSummary(submission);
  const timestamp = new Date().toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const subject = submission.attending
    ? `${BRAND} · RSVP ✓ · ${submission.name} · Kulaya`
    : `${BRAND} · RSVP · ${submission.name} · Kulaya`;

  const binding = getEditionEventBinding(slug);
  const adminUrl = binding?.eventId
    ? `${ADMIN_BASE}/${binding.eventId}`
    : ADMIN_BASE;

  const detailRows: Array<readonly [string, string]> = [
    ...(submission.email?.trim()
      ? [
          [
            "Email",
            `<a href="mailto:${submission.email.trim()}" style="color:#c9a962;text-decoration:none;">${submission.email.trim()}</a>`,
          ] as const,
        ]
      : []),
    ...(submission.phone?.trim()
      ? [["Telefone", submission.phone.trim()] as const]
      : []),
    ["Evento", eventName],
    ["Recebido em", timestamp],
    [
      "Convite digital",
      `<a href="${EDITION_SITE_URL}/${slug}" style="color:#c9a962;text-decoration:none;">edition.haxrsignature.com/${slug}</a>`,
    ],
  ];

  const html = buildBrandEmailHtml({
    title: "Nova confirmação RSVP",
    subtitle: "Cerimónia de Kulaya · Jessica Muege",
    editionTag: "Edition · Convite digital",
    preheader: `${submission.name} — ${statusLabel}`,
    body: `<p style="margin:0;color:#8a8478;font-size:15px;line-height:1.7;">Recebemos uma nova resposta no convite digital. Os detalhes seguem abaixo.</p>
${buildEmailStatusHero(submission.attending, submission.name, guestSummary)}
${buildEmailDetailCard(detailRows)}`,
    cta: { label: "Abrir no admin", href: adminUrl },
    secondaryCta: { label: "Ver convite", href: `${EDITION_SITE_URL}/${slug}` },
    footerNote: `Notificação automática · ${HAXR_EDITION_PRODUCT}`,
    signature: true,
  });

  return { subject, html };
}
