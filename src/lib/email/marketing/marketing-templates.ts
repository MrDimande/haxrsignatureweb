/**
 * Templates de marketing HAXR Signature — outbound Brevo.
 *
 * Categorias:
 * - consent: subscritores, leads com opt-in, clientes com consentimento
 * - cold_outreach: contactos seleccionados (fornecedores, prospects B2B)
 *
 * ATENÇÃO — cold outreach:
 * Usar apenas para contactos seleccionados e relevantes.
 * Nunca listas compradas, aleatórias ou sem contexto profissional.
 */

import {
  bullets,
  buildPlainTextEmail,
  coldOutreachNotice,
  greeting,
  HAXR_SITE_URL,
  paragraph,
  renderMarketingEmail,
} from "@/lib/email/email-renderer";
import type {
  MarketingEmailTemplate,
  MarketingSegment,
  MarketingTemplateCategory,
  RenderedMarketingTemplate,
} from "@/lib/email/email-types";

const SITE = HAXR_SITE_URL;

type TemplateBody = {
  paragraphs: string[];
  bulletItems?: string[];
  includeColdNotice?: boolean;
};

type DefineTemplateInput = {
  id: string;
  name: string;
  category: MarketingTemplateCategory;
  segments: MarketingSegment[];
  subject: string;
  preheader: string;
  headline: string;
  cta: { label: string; href: string };
  body: TemplateBody;
};

function bodyHtml(parts: string[]): string {
  return parts.join("");
}

function defineTemplate(input: DefineTemplateInput): MarketingEmailTemplate {
  const variant = input.category === "cold_outreach" ? "cold_outreach" : "consent";

  return {
    id: input.id,
    name: input.name,
    category: input.category,
    segments: input.segments,
    subject: input.subject,
    preheader: input.preheader,
    headline: input.headline,
    cta: input.cta,
    render: ({ firstName }) => {
      const blocks: string[] = [greeting(firstName)];

      if (input.body.includeColdNotice) {
        blocks.push(coldOutreachNotice());
      }

      for (const text of input.body.paragraphs) {
        blocks.push(paragraph(text));
      }

      if (input.body.bulletItems?.length) {
        blocks.push(bullets(input.body.bulletItems));
      }

      return renderMarketingEmail({
        headline: input.headline,
        preheader: input.preheader,
        bodyHtml: bodyHtml(blocks),
        cta: input.cta,
        variant,
      });
    },
    text: ({ firstName }) =>
      buildPlainTextEmail({
        firstName,
        headline: input.headline,
        paragraphs: input.body.paragraphs,
        bullets: input.body.bulletItems,
        cta: input.cta,
        variant,
      }),
  };
}

