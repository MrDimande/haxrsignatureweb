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
import {
  FAREWELL_EVENT,
  FAREWELL_VENUE,
} from "@/lib/edition/events/farewell";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

const BRAND = "HAXR Signature";
const ADMIN_BASE = "https://www.haxrsignature.com/admin/events";

function formatDressCodeAlert(confirmed?: boolean): string {
  if (confirmed === undefined) return "";
  if (confirmed) {
    return `<p style="margin:16px 0 0;padding:12px 16px;border:1px solid rgba(197,158,102,0.35);background:rgba(197,158,102,0.08);color:#8a8478;font-size:13px;line-height:1.6;">✓ Dress code confirmado — uma peça rosa (complementada com branco).</p>`;
  }
  return `<p style="margin:16px 0 0;padding:12px 16px;border:1px solid rgba(208,72,123,0.35);background:rgba(208,72,123,0.08);color:#b85c6a;font-size:13px;line-height:1.6;">⚠ Dress code não confirmado no formulário — convém relembrar a convidada.</p>`;
}

export function buildFarewellRsvpTeamEmail(
  submission: EditionRsvpSubmission,
  eventName: string,
  slug: string
): { subject: string; html: string } {
  const statusLabel = submission.attending
    ? "Presença confirmada"
    : "Impossibilidade registada";
  const timestamp = new Date().toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const subject = submission.attending
    ? `${BRAND} · RSVP ✓ · ${submission.name} · Despedida`
    : `${BRAND} · RSVP · ${submission.name} · Despedida`;

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
    ...(submission.size?.trim()
      ? [["Tamanho (opcional)", submission.size.trim()] as const]
      : []),
    ...(submission.messageForBride?.trim()
      ? [["Mensagem para a Jessica", submission.messageForBride.trim()] as const]
      : []),
    ["Evento", eventName],
    ["Recebido em", timestamp],
    [
      "Convite digital",
      `<a href="${EDITION_SITE_URL}/${slug}" style="color:#c9a962;text-decoration:none;">edition.haxrsignature.com/${slug}</a>`,
    ],
  ];

  const guestSummary = submission.attending
    ? "1 convidada · evento íntimo (sem acompanhantes)"
    : "Não comparecerá";

  const html = buildBrandEmailHtml({
    title: "Nova confirmação · Despedida de Solteira",
    subtitle: "Rose Elegance Farewell · Jessica Muege",
    editionTag: "Edition · Convite digital",
    preheader: `${submission.name} — ${statusLabel}`,
    body: `<p style="margin:0;color:#8a8478;font-size:15px;line-height:1.7;">Recebemos uma nova resposta no convite da despedida. Os detalhes seguem abaixo.</p>
${buildEmailStatusHero(submission.attending, submission.name, guestSummary)}
${formatDressCodeAlert(submission.dressCodeConfirmed)}
${buildEmailDetailCard(detailRows)}`,
    cta: { label: "Abrir no admin", href: adminUrl },
    secondaryCta: { label: "Ver convite", href: `${EDITION_SITE_URL}/${slug}` },
    footerNote: `Notificação automática · ${HAXR_EDITION_PRODUCT}`,
    signature: true,
  });

  return { subject, html };
}

export function buildFarewellGuestRsvpEmail(
  submission: EditionRsvpSubmission,
  eventName: string,
  slug: string
): { subject: string; html: string } | null {
  if (!submission.email?.trim()) return null;

  const inviteUrl = `${EDITION_SITE_URL}/${slug}`;
  const guestName = submission.name.trim();

  if (submission.attending) {
    const subject = `${BRAND} · Presença confirmada · Despedida de Solteira`;
    const html = buildBrandEmailHtml({
      title: "Estamos à sua espera",
      subtitle: eventName,
      editionTag: "Edition · Rose Elegance",
      preheader:
        "A sua presença na despedida da Jessica foi registada com carinho.",
      body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0 0 8px;">A sua confirmação completa este ritual de passagem. Seguem os detalhes do encontro.</p>
${buildEmailDetailCard([
  [
    "Data",
    `${FAREWELL_EVENT.dateIso.split("-").reverse().join("/")} · ${FAREWELL_EVENT.timeLabel}`,
  ],
  ["Local", FAREWELL_VENUE.full],
  ["Dress code", "Uma peça rosa (obrigatório) · complementar com branco"],
])}
<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#8a8478;">Guarde este email e volte ao convite digital para rever o dress code, localização e sugestões de presente.</p>`,
      cta: { label: "Ver convite", href: inviteUrl },
    });
    return { subject, html };
  }

  const subject = `${BRAND} · Resposta registada · Despedida de Solteira`;
  const html = buildBrandEmailHtml({
    title: "Resposta registada",
    subtitle: eventName,
    editionTag: "Edition · Rose Elegance",
    preheader: "Recebemos a sua resposta sobre a despedida da Jessica.",
    body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0;">Sentiremos a sua falta — obrigada por avisar com carinho. Será sempre bem-vinda se as circunstâncias mudarem.</p>`,
  });
  return { subject, html };
}
