import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const marketingPagesSeo = {
  home: {
    path: "/",
    title:
      "HAXR Signature | Assessoria de Eventos, Convites Digitais e Gestão de Convidados",
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
      "cerimonial casamento",
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
  plusMemories: {
    path: "/plus-memories",
    title: "Plus Memories — Álbum Colectivo para Casamentos e Eventos",
    description:
      "Plus Memories transforma convidados em participantes da memória do evento: QR Code, desafios interactivos, fotografias, vídeos e álbum colectivo HAXR Signature.",
    keywords: [
      "Plus Memories",
      "álbum colectivo casamento",
      "fotografias convidados casamento",
      "vídeos convidados casamento",
      "QR Code casamento",
      "desafios casamento convidados",
      "experiência digital eventos",
      "HAXR Signature",
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
      "Guias e reflexões sobre casamentos, RSVP, gestão de convidados, Find Your Seat e assessoria de eventos, conhecimento editorial HAXR Signature.",
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
      "Acompanhamento próximo do seu evento com a HAXR Signature cronograma, documentos e decisões com clareza e discrição.",
    keywords: ["área do cliente eventos", "HAXR Signature cliente"],
  },
  signUp: {
    path: "/sign-up",
    title: "Criar Conta Gratuita — Painel de Casamento | HAXR",
    description:
      "Registe-se gratuitamente na HAXR: Style Quiz, checklist, orçamento, convidados, fornecedores e painel editorial do vosso casamento.",
    keywords: [
      "criar conta casamento",
      "painel casamento gratuito",
      "wedding dashboard Moçambique",
      "HAXR Signature registo",
    ],
  },
  styleQuiz: {
    path: "/style-quiz",
    title: "Style Quiz — Descubra a Identidade do seu Casamento | HAXR Signature",
    description: "Faça o nosso teste interativo de estilo e descubra a assinatura estética ideal para o seu grande dia.",
    keywords: ["style quiz casamento", "estilo de casamento", "identidade visual casamento", "HAXR Signature quiz"],
  },
  weddingChecklist: {
    path: "/tools/wedding-checklist",
    title: "Checklist do Casal — Tarefas do Evento | HAXR Signature",
    description: "Organize todas as metas e tarefas para o seu casamento com o nosso checklist interativo premium.",
    keywords: ["checklist casamento", "planeamento casamento", "tarefas noiva", "HAXR Signature checklist"],
  },
  budgetTracker: {
    path: "/tools/budget-tracker",
    title: "Calculadora de Orçamento e Despesas | HAXR Signature",
    description: "Faça o controlo financeiro detalhado das despesas e orçamentos do seu casamento com a nossa calculadora.",
    keywords: ["calculadora casamento", "orçamento casamento", "despesas casamento", "HAXR Signature budget"],
  },
  guestList: {
    path: "/tools/guest-list",
    title: "Lista de Convidados e RSVP | HAXR Signature",
    description: "Gira a sua lista de convidados, grupos e confirmações RSVP em tempo real com a nossa ferramenta premium.",
    keywords: ["lista de convidados", "gestão RSVP", "convidados casamento", "HAXR Signature guest list"],
  },
  vendorManager: {
    path: "/tools/vendor-manager",
    title: "Gestor de Fornecedores e Contratos | HAXR Signature",
    description: "Acompanhe e gira os contratos, pagamentos e contactos de todos os seus fornecedores num único local.",
    keywords: ["fornecedores casamento", "gestor fornecedores", "contratos casamento", "HAXR Signature vendors"],
  },
  visionBoards: {
    path: "/tools/vision-boards",
    title: "Vision Board — Painel de Inspiração | HAXR Signature",
    description: "Crie moodboards visuais elegantes e organize as referências estéticas e paletas de cores do seu casamento.",
    keywords: ["moodboard casamento", "inspiração casamento", "vision board", "HAXR Signature vision board"],
  },
  weddingWebsiteSetup: {
    path: "/tools/wedding-website/setup",
    title: "Criador de Website de Casamento | HAXR Signature",
    description: "Configure o website personalizado do seu casamento escolhendo um dos nossos designs editoriais exclusivos.",
    keywords: ["website de casamento", "criar site de casamento", "site noivos", "HAXR Signature website"],
  },
  cashRegistrySetup: {
    path: "/tools/cash-registry/setup",
    title: "Lista de Presentes e Honeymoon Fund | HAXR Signature",
    description: "Crie a sua lista de presentes virtuais e fundos de lua de mel com elegância e discrição para os seus convidados.",
    keywords: ["lista de presentes", "honeymoon fund", "prendas casamento", "HAXR Signature registry"],
  },
  ferramentas: {
    path: "/ferramentas",
    title: "Ferramentas de Casamento — RSVP, Orçamento e Concierge | HAXR",
    description:
      "Hub de ferramentas HAXR: Concierge, lista de convidados, orçamento, checklist, vision boards, RSVP e check-in — incluídas nos pacotes premium em Maputo.",
    keywords: [
      "ferramentas casamento",
      "RSVP digital Maputo",
      "lista convidados casamento",
      "orçamento casamento",
      "wedding planning tools",
    ],
  },
  faq: {
    path: "/faq",
    title: "Perguntas Frequentes — Assessoria, Convites e Plataforma HAXR",
    description:
      "Respostas sobre assessoria de eventos, convites digitais, gestão de convidados, Find Your Seat e plataforma HAXR Signature em Moçambique.",
    keywords: ["FAQ casamento Maputo", "perguntas assessoria eventos", "RSVP digital FAQ"],
  },
  experiencias: {
    path: "/experiencias",
    title: "Experiências Digitais — Convites e Save the Date | HAXR",
    description:
      "Demonstrações ao vivo de convites digitais e save the date assinados HAXR — RSVP, música e identidade editorial.",
    keywords: ["convite digital demo", "save the date Maputo", "experiências casamento"],
  },
  submitWedding: {
    path: "/portfolio/submeter",
    title: "Submeter Casamento — Portfólio HAXR Signature",
    description:
      "Candidature o vosso casamento à curadoria editorial HAXR. Histórias reais para inspirar casais em Maputo.",
    keywords: ["submeter casamento", "real wedding Moçambique", "portfólio casamento"],
  },
  guias: {
    path: "/guias",
    title: "Guias Gratuitos — Checklist, RSVP e Orçamento | HAXR",
    description:
      "PDFs editoriais gratuitos: checklist 12 meses, guia RSVP e modelo de orçamento para casamentos em Maputo.",
    keywords: ["checklist casamento", "guia RSVP", "orçamento casamento Moçambique"],
  },
  forPros: {
    path: "/for-pros",
    title: "Para Profissionais — Rede de Fornecedores HAXR Signature",
    description:
      "Junte-se à rede curada HAXR em Maputo: floristas, fotógrafos, espaços e fornecedores premium referenciados em eventos assinados.",
    keywords: [
      "fornecedores casamento Maputo",
      "rede fornecedores eventos",
      "parceiros HAXR Signature",
      "wedding vendors Moçambique",
    ],
  },
  haxrConcierge: {
    path: "/tools/haxr-concierge",
    title: "HAXR Concierge — IA para Organizar o Casamento | HAXR Signature",
    description:
      "Reencaminhe propostas, listas e pagamentos por email ou WhatsApp. A IA HAXR organiza tudo no painel, com validação humana.",
    keywords: [
      "concierge casamento",
      "organização casamento IA",
      "HAXR Concierge",
      "assistente casamento Maputo",
    ],
  },
} as const;

export type MarketingPageKey = keyof typeof marketingPagesSeo;

export function marketingMetadata(key: MarketingPageKey): Metadata {
  const page = marketingPagesSeo[key];
  return buildPageMetadata(page);
}
