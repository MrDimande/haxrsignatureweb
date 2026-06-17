const BRAND = "HAXR Signature";
const DOMAIN = "haxrsignature.com";

/** Caixa principal — recebe formulários, orçamentos e respostas de clientes. */
export const PRIMARY_INBOX = `hello@${DOMAIN}`;

/**
 * Endereços de envio via Resend (não precisam de mailbox individual).
 * Na Spaceship, encaminhar aliases para hello@ quando possível.
 */
export const haxrMailboxes = {
  hello: `hello@${DOMAIN}`,
  eventos: `eventos@${DOMAIN}`,
  convites: `convites@${DOMAIN}`,
  financeiro: `financeiro@${DOMAIN}`,
  rsvp: `rsvp@${DOMAIN}`,
  noreply: `noreply@${DOMAIN}`,
  info: `info@${DOMAIN}`,
} as const;

export type EmailChannel = keyof typeof haxrMailboxes;

const channelLabels: Record<EmailChannel, string> = {
  hello: BRAND,
  eventos: `${BRAND} · Eventos`,
  convites: `${BRAND} · Convites`,
  financeiro: `${BRAND} · Financeiro`,
  rsvp: `${BRAND} · RSVP`,
  noreply: BRAND,
  info: `${BRAND} · Informações`,
};

/** Formato aceite pelo Resend: `Nome <email@dominio.com>` */
export function formatFrom(
  channel: EmailChannel,
  displayName?: string
): string {
  const name = displayName ?? channelLabels[channel];
  return `${name} <${haxrMailboxes[channel]}>`;
}

/** Destino interno para notificações (formulários, alertas). */
export function getNotifyInbox(): string {
  return process.env.CONTACT_NOTIFY_EMAIL?.trim() || PRIMARY_INBOX;
}
