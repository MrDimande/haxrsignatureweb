/**
 * Builder de SMS curto para convites.
 * Mantém o corpo compacto e inclui a URL do convite.
 */

export type BuildInvitationSmsInput = {
  guestName: string;
  coupleNames: string;
  invitationUrl: string;
  /** Prefixo opcional (ex.: nome do evento curto). */
  eventHint?: string;
};

export type BuiltInvitationSms = {
  body: string;
  invitationUrl: string;
};

/**
 * Constrói SMS curto em PT.
 * Formato alvo ~1 segmento GSM-7 quando possível.
 */
export function buildInvitationSmsMessage(
  input: BuildInvitationSmsInput
): BuiltInvitationSms {
  const guest = input.guestName.trim() || "Convidado";
  const couple = input.coupleNames.trim() || "HAXR";
  const url = input.invitationUrl.trim();
  if (!url) {
    throw new Error("invitationUrl é obrigatória no SMS de convite.");
  }

  const hint = input.eventHint?.trim();
  const body = hint
    ? `Ola ${guest}! Convite ${couple} (${hint}): ${url}`
    : `Ola ${guest}! Convite ${couple}: ${url}`;

  return { body, invitationUrl: url };
}
