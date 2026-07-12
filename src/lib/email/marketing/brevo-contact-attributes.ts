import type { HAXRLead } from "@/lib/email/email-types";

// TODO: normalização E.164 completa para mercados HAXR (+258 MZ, +244 AO, +27 ZA, +351 PT).
// Até lá, telefone fica apenas no Supabase; não enviar SMS ao Brevo sem E.164 validado.

const E164_STRICT = /^\+[1-9]\d{7,14}$/;

/** Devolve número E.164 apenas se já estiver num formato aceite pelo Brevo SMS. */
export function resolveBrevoSmsAttribute(
  phone: string | undefined | null
): string | undefined {
  if (!phone?.trim()) return undefined;
  const compact = phone.replace(/[\s\-().]/g, "");
  if (!E164_STRICT.test(compact)) return undefined;
  return compact;
}

export function isBrevoPhoneValidationError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("invalid phone") ||
    lower.includes("phone number") ||
    lower.includes("sms")
  );
}

/** Atributos Brevo para sync de marketing — SMS omitido se inválido ou não normalizado. */
export function buildBrevoMarketingContactAttributes(
  contact: HAXRLead
): Record<string, string> {
  const attributes: Record<string, string> = {
    FIRSTNAME: contact.firstName,
    LASTNAME: contact.lastName ?? "",
    COMPANY: contact.companyName ?? "",
    LEAD_SOURCE: contact.source,
    SEGMENT: contact.segment,
    CONSENT_STATUS: contact.consentStatus,
  };

  const sms = resolveBrevoSmsAttribute(contact.phone);
  if (sms) {
    attributes.SMS = sms;
  }

  return attributes;
}

/** Remove SMS dos atributos (retry após rejeição Brevo). */
export function omitBrevoSmsAttribute(
  attributes: Record<string, string>
): Record<string, string> {
  const rest = { ...attributes };
  delete rest.SMS;
  return rest;
}
