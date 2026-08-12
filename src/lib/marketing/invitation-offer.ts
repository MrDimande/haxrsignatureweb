export const invitationOccasions = [
  {
    id: "casamento",
    label: "Casamento & Lobolo",
    note: "Uma narrativa completa, do primeiro anúncio ao acolhimento no grande dia.",
  },
  {
    id: "noivado",
    label: "Noivado",
    note: "O primeiro sim transformado numa experiência digital íntima e memorável.",
  },
  {
    id: "aniversario",
    label: "Aniversários",
    note: "Celebrações pessoais com carácter, ritmo e uma identidade que não se repete.",
  },
  {
    id: "graduacao",
    label: "Graduações",
    note: "Conquistas apresentadas com distinção, contexto e clareza para cada convidado.",
  },
  {
    id: "corporativo",
    label: "Corporativo",
    note: "Experiências institucionais alinhadas à marca, protocolo e operação do evento.",
  },
] as const;

export type InvitationOccasionId = (typeof invitationOccasions)[number]["id"];

export const invitationCapabilities = [
  { id: "digital", label: "Experiência digital responsiva" },
  { id: "artDirection", label: "Direcção de arte personalizada" },
  { id: "rsvp", label: "RSVP integrado" },
  { id: "location", label: "Localização e programa" },
  { id: "music", label: "Ambiente musical" },
  { id: "gallery", label: "Galeria editorial" },
  { id: "story", label: "Narrativa do evento" },
  { id: "guestControl", label: "Painel de convidados" },
  { id: "qr", label: "Credenciação por QR Code" },
  { id: "seating", label: "HAXR Seating" },
  { id: "memories", label: "Memórias do Nosso Dia" },
  { id: "identity", label: "Sistema de identidade visual" },
  { id: "support", label: "Acompanhamento HAXR" },
] as const;

export type InvitationCapabilityId = (typeof invitationCapabilities)[number]["id"];
export type ComparisonLevel = "included" | "optional" | "none";

export type InvitationPackage = {
  id: string;
  occasion: InvitationOccasionId;
  name: string;
  tier: string;
  subtitle: string;
  description: string;
  price: number | null;
  priceLabel: string;
  featured?: boolean;
  features: readonly string[];
  details: readonly string[];
  included: readonly InvitationCapabilityId[];
  optional: readonly InvitationCapabilityId[];
};

