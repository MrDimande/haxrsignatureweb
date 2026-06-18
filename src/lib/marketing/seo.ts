import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const marketingPagesSeo = {
  home: {
    path: "/",
    title:
      "HAXR Signature | Assessoria de Eventos, Convites Digitais e Gestão de Convidados em Maputo",
    description:
      "Assessoria de eventos, convites digitais para casamentos, RSVP, Find Your Seat e gestão de convidados, Moçambique. Organização premium com assinatura HAXR.",
    keywords: [
      "HAXR Signature",
      "assessoria de eventos",
      "convites digitais",
      "gestão de convidados",
      "find your seat",
      "seating plan",
      "organização de eventos",
      "wedding planner",
      "coordenação de eventos",
      "plataforma de eventos",
      "gestão de convidados",
      "RSVP digital",
      "RSVP casamento",
      "confirmação de presença digital",
      "find your seat",
      "check-in eventos",
      "check-in QR code eventos",
      "coordenação de eventos",
      "coordenação no dia",
      "coordenação de casamentos",
      "casamento",
      "lobolo",
      "noivado",
      "eventos corporativos",
      "eventos exclusivos",
      "identidade visual eventos",
      "design de convites",
      "design de convites casamento",
      "criação de convites digitais",
      "convites digitais para casamento",
      "convite interativo casamento",
      "save the date",
      "save the date digital",
      "RSVP digital",
      "RSVP casamento",
      "confirmação de presença digital",
      "gestão de convidados",
      "gestão de convidados casamento",
      "lista de convidados digital",
      "find your seat",
      "find your seat casamento",
      "seating plan",
      "seating plan casamento",
      "plano de mesas casamento",
    ],
  },
  assessoria: {
    path: "/assessoria-eventos",
    title:
      "Assessoria de Eventos — Casamentos, Lobolos e Celebrações",
    description:
      "Assessoria de eventos e casamentos: planeamento, fornecedores, orçamento, cronograma e coordenação no dia. HAXR Signature — curadoria exclusiva em Moçambique.",
    keywords: [
      "assessoria de eventos",
      "assessoria de casamentos",
      "organização de casamentos",
      "wedding planner",
      "wedding planner Moçambique",
      "planeamento de eventos",
      "coordenação de casamentos",
      "cerimonial casamento Maputo",
      "curadoria de eventos exclusivos",
    ],
  },
  convites: {
    path: "/convites-identidade-visual",
    title:
      "Convites Digitais para Casamento — Save the Date e Identidade Visual",
    description:
      "Criação de convites digitais premium para casamentos, lobolos e noivados em Maputo. RSVP, save the date, galeria, música, QR Code e design personalizado HAXR Signature.",
    keywords: [
      "convites digitais",
      "convite digital casamento",
      "convites digitais Moçambique",
      "save the date digital",
      "convite digital lobolo",
      "convite interativo casamento",
      "identidade visual eventos",
      "design de convites casamento",
      "criação de convites digitais",
    ],
  },
  convidados: {
    path: "/gestao-convidados",
    title:
      "Gestão de Convidados - RSVP Digital, Find Your Seat e Check-in",
    description:
      "RSVP digital, seating plan, Find Your Seat, check-in com QR Code e lista de convidados para casamentos e eventos. Tecnologia HAXR Signature para organização sem stress.",
    keywords: [
      "gestão de convidados",
      "RSVP digital",
      "RSVP casamento",
      "confirmação de presença digital",
      "find your seat",
      "find your seat casamento",
      "seating plan casamento",
      "plano de mesas casamento",
      "check-in eventos QR code",
      "lista de convidados digital",
      "organização de convidados Maputo",
    ],
  },
  plataforma: {
    path: "/plataforma-eventos",
    title:
      "Plataforma de Eventos HAXR — Operação, Convidados e Documentos",
    description:
      "Ecossistema operacional HAXR Signature: gestão de eventos, convidados, fornecedores, documentos e relatórios. Tecnologia premium para equipas de eventos em Moçambique.",
    keywords: [
      "plataforma de eventos",
      "gestão de eventos premium",
      "software eventos Maputo",
      "organização de eventos Maputo",
      "gestão de convidados eventos",
      "HAXR Signature plataforma",
    ],
  },
  portfolio: {
    path: "/portfolio",
    title: "Portfólio — Casamentos e Convites Digitais HAXR Signature",
    description:
      "Casamentos, save the date e celebrações assinadas HAXR Signature em Maputo. Exemplos reais de convites digitais, assessoria e experiências memoráveis.",
    keywords: [
      "portfólio casamentos Maputo",
      "convites digitais exemplos",
      "casamento Maputo convite digital",
      "eventos corporativos Moçambique",
      "HAXR Signature portfólio",
    ],
  },
  sobre: {
    path: "/sobre",
    title: "Sobre a HAXR Signature — Curadoria de Eventos com assinatura",
    description:
      "Conheça a HAXR Signature: assessoria, design e tecnologia para eventos exclusivos com assinatura premium. Elegância, discrição e precisão em cada celebração.",
    keywords: [
      "HAXR Signature",
      "empresa de eventos",
      "curadoria de eventos",
      "quem somos HAXR",
    ],
  },
  contacto: {
    path: "/contacto",
    title: "Contacto — Solicitar Proposta de Evento ou Convite Digital",
    description:
      "Fale com a HAXR Signature sobre assessoria de eventos, convites digitais ou gestão de convidados. WhatsApp, email e escritório em Maputo, Moçambique.",
    keywords: [
      "contacto eventos",
      "orçamento convite digital",
      "assessoria casamento",
      "HAXR Signature contacto",
    ],
  },
  insights: {
    path: "/insights",
    title: "Insights — Organização de Casamentos e Eventos em Moçambique",
    description:
      "Guias e reflexões sobre casamentos, RSVP, gestão de convidados, Find Your Seat e assessoria de eventos em Maputo — conhecimento editorial HAXR Signature.",
    keywords: [
      "organização de casamentos",
      "dicas RSVP casamento",
      "gestão de convidados",
      "find your seat eventos",
      "assessoria eventos Moçambique",
    ],
  },
  areaCliente: {
    path: "/area-cliente",
    title: "Área do Cliente HAXR Signature",
    description:
      "Acompanhamento próximo do seu evento com a HAXR Signature — cronograma, documentos e decisões com clareza e discrição.",
    keywords: ["área do cliente eventos", "HAXR Signature cliente"],
  },
} as const;

export type MarketingPageKey = keyof typeof marketingPagesSeo;

export function marketingMetadata(key: MarketingPageKey): Metadata {
  const page = marketingPagesSeo[key];
  return buildPageMetadata(page);
}
