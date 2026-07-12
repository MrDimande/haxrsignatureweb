import type { MarketingCampaignDraft } from "@/lib/email/email-types";

/**
 * Rascunhos de campanha — NÃO enviar automaticamente.
 * Cold outreach: validar contactos manualmente antes de qualquer envio.
 */
export const marketingCampaignDrafts: MarketingCampaignDraft[] = [
  {
    id: "campaign_haxr_launch_clientes",
    name: "HAXR Launch — Clientes",
    templateId: "haxr_launch",
    audienceSegments: ["leads_site", "casais_noivos", "clientes_interessados"],
    goal: "Apresentar o ecossistema HAXR a contactos com consentimento.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_LIST_LEADS", "BREVO_CLIENTS_LIST_ID"],
  },
  {
    id: "campaign_haxr_concierge_educacao",
    name: "HAXR Concierge — Educação",
    templateId: "haxr_concierge_intro",
    audienceSegments: ["clientes_interessados", "clientes_activos"],
    goal:
      "Explicar o HAXR Concierge — propostas, contratos, listas e pagamentos.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_CLIENTS_LIST_ID", "BREVO_LIST_LEADS"],
  },
  {
    id: "campaign_fornecedores_convite",
    name: "Fornecedores HAXR — Convite",
    templateId: "supplier_invitation",
    audienceSegments: ["fornecedores", "contactos_seleccionados"],
    goal: "Convidar fornecedores seleccionados à rede HAXR.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_SUPPLIERS_LIST_ID"],
  },
  {
    id: "campaign_convites_rsvp",
    name: "Convites Digitais & RSVP",
    templateId: "digital_invitations_rsvp",
    audienceSegments: ["casais_noivos", "leads_site"],
    goal: "Promover convites digitais, RSVP e gestão de convidados.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_LIST_LEADS", "BREVO_CLIENTS_LIST_ID"],
  },
  {
    id: "campaign_services_intro",
    name: "HAXR — Introdução de Serviços",
    templateId: "haxr_services_intro",
    audienceSegments: ["contactos_seleccionados", "prospects_eventos"],
    goal: "Apresentação respeitosa a prospects seleccionados.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_MARKETING_LIST_ID"],
  },
  {
    id: "campaign_corporate_intro",
    name: "Eventos Corporativos — Introdução",
    templateId: "corporate_events_intro",
    audienceSegments: ["prospects_corporativos", "contactos_seleccionados"],
    goal: "Apresentar HAXR a empresas para eventos corporativos.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_CLIENTS_LIST_ID", "BREVO_MARKETING_LIST_ID"],
  },
  {
    id: "campaign_soft_follow_up",
    name: "Seguimento Suave — Leads",
    templateId: "soft_follow_up",
    audienceSegments: ["clientes_interessados", "leads_site"],
    goal: "Seguimento discreto após introdução ou pedido de informação.",
    status: "draft",
    suggestedListEnvKeys: ["BREVO_LIST_LEADS"],
  },
];

export function getCampaignDraft(
  campaignId: string
): MarketingCampaignDraft | undefined {
  return marketingCampaignDrafts.find((c) => c.id === campaignId);
}