export const invitationPackages: readonly InvitationPackage[] = [
  {
    id: "prologo",
    occasion: "casamento",
    name: "Prólogo",
    tier: "Essencial de autor",
    subtitle: "O primeiro gesto, desenhado com intenção.",
    description:
      "Uma presença digital elegante para apresentar o evento, orientar os convidados e recolher confirmações sem ruído.",
    price: 7999,
    priceLabel: "7.999 MT",
    features: [
      "Convite digital mobile-first",
      "Direcção de arte HAXR",
      "RSVP integrado",
      "Mapa e informações essenciais",
      "Música e contagem decrescente",
      "Peça digital para WhatsApp",
    ],
    details: [
      "Composição visual exclusiva a partir do conceito do evento",
      "Optimização para telemóveis, tablets e desktop",
      "Até duas rondas de refinamento editorial",
      "Publicação e teste técnico antes da entrega",
    ],
    included: ["digital", "artDirection", "rsvp", "location", "music"],
    optional: ["gallery", "story", "identity", "support"],
  },
  {
    id: "elo",
    occasion: "casamento",
    name: "Elo",
    tier: "Experiência Signature",
    subtitle: "A história do casal ganha ritmo, imagem e presença.",
    description:
      "A experiência recomendada para casais que querem unir narrativa, identidade e controlo de convidados num único percurso digital.",
    price: 15999,
    priceLabel: "15.999 MT",
    featured: true,
    features: [
      "Tudo do Prólogo",
      "Narrativa editorial do casal",
      "Galeria de memórias",
      "Programa interactivo",
      "Painel de RSVP e convidados",
      "Controlo de acompanhantes",
      "Direcção de arte expandida",
    ],
    details: [
      "Arquitectura de conteúdo em capítulos",
      "Galeria optimizada para desempenho mobile",
      "Lista digital e visão consolidada das confirmações",
      "Até quatro rondas de refinamento editorial",
    ],
    included: [
      "digital",
      "artDirection",
      "rsvp",
      "location",
      "music",
      "gallery",
      "story",
      "guestControl",
      "support",
    ],
    optional: ["qr", "seating", "memories", "identity"],
  },
  {
    id: "legado",
    occasion: "casamento",
    name: "Legado",
    tier: "Alta-Costura Digital",
    subtitle: "Uma obra digital completa, antes, durante e depois do evento.",
    description:
      "O nível mais profundo da assinatura HAXR: narrativa cinemática, identidade integral e módulos operacionais para uma recepção impecável.",
    price: 25000,
    priceLabel: "25.000 MT",
    features: [
      "Tudo do Elo",
      "Abertura cinemática personalizada",
      "Credenciação individual por QR",
      "HAXR Seating e Find Your Seat",
      "Memórias do Nosso Dia, sob activação",
      "Sistema de identidade visual",
      "Acompanhamento premium até ao evento",
    ],
    details: [
      "Direcção criativa e motion design definidos em conceito",
      "Organização de grupos, mesas e acolhimento digital",
      "Álbum colaborativo por QR Code avaliado em proposta",
      "Rondas de refinamento e suporte definidos na proposta",
    ],
    included: invitationCapabilities
      .map((capability) => capability.id)
      .filter((capability) => capability !== "memories"),
    optional: ["memories"],
  },
  {
    id: "promessa",
    occasion: "noivado",
    name: "Promessa",
    tier: "Anúncio íntimo",
    subtitle: "A elegância certa para anunciar o compromisso.",
    description:
      "Uma experiência concisa para partilhar a data, o lugar e a emoção do primeiro capítulo.",
    price: 5999.99,
    priceLabel: "5.999,99 MT",
    features: [
      "Convite digital mobile-first",
      "Direcção de arte personalizada",
      "RSVP integrado",
      "Mapa e contagem decrescente",
      "Curadoria musical",
      "Cápsula de três fotografias",
    ],
    details: [
      "Peça digital para partilha por WhatsApp",
      "Até duas rondas de refinamento",
      "Teste técnico antes da publicação",
    ],
    included: ["digital", "artDirection", "rsvp", "location", "music"],
    optional: ["gallery", "story", "identity"],
  },
  {
    id: "o-sim",
    occasion: "noivado",
    name: "O Sim",
    tier: "Narrativa Signature",
    subtitle: "Do anúncio ao Save the Date, sem perder o fio da história.",
    description:
      "Uma jornada visual mais completa para apresentar o compromisso e preparar os convidados para o próximo capítulo.",
    price: 12999.99,
    priceLabel: "12.999,99 MT",
    featured: true,
    features: [
      "Tudo da Promessa",
      "Save the Date integrado",
      "Galeria editorial expandida",
      "Narrativa do casal",
      "Programa e dress code",
      "Painel de convidados",
      "Acompanhamento HAXR",
    ],
    details: [
      "Arquitectura de conteúdo em capítulos",
      "Controlo de lotação e acompanhantes",
      "Até quatro rondas de refinamento",
    ],
    included: [
      "digital",
      "artDirection",
      "rsvp",
      "location",
      "music",
      "gallery",
      "story",
      "guestControl",
      "support",
    ],
    optional: ["qr", "memories", "identity"],
  },
  {
    id: "momento",
    occasion: "aniversario",
    name: "Momento",
    tier: "Celebração essencial",
    subtitle: "Um convite singular para um marco pessoal.",
    description:
      "Informação clara, presença visual e confirmação integrada para celebrar sem recorrer a modelos genéricos.",
    price: 5999,
    priceLabel: "5.999 MT",
    features: [
      "Convite digital mobile-first",
      "Direcção de arte personalizada",
      "RSVP integrado",
      "Mapa e contagem decrescente",
      "Curadoria musical",
      "Galeria curta do celebrante",
    ],
    details: ["Peça para WhatsApp", "Até duas rondas de refinamento", "Teste técnico antes da publicação"],
    included: ["digital", "artDirection", "rsvp", "location", "music", "gallery"],
    optional: ["story", "guestControl", "identity"],
  },
  {
    id: "celebra",
    occasion: "aniversario",
    name: "Celebra",
    tier: "Experiência editorial",
    subtitle: "A história, os convidados e o ritmo da celebração num só lugar.",
    description:
      "Uma presença digital expandida para comemorações que pedem mais conteúdo, mais interacção e melhor controlo.",
    price: 10999,
    priceLabel: "10.999 MT",
    featured: true,
    features: [
      "Tudo do Momento",
      "Abertura em motion",
      "Galeria de até 15 memórias",
      "Programa e dress code",
      "Painel de convidados",
      "Mural de dedicatórias",
      "Página de presentes ou contribuições",
    ],
    details: ["Controlo de acompanhantes", "Arquitectura narrativa personalizada", "Até quatro rondas de refinamento"],
    included: [
      "digital",
      "artDirection",
      "rsvp",
      "location",
      "music",
      "gallery",
      "story",
      "guestControl",
      "support",
    ],
    optional: ["qr", "memories", "identity"],
  },
  {
    id: "icone",
    occasion: "aniversario",
    name: "Ícone",
    tier: "Celebração Bespoke",
    subtitle: "Uma experiência irrepetível para uma vida que merece ser contada.",
    description:
      "Concebido sob medida para aniversários de grande escala, homenagens e programas com múltiplos momentos.",
    price: null,
    priceLabel: "Sob consulta",
    features: [
      "Conceito criativo exclusivo",
      "Experiência digital completa",
      "Credenciação e convidados",
      "Memórias do Nosso Dia, sob activação",
      "Sistema de identidade visual",
      "Acompanhamento premium",
    ],
    details: ["Escopo, calendário e investimento definidos após briefing", "Integrações seleccionadas conforme a operação do evento"],
    included: ["digital", "artDirection", "rsvp", "location", "music", "gallery", "story", "guestControl", "identity", "support"],
    optional: ["qr", "seating", "memories"],
  },
  {
    id: "conquista",
    occasion: "graduacao",
    name: "Conquista",
    tier: "Marco académico",
    subtitle: "A dignidade do percurso apresentada com clareza.",
    description:
      "Uma experiência digital para ligar cerimónia, recepção e convidados sem perder o carácter da conquista.",
    price: 11999,
    priceLabel: "11.999 MT",
    features: [
      "RSVP para cerimónia e recepção",
      "Direcção de arte personalizada",
      "Mapas para múltiplos locais",
      "Programa dos actos",
      "Galeria do percurso",
      "Módulo de tributo ou contribuições",
    ],
    details: ["Controlo de acompanhantes", "Curadoria musical", "Optimização integral para telemóvel"],
    included: ["digital", "artDirection", "rsvp", "location", "music", "gallery", "story", "guestControl"],
    optional: ["qr", "memories", "identity", "support"],
  },
  {
    id: "marco",
    occasion: "graduacao",
    name: "Marco",
    tier: "Experiência Bespoke",
    subtitle: "Uma celebração com múltiplos momentos e uma única assinatura.",
    description:
      "Para graduações de maior escala, homenagens familiares e experiências que exigem identidade e acolhimento completos.",
    price: null,
    priceLabel: "Sob consulta",
    featured: true,
    features: [
      "Tudo da Conquista",
      "Abertura cinemática",
      "Credenciação por QR Code",
      "HAXR Seating",
      "Memórias do Nosso Dia, sob activação",
      "Sistema de identidade visual",
      "Acompanhamento premium",
    ],
    details: ["Escopo e investimento definidos após briefing", "Arquitectura adaptada à cerimónia, recepção e protocolo"],
    included: invitationCapabilities
      .map((capability) => capability.id)
      .filter((capability) => capability !== "memories"),
    optional: ["memories"],
  },
  {
    id: "haxr-corporate",
    occasion: "corporativo",
    name: "HAXR Corporate",
    tier: "Experiência institucional",
    subtitle: "Identidade, protocolo e operação num percurso digital coerente.",
    description:
      "Para galas, conferências, lançamentos e encontros executivos que precisam de reflectir o posicionamento da organização.",
    price: null,
    priceLabel: "Sob consulta",
    featured: true,
    features: [
      "UI/UX alinhada ao brandbook",
      "Convite e RSVP corporativo",
      "Fluxos para convidados e VIP",
      "Credenciação por QR Code",
      "Programa e múltiplos locais",
      "Identidade visual do evento",
      "Acompanhamento HAXR",
    ],
    details: ["Arquitectura e segurança definidas por projecto", "Escopo, integrações e investimento após briefing executivo"],
    included: ["digital", "artDirection", "rsvp", "location", "guestControl", "qr", "identity", "support"],
    optional: ["music", "gallery", "story", "seating", "memories"],
  },
] as const;

