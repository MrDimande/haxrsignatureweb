/** Tipos partilhados — marketing outbound Brevo (não Concierge inbound). */

export type ConsentStatus = "granted" | "pending" | "denied" | "unknown";

export type MarketingContactRole =
  | "lead"
  | "client"
  | "supplier"
  | "newsletter"
  | "couple"
  | "event_company"
  | "other";

/**
 * Segmentos de audiência.
 *
 * Cold outreach (contactos_seleccionados, prospects_*):
 * usar apenas para contactos seleccionados e relevantes —
 * NUNCA listas compradas ou aleatórias.
 */
export type MarketingSegment =
  | "clientes_interessados"
  | "casais_noivos"
  | "fornecedores"
  | "empresas_eventos"
  | "leads_site"
  | "newsletter"
  | "clientes_activos"
  | "clientes_inactivos"
  | "contactos_seleccionados"
  | "prospects_eventos"
  | "prospects_corporativos";

export type MarketingTemplateCategory = "consent" | "cold_outreach";

export type HAXRLead = {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  role: MarketingContactRole;
  source: string;
  segment: MarketingSegment;
  consentStatus: ConsentStatus;
  createdAt?: string;
};

export type HAXRClientContact = HAXRLead & {
  role: "client";
  segment: "clientes_interessados" | "clientes_activos" | "clientes_inactivos";
};

export type HAXRSupplierContact = HAXRLead & {
  role: "supplier";
  segment: "fornecedores" | "empresas_eventos" | "contactos_seleccionados";
};

export type HAXRNewsletterSubscriber = HAXRLead & {
  role: "newsletter";
  segment: "newsletter";
  consentStatus: "granted";
};

export type MarketingEmailTemplate = {
  id: string;
  name: string;
  category: MarketingTemplateCategory;
  segments: MarketingSegment[];
  subject: string;
  preheader: string;
  headline: string;
  cta: { label: string; href: string };
  /** HTML completo gerado pelo renderer */
  render: (params: { firstName: string }) => string;
  /** Plain-text fallback para deliverability */
  text: (params: { firstName: string }) => string;
};

export type RenderedMarketingTemplate = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export type SendEmailOutcome =
  | { ok: true; messageId?: string }
  | { ok: true; mock: true; reason: string }
  | { ok: false; error: string };

export type CampaignDraftStatus = "draft" | "ready" | "sent";

export type MarketingCampaignDraft = {
  id: string;
  name: string;
  templateId: string;
  audienceSegments: MarketingSegment[];
  goal: string;
  status: CampaignDraftStatus;
  /** IDs de listas Brevo sugeridas — resolver em runtime */
  suggestedListEnvKeys: string[];
};
