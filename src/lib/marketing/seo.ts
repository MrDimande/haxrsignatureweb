import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const marketingPagesSeo = {
  home: {
    path: "/",
    title: "HAXR Signature | Curadoria de Eventos Exclusivos em Maputo",
    description:
      "Tranquilidade, elegância e precisão para eventos memoráveis em Maputo. Assessoria, identidade visual e tecnologia discreta com assinatura HAXR.",
    keywords: [
      "assessoria de eventos Maputo",
      "curadoria de eventos Moçambique",
      "convites digitais premium",
      "wedding planner Maputo",
      "eventos exclusivos",
    ],
  },
  assessoria: {
    path: "/assessoria-eventos",
    title: "Assessoria de Eventos — Direcção Estratégica",
    description:
      "Direcção estratégica e operacional para eventos exclusivos em Maputo. Alguém a cuidar de tudo por si — com discrição, método e presença no dia.",
    keywords: [
      "assessoria de eventos",
      "assessoria de casamentos Maputo",
      "coordenação de eventos",
      "cerimonial casamento",
      "planeamento de eventos Moçambique",
    ],
  },
  convites: {
    path: "/convites-identidade-visual",
    title: "Convites & Identidade Visual — A Primeira Impressão",
    description:
      "A experiência do evento começa antes do grande dia. Curadoria estética, convites digitais e identidade visual com assinatura HAXR em Maputo.",
    keywords: [
      "convites digitais",
      "save the date digital",
      "identidade visual eventos",
      "convite digital casamento Maputo",
      "design de convites",
    ],
  },
  convidados: {
    path: "/gestao-convidados",
    title: "Gestão de Convidados — Controlo e Clareza",
    description:
      "Saiba quem confirmou, quem falta e como cada convidado será recebido. Controlo elegante de confirmações, lugares e acolhimento em Maputo.",
    keywords: [
      "RSVP digital",
      "gestão de convidados",
      "seating plan",
      "find your seat",
      "check-in eventos",
    ],
  },
  plataforma: {
    path: "/plataforma-eventos",
    title: "Ecossistema Operacional HAXR",
    description:
      "Tecnologia invisível que sustenta a excelência HAXR. Rigor nos bastidores, elegância à frente — para eventos conduzidos com precisão.",
    keywords: [
      "gestão de eventos premium",
      "curadoria operacional eventos",
      "organização de eventos Maputo",
    ],
  },
  portfolio: {
    path: "/portfolio",
    title: "Portfólio — Histórias Reais HAXR",
    description:
      "Casamentos, save the date e celebrações assinadas HAXR Signature. Contexto, desafio, curadoria e o que ficou na memória.",
    keywords: [
      "portfólio casamentos Maputo",
      "convites digitais exemplos",
      "eventos corporativos Moçambique",
    ],
  },
  sobre: {
    path: "/sobre",
    title: "Sobre a HAXR Signature",
    description:
      "Porque acreditamos que eventos marcam histórias — e que organização e emoção devem coexistir com elegância e precisão.",
    keywords: ["HAXR Signature", "curadoria de eventos", "empresa de eventos Maputo"],
  },
  contacto: {
    path: "/contacto",
    title: "Contacto — Partilhe a Sua História",
    description:
      "Estamos prontos para ouvir a sua história. WhatsApp, email ou escritório em Maputo — cada pedido é lido com atenção e discrição.",
    keywords: ["contacto eventos Maputo", "assessoria casamento Maputo"],
  },
  insights: {
    path: "/insights",
    title: "Insights — Reflexões sobre Eventos",
    description:
      "Reflexões sobre casamentos, confirmações, assessoria e eventos corporativos em Moçambique — conhecimento editorial HAXR.",
    keywords: [
      "organização de casamentos",
      "dicas RSVP",
      "gestão de convidados",
      "eventos corporativos",
    ],
  },
  areaCliente: {
    path: "/area-cliente",
    title: "Área do Cliente HAXR",
    description:
      "O ecossistema HAXR em evolução — acompanhamento próximo hoje, portal dedicado amanhã. Cronograma, documentos e decisões com clareza.",
    keywords: ["área do cliente eventos", "HAXR Signature"],
  },
} as const;

export type MarketingPageKey = keyof typeof marketingPagesSeo;

export function marketingMetadata(key: MarketingPageKey): Metadata {
  const page = marketingPagesSeo[key];
  return buildPageMetadata(page);
}