export const invitationComparison = invitationCapabilities;

export function getComparisonLevel(
  packageItem: InvitationPackage,
  capability: InvitationCapabilityId
): ComparisonLevel {
  if (packageItem.included.includes(capability)) return "included";
  if (packageItem.optional.includes(capability)) return "optional";
  return "none";
}

export const invitationFaqs = [
  {
    q: "O convite é criado a partir de um modelo?",
    a: "Não. Cada projecto parte do briefing, da identidade do evento e do conteúdo real do cliente. A HAXR define composição, tipografia, ritmo e interacções para que a experiência tenha assinatura própria.",
  },
  {
    q: "Quanto tempo demora a criação?",
    a: "Recomendamos iniciar entre seis e oito semanas antes da data de envio. O calendário final depende do pacote, da disponibilidade do conteúdo e da complexidade das integrações.",
  },
  {
    q: "Funciona correctamente em telemóveis?",
    a: "Sim. O desenho começa no telemóvel e é depois adaptado a tablet e desktop. Antes da publicação testamos hierarquia, legibilidade, interacções e desempenho.",
  },
  {
    q: "O RSVP e a gestão de acompanhantes estão incluídos?",
    a: "O RSVP está incluído nos pacotes publicados. O controlo avançado de convidados e acompanhantes varia por nível e aparece claramente no comparativo.",
  },
  {
    q: "É possível acrescentar HAXR Seating ou Memórias do Nosso Dia?",
    a: "Sim. Nos pacotes em que não estão incluídos, estes módulos podem ser avaliados como extensão, desde que o calendário e a operação do evento o permitam.",
  },
  {
    q: "Quantas alterações estão incluídas?",
    a: "O Prólogo, Promessa e Momento incluem até duas rondas de refinamento. Elo, O Sim e Celebra incluem até quatro. Projectos Bespoke têm rondas definidas na proposta.",
  },
  {
    q: "Como começa o projecto e como funciona o pagamento?",
    a: "Começamos por um briefing e uma proposta com escopo, calendário e condições. A produção inicia depois da adjudicação, do pagamento inicial e da recepção do conteúdo necessário.",
  },
] as const;