const templateDefinitions: MarketingEmailTemplate[] = [
  // ── Consent-based ──────────────────────────────────────────────

  defineTemplate({
    id: "haxr_launch",
    name: "HAXR Launch — Apresentação",
    category: "consent",
    segments: [
      "leads_site",
      "clientes_interessados",
      "casais_noivos",
      "newsletter",
    ],
    subject: "Conheça o ecossistema HAXR para eventos memoráveis",
    preheader:
      "Eventos memoráveis, organizados com elegância — convites, RSVP e gestão premium.",
    headline: "Eventos memoráveis, organizados com elegância.",
    cta: { label: "Solicitar consulta", href: `${SITE}/contacto` },
    body: {
      paragraphs: [
        "Obrigado por ter demonstrado interesse na HAXR Signature. Somos um estúdio premium de experiências digitais para casamentos e eventos exigentes — onde convites digitais, identidade visual e gestão de convidados trabalham em harmonia.",
        "Desenhamos cada detalhe com rigor editorial e discrição. A nossa equipa valida cada entrega para garantir que a experiência reflecte a importância do vosso momento.",
      ],
      bulletItems: [
        "Convites digitais premium e save the date editoriais",
        "RSVP digital e gestão de convidados centralizada",
        "QR Check-in e operação elegante no dia do evento",
        "HAXR Wedding Dashboard — em pacotes seleccionados",
      ],
    },
  }),

  defineTemplate({
    id: "haxr_concierge_intro",
    name: "HAXR Concierge — Introdução",
    category: "consent",
    segments: ["clientes_interessados", "clientes_activos", "casais_noivos"],
    subject: "HAXR Concierge: organização inteligente para eventos premium",
    preheader:
      "O assistente que organiza propostas, contratos, convidados e pagamentos.",
    headline: "Organização inteligente, no lugar certo.",
    cta: { label: "Conhecer o Concierge", href: `${SITE}/tools/haxr-concierge` },
    body: {
      paragraphs: [
        "O HAXR Concierge é o assistente inteligente que organiza propostas, contratos, convidados, pagamentos e tarefas — tudo num espaço seguro e elegante.",
        "Classifica documentos, centraliza informação e mantém o vosso evento sob controlo. Disponível em pacotes seleccionados; a equipa HAXR valida cada integração antes da activação.",
      ],
      bulletItems: [
        "Propostas e contratos organizados por evento",
        "Listas de convidados e documentos centralizados",
        "Pagamentos e tarefas com visibilidade clara",
      ],
    },
  }),

  defineTemplate({
    id: "digital_invitations_rsvp",
    name: "Convites Digitais & RSVP",
    category: "consent",
    segments: ["casais_noivos", "leads_site", "clientes_interessados"],
    subject: "Transforme convites, RSVP e convidados numa experiência digital",
    preheader:
      "Convites digitais premium, RSVP em tempo real e QR check-in.",
    headline: "Uma experiência digital à altura do vosso evento.",
    cta: {
      label: "Ver gestão de convidados",
      href: `${SITE}/gestao-convidados`,
    },
    body: {
      paragraphs: [
        "Substituam folhas dispersas e mensagens repetidas por convites digitais premium, confirmações RSVP em tempo real e check-in por QR no dia do evento.",
        "A gestão de convidados fica centralizada, elegante e fiável — com a assinatura visual HAXR em cada detalhe.",
      ],
      bulletItems: [
        "Convites digitais com identidade visual coerente",
        "RSVP digital com actualizações em tempo real",
        "QR Check-in discreto no dia do evento",
        "Find Your Seat e Photo Wall — em pacotes seleccionados",
      ],
    },
  }),

  defineTemplate({
    id: "wedding_dashboard_welcome",
    name: "Wedding Dashboard — Boas-vindas",
    category: "consent",
    segments: ["clientes_activos", "casais_noivos", "clientes_interessados"],
    subject: "Bem-vindos ao vosso Painel de Casamento HAXR",
    preheader:
      "O vosso painel exclusivo para convidados, orçamento e documentos.",
    headline: "O vosso painel exclusivo e inteligente.",
    cta: { label: "Aceder à área cliente", href: `${SITE}/area-cliente` },
    body: {
      paragraphs: [
        "Bem-vindos ao HAXR Wedding Dashboard — o espaço onde gerem convidados, orçamento, documentos e fornecedores com a mesma elegância do vosso evento.",
        "Funcionalidades como Photo Wall e Find Your Seat estão disponíveis em pacotes seleccionados. A equipa HAXR acompanha a activação do vosso painel.",
      ],
      bulletItems: [
        "Gestão de convidados e RSVP integrados",
        "Orçamento e documentos num só lugar",
        "Fornecedores e tarefas com visão clara",
      ],
    },
  }),

  defineTemplate({
    id: "soft_follow_up",
    name: "Seguimento Suave",
    category: "consent",
    segments: ["clientes_interessados", "leads_site", "casais_noivos"],
    subject: "O vosso evento, organizado com elegância",
    preheader:
      "Seguimento discreto — estamos à disposição quando fizer sentido.",
    headline: "Continuamos à vossa disposição.",
    cta: { label: "Retomar conversa", href: `${SITE}/contacto` },
    body: {
      paragraphs: [
        "Escrevemos para dar seguimento ao vosso interesse na HAXR Signature. Gostaríamos de compreender melhor a visão do vosso evento — data, dimensão e o nível de acompanhamento que procuram.",
        "Respondemos com discrição e sem pressão comercial. Se preferirem, podemos agendar uma conversa breve por videochamada ou presencialmente em Maputo.",
      ],
    },
  }),

  // ── Cold outreach (contactos seleccionados) ────────────────────

  defineTemplate({
    id: "haxr_services_intro",
    name: "HAXR — Introdução de Serviços",
    category: "cold_outreach",
    segments: ["contactos_seleccionados", "prospects_eventos"],
    subject: "Conheça a HAXR Signature",
    preheader:
      "Convites, RSVP e organização digital para eventos premium em Moçambique.",
    headline: "Experiências bem desenhadas para eventos exigentes.",
    cta: { label: "Conhecer a HAXR", href: `${SITE}/plataforma-eventos` },
    body: {
      includeColdNotice: true,
      paragraphs: [
        "A HAXR Signature desenha convites digitais premium, RSVP digital, gestão de convidados e coordenação editorial para casamentos e eventos de alto padrão.",
        "Trabalhamos com rigor, discrição e tecnologia ao serviço da narrativa do evento — sem linguagem genérica, com entrega validada pela nossa equipa.",
      ],
      bulletItems: [
        "Convites digitais e identidade visual coerente",
        "RSVP digital e QR Check-in",
        "HAXR Wedding Dashboard e HAXR Concierge — em pacotes seleccionados",
      ],
    },
  }),

  defineTemplate({
    id: "supplier_invitation",
    name: "Fornecedores — Convite à Rede",
    category: "cold_outreach",
    segments: ["fornecedores", "contactos_seleccionados", "prospects_eventos"],
    subject: "Fornecedor HAXR: faça parte de uma rede premium de eventos",
    preheader:
      "Convite respeitoso à rede de fornecedores HAXR — curadoria e eventos de alto padrão.",
    headline: "Uma rede pensada para excelência.",
    cta: { label: "Manifestar interesse", href: `${SITE}/contacto` },
    body: {
      includeColdNotice: true,
      paragraphs: [
        "A HAXR Signature está a preparar uma rede seleccionada de fornecedores para casamentos e eventos corporativos de alto padrão em Moçambique.",
        "Se a vossa empresa oferece fotografia, catering, floricultura, decoração, planeamento ou outros serviços premium, gostaríamos de conhecer o vosso portfólio com calma e sem compromisso.",
      ],
    },
  }),

  defineTemplate({
    id: "corporate_events_intro",
    name: "Eventos Corporativos — Introdução",
    category: "cold_outreach",
    segments: ["prospects_corporativos", "contactos_seleccionados"],
    subject: "Eventos memoráveis começam com uma experiência bem desenhada",
    preheader:
      "HAXR Signature — galas, lançamentos e celebrações corporativas com rigor editorial.",
    headline: "Eventos corporativos com assinatura própria.",
    cta: { label: "Solicitar apresentação", href: `${SITE}/assessoria-eventos` },
    body: {
      includeColdNotice: true,
      paragraphs: [
        "A HAXR Signature acompanha empresas em galas, lançamentos de produto, celebrações internas e eventos privados que exigem presença digital impecável e operação discreta.",
        "Desde convites digitais e RSVP até gestão de convidados e documentação — tudo preparado para reflectir o padrão da vossa marca.",
      ],
      bulletItems: [
        "Convites digitais e identidade visual corporativa",
        "RSVP digital e QR Check-in no dia do evento",
        "Orçamento, documentos e fornecedores centralizados",
      ],
    },
  }),

  defineTemplate({
    id: "cold_outreach_brand_intro",
    name: "Cold Outreach — Primeiro Contacto",
    category: "cold_outreach",
    segments: [
      "contactos_seleccionados",
      "prospects_eventos",
      "prospects_corporativos",
    ],
    subject: "Convites, RSVP e organização digital para eventos premium",
    preheader:
      "Uma breve apresentação da HAXR Signature — sem compromisso.",
    headline: "Uma breve apresentação.",
    cta: { label: "Visitar o website", href: SITE },
    body: {
      includeColdNotice: true,
      paragraphs: [
        "A HAXR Signature é um estúdio premium de experiências digitais para eventos — convites, RSVP, gestão de convidados e coordenação editorial com discrição e rigor.",
        "Se o vosso trabalho ou projecto envolve eventos de alto padrão, pode valer a pena conhecer como organizamos a experiência digital do início ao dia do evento.",
      ],
    },
  }),
];

