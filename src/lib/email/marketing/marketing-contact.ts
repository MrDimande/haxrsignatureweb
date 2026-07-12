/**
 * Contrato de contacto de marketing HAXR Signature.
 */

import type {
  ConsentStatus,
  MarketingContactRole,
  MarketingSegment,
} from "@/lib/email/email-types";

export const MARKETING_CONSENT_TEXT =
  "Aceito receber comunicações da HAXR Signature sobre serviços, eventos e novidades. Posso cancelar a qualquer momento." as const;

export const MARKETING_LEAD_SOURCES = [
  "site_contact_form",
  "quote_request",
  "supplier_join_form",
  "newsletter_signup",
  "manual_import_future",
  "whatsapp_future",
  "instagram_future",
] as const;

export type MarketingLeadSource = (typeof MARKETING_LEAD_SOURCES)[number];

export type MarketingContact = {
  id?: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  role?: MarketingContactRole;
  segment: MarketingSegment;
  source: MarketingLeadSource | string;
  consentStatus: ConsentStatus;
  consentText?: string;
  consentAt?: string;
  city?: string;
  eventType?: string;
  eventDate?: string;
  message?: string;
  createdAt?: string;
  /** Campos extra (ex. estimatedGuests, portfolioUrl) */
  metadata?: Record<string, string | number | boolean | null>;
};

export type CaptureMarketingContactResult = {
  ok: true;
  contactId: string | null;
  stored: boolean;
  brevo: {
    synced: boolean;
    skipped?: string;
  };
};

const WEDDING_PROJECT_TYPES = new Set([
  "convite-digital",
  "identidade-visual",
  "assessoria",
  "coordenacao",
  "experiencias",
  "privado",
  "social",
  "casamento",
]);

const CORPORATE_PROJECT_TYPES = new Set(["corporativo"]);

/** Mapeia tipo de evento/projecto → segmento de marketing */
export function resolveSegmentFromEventType(
  eventType: string | undefined | null
): MarketingSegment {
  const normalized = eventType?.trim().toLowerCase() ?? "";
  if (WEDDING_PROJECT_TYPES.has(normalized)) {
    return "casais_noivos";
  }
  if (CORPORATE_PROJECT_TYPES.has(normalized)) {
    return "prospects_corporativos";
  }
  return "clientes_interessados";
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName?: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: "Convidado" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function toHaxrLead(contact: MarketingContact) {
  return {
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    companyName: contact.companyName,
    role: contact.role ?? inferRoleFromSegment(contact.segment),
    source: contact.source,
    segment: contact.segment,
    consentStatus: contact.consentStatus,
    createdAt: contact.createdAt,
  };
}

function inferRoleFromSegment(
  segment: MarketingSegment
): MarketingContactRole {
  switch (segment) {
    case "fornecedores":
    case "empresas_eventos":
      return "supplier";
    case "newsletter":
      return "newsletter";
    case "casais_noivos":
      return "couple";
    case "prospects_corporativos":
      return "event_company";
    default:
      return "lead";
  }
}
