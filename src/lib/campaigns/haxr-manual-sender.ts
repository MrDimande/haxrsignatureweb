/**
 * Sender manual HAXR — wa.me autenticado no dispositivo.
 * NÃO migrar nem registar este número na Twilio.
 */

export const HAXR_MANUAL_WHATSAPP_SENDER = {
  publicName: "HAXR Signature",
  /** E.164 sem espaços — wa.me / máscara. */
  phoneE164: "+258870883428",
  /** Apresentação humana. */
  displayPhone: "+258 87 088 3428",
  kind: "manual_authenticated_whatsapp" as const,
  provider: "manual_wa_me" as const,
} as const;

export function isHaxrManualWhatsappNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const expected = HAXR_MANUAL_WHATSAPP_SENDER.phoneE164.replace(/\D/g, "");
  return digits === expected || digits === expected.replace(/^258/, "");
}
