import { buildBrandEmailHtml, buildEmailDetailCard } from "@/lib/email/brand-shell";
import { EDITION_SITE_URL } from "@/lib/edition/registry";
import {
  KULAYA_EVENT,
  KULAYA_VENUE,
} from "@/lib/edition/events/kulaya";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

const BRAND = "HAXR Signature";

function partySummary(submission: EditionRsvpSubmission): string {
  if (!submission.attending) return "Não comparecerá";
  if (submission.guests <= 1) return "1 pessoa (apenas o convidado)";
  return `${submission.guests} pessoas (${submission.guests - 1} acompanhante(s))`;
}

export function buildKulayaGuestRsvpEmail(
  submission: EditionRsvpSubmission,
  eventName: string
): { subject: string; html: string } | null {
  if (!submission.email?.trim()) return null;

  const inviteUrl = `${EDITION_SITE_URL}/jessicakulaya`;
  const guestName = submission.name.trim();

  if (submission.attending) {
    const subject = `${BRAND} · Presença confirmada · Kulaya`;
    const html = buildBrandEmailHtml({
      title: "Presença confirmada",
      subtitle: eventName,
      editionTag: "Edition · Kulaya",
      preheader: "A sua presença na cerimónia de Kulaya foi registada.",
      body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0 0 8px;">A sua confirmação foi recebida com apreço. Seguem os detalhes da cerimónia.</p>
${buildEmailDetailCard([
  ["Data", `${KULAYA_EVENT.dateLabel} · ${KULAYA_EVENT.timeLabel}`],
  ["Local", KULAYA_VENUE.full],
  ["Total", partySummary(submission)],
])}
<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#8a8478;">Guarde o passe digital no convite — pode imprimi-lo ou fazer screenshot para apresentar na recepção.</p>`,
      cta: { label: "Ver convite", href: inviteUrl },
    });
    return { subject, html };
  }

  const subject = `${BRAND} · Resposta registada · Kulaya`;
  const html = buildBrandEmailHtml({
    title: "Resposta registada",
    subtitle: eventName,
    editionTag: "Edition · Kulaya",
    preheader: "Recebemos a sua resposta sobre a cerimónia de Kulaya.",
    body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0;">Recebemos a sua resposta e agradecemos que nos tenha informado. Será sempre bem-vinda se as circunstâncias mudarem.</p>`,
  });
  return { subject, html };
}