/** Aliases — compatibilidade com campanhas e scripts anteriores */
const legacyAliases: Record<string, string> = {
  client_follow_up: "soft_follow_up",
  rsvp_digital_education: "digital_invitations_rsvp",
};

function resolveTemplateId(templateId: string): string {
  return legacyAliases[templateId] ?? templateId;
}

export const marketingTemplates: Record<string, MarketingEmailTemplate> =
  Object.fromEntries(templateDefinitions.map((t) => [t.id, t]));

for (const [alias, target] of Object.entries(legacyAliases)) {
  const source = marketingTemplates[target];
  if (source) {
    marketingTemplates[alias] = { ...source, id: alias };
  }
}

export function getMarketingTemplate(
  templateId: string
): MarketingEmailTemplate | undefined {
  return marketingTemplates[resolveTemplateId(templateId)];
}

export function listMarketingTemplates(): MarketingEmailTemplate[] {
  return templateDefinitions;
}

export function getTemplatesByCategory(
  category: MarketingTemplateCategory
): MarketingEmailTemplate[] {
  return templateDefinitions.filter((t) => t.category === category);
}

export function renderMarketingTemplate(
  templateId: string,
  firstName: string
): RenderedMarketingTemplate | null {
  const template = getMarketingTemplate(templateId);
  if (!template) return null;

  const name = firstName.trim() || "Convidado";

  return {
    subject: template.subject,
    preheader: template.preheader,
    html: template.render({ firstName: name }),
    text: template.text({ firstName: name }),
  };
}
