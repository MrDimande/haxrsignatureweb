/** iPhone 17 viewport CSS — ref. https://www.ios-resolution.com/iphone-17-pro/ */
import { demoCatalog } from "@/lib/demos/catalog";
import { portfolioAssets } from "@/lib/assets";

export const IPHONE_17_VIEWPORT = {
  width: 402,
  height: 874,
  aspect: 402 / 874,
} as const;

/** Textos oficiais extraídos do portfólio HAXR Signature */
export const portfolioCopy = {
  hero: {
    location: "Maputo · Moçambique",
    tagline: "Do sonho ao sim, estamos com vocês.",
    subtitle:
      "Planeamos, organizamos e coordenamos para que vocês vivam o que realmente importa.",
    ctaPrimary: "Fale connosco",
    ctaSecondary: "Conheça os nossos serviços",
  },
  quemSomos: {
    label: "Quem Somos",
    paragraphs: [
      "A HAXR Signature é uma marca dedicada à curadoria, identidade visual e assessoria de eventos exclusivos.",
      "Actuamos com elegância, discrição e atenção ao detalhe, transformando cada momento numa experiência memorável.",
      "Cada evento é pensado com intenção, desde o primeiro contacto visual até à experiência vivida pelos convidados.",
    ],
    essence: "Elegância, detalhe e precisão orientam cada projecto que assinamos.",
  },
  assinatura: {
    label: "A Nossa Assinatura",
    headline: "Luxo não é excesso. É precisão, espaço e intenção.",
    paragraphs: [
      "A HAXR Signature acredita que um evento memorável não nasce do excesso, mas da harmonia entre estética, organização e intenção.",
      "Cada detalhe deve ter propósito. Cada escolha visual deve comunicar elegância. Cada momento deve ser pensado para criar uma experiência fluida, exclusiva e inesquecível.",
      "A nossa assinatura está na forma como transformamos ideias em experiências cuidadosamente orientadas, com discrição, precisão e sensibilidade estética.",
    ],
    pullQuote: "Luxo, intenção e detalhe em cada experiência.",
  },
  universo: {
    areas: "Curadoria, estética e precisão para eventos exclusivos.",
  },
  convites: {
    headline: "O primeiro contacto com a experiência do seu evento.",
    paragraphs: [
      "O convite é o primeiro momento em que o convidado sente a identidade, o tom e a elegância do evento.",
      "Na HAXR Signature, os convites digitais são pensados para unir estética, funcionalidade e organização, criando uma experiência personalizada desde o primeiro clique.",
      "Cada convite pode incluir informações essenciais do evento, confirmação de presença, localização, galeria, programa, música, contagem regressiva e outros detalhes que tornam a experiência mais completa.",
    ],
    resourcesLabel: "Recursos disponíveis",
    packagesIntro: "Escolha a experiência digital ideal para o seu evento.",
  },
  assessoria: {
    headline: "Planeamento, curadoria e acompanhamento para eventos exclusivos.",
    paragraphs: [
      "A assessoria de eventos é indicada para clientes que desejam organizar uma celebração com mais clareza, segurança e elegância.",
      "Na HAXR Signature, cada evento é conduzido com atenção ao conceito, ao orçamento, aos fornecedores, ao cronograma e à experiência final dos convidados.",
      "O nosso papel é orientar decisões, organizar etapas e garantir que cada detalhe esteja alinhado à identidade e ao propósito do evento.",
    ],
  },
  coordenacao: {
    headline:
      "Presença, organização e controlo para que tudo aconteça com elegância.",
    paragraphs: [
      "A coordenação no dia é indicada para clientes que já organizaram o evento, mas desejam uma equipa profissional para garantir que cada etapa decorra conforme o planeado.",
      "A HAXR Signature acompanha a montagem, orienta fornecedores, organiza o cronograma e assegura que os detalhes estejam alinhados com a experiência idealizada.",
      "Enquanto o cliente vive o momento, a nossa equipa cuida da fluidez, da pontualidade e da resolução discreta de imprevistos.",
    ],
    closing: "No dia do evento, cada detalhe precisa de presença, precisão e resposta rápida.",
  },
  identidadeVisual: {
    headline: "Uma assinatura visual para cada detalhe.",
    paragraphs: [
      "Na HAXR Signature, cada detalhe visual é pensado para comunicar o estilo, o tom e a essência da ocasião, desde o convite até aos materiais de recepção, mesa, sinalização e lembranças.",
      "Mais do que elementos gráficos, a identidade visual cria uma linguagem estética coerente, capaz de transformar o evento numa experiência memorável, sofisticada e personalizada.",
    ],
  },
  experiencias: {
    label: "Experiências Personalizadas",
    headline: "Eventos únicos, pensados com intenção e assinatura própria.",
    paragraphs: [
      "Nem todos os eventos cabem num pacote fechado. Algumas celebrações exigem uma proposta mais sensível, exclusiva e totalmente personalizada.",
      "A HAXR Signature desenvolve experiências especiais para clientes que procuram momentos com conceito, estética cuidada e atenção ao detalhe.",
      "Cada experiência é pensada de acordo com o tipo de evento, perfil do cliente, local, convidados, objectivo e atmosfera desejada.",
    ],
  },
  metodo: {
    headline: "Uma experiência organizada do primeiro contacto à entrega final.",
    intro:
      "Na HAXR Signature, cada projecto segue um processo claro, pensado para garantir elegância, alinhamento e atenção ao detalhe em todas as fases.",
    body: "Desde o primeiro contacto, procuramos compreender o tipo de evento, o perfil do cliente, o estilo pretendido e o nível de acompanhamento necessário. O nosso processo permite que cada decisão seja tomada com intenção, garantindo uma experiência mais fluida, personalizada e segura.",
  },
  contacto: {
    headline: "Estamos prontos para ouvir a sua história.",
    paragraphs: [
      "Eventos memoráveis começam com intenção, detalhe e assinatura própria.",
      "Cada história merece ser ouvida com a discrição e o cuidado que merece.",
    ],
    formIntro:
      "Partilhe a data, a visão e o que pretende da HAXR. Cada pedido é lido com atenção — respondemos em 2 a 5 dias úteis.",
    intentLabel: "O que pretende",
    intentPlaceholder:
      "Ex.: convite digital para casamento em Outubro, 150 convidados, estilo editorial com RSVP e música.",
    messageLabel: "Detalhes adicionais",
    messagePlaceholder:
      "Data, local, orçamento indicativo ou qualquer contexto extra (opcional).",
    submitLabel: "Iniciar conversa",
    submitLoading: "A enviar...",
    successMessage:
      "Recebemos o seu contacto. Entraremos em conversa assim que avaliarmos o seu projecto com a discrição e o cuidado que cada experiência merece.",
    errorMessage:
      "Não foi possível enviar neste momento. Escreva-nos directamente por WhatsApp ou email.",
  },
  testemunhos: {
    label: "O Que Dizem os Nossos Clientes",
    intro: "Palavras de quem viveu a experiência HAXR — depois do convite, do evento e de tudo o que ficou na memória.",
  },
  footer: {
    manifesto:
      "Organização e emoção não são opostos. Precisão nos bastidores é o que liberta a experiência à frente.",
    commitment:
      "A HAXR Signature compromete-se com discrição, elegância, profissionalismo e atenção ao detalhe.",
  },
  condicoesGerais: {
    label: "Condições Gerais",
    headline: "Clareza, organização e compromisso em cada projecto.",
    intro: [
      "Para garantir uma experiência organizada e profissional, todos os serviços da HAXR Signature seguem condições definidas conforme o tipo, dimensão e nível de personalização do projecto.",
      "As condições abaixo ajudam a assegurar alinhamento entre a equipa e o cliente desde o início até à entrega final.",
    ],
    items: [
      {
        title: "Início do projecto",
        body: "A produção inicia após confirmação do pagamento inicial e envio das informações necessárias.",
      },
      {
        title: "Prazos",
        body: "Os prazos variam conforme a complexidade do serviço, urgência, tipo de evento e entrega atempada dos conteúdos pelo cliente.",
      },
      {
        title: "Informações do cliente",
        body: "Textos, fotografias, localização, referências, lista de convidados e outros dados devem ser enviados de forma organizada.",
      },
      {
        title: "Alterações",
        body: "Cada pacote inclui um número definido de rondas de alteração. Ajustes adicionais podem tel custo extra.",
      },
      {
        title: "Serviços urgentes",
        body: "Pedidos com prazos reduzidos podem estar sujeitos a acréscimo no valor final.",
      },
      {
        title: "Serviços sob orçamento",
        body: "Assessoria completa, experiências personalizadas e eventos de maior dimensão são avaliados individualmente.",
      },
      {
        title: "Pagamentos",
        body: "As condições de pagamento são apresentadas na proposta de cada serviço.",
      },
      {
        title: "Compromisso HAXR",
        body: "A HAXR Signature compromete-se com discrição, elegância, profissionalismo e atenção ao detalhe.",
      },
    ],
  },
  termosDeServico: {
    label: "Termos de Serviço",
    headline: "O enquadramento da nossa relação de curadoria.",
    paragraphs: [
      "Os serviços fornecidos pela HAXR Signature regem-se pela exclusividade e pela integridade da direção de arte e assessoria acordadas.",
      "A contratação de qualquer um dos nossos pacotes de convite digital ou assessoria implica a aceitação dos termos de curadoria estética. Todas as decisões de direção criativa são desenvolvidas de forma colaborativa, mas mantendo a assinatura estética HAXR.",
      "É proibida a reprodução, engenharia inversa ou redistribuição não autorizada dos nossos modelos digitais, códigos ou soluções proprietárias desenvolvidas sob medida para o seu evento.",
    ],
  },
  politicaPrivacidade: {
    label: "Política de Privacidade",
    headline: "Discrição absoluta e proteção da sua identidade.",
    paragraphs: [
      "A HAXR Signature compromete-se a proteger a privacidade dos seus clientes e convidados. Toda e qualquer informação, dados pessoais, fotografias ou localizações partilhados connosco são estritamente confidenciais.",
      "Os dados recolhidos através do RSVP dos convidados são encriptados e mantidos apenas pelo período necessário para a execução do evento, não sendo partilhados com terceiros sob qualquer pretexto.",
      "Respeitamos o direito à privacidade e ao anonimato dos nossos clientes de alto perfil, assegurando que nenhum detalhe do projeto seja divulgado sem consentimento expresso por escrito.",
    ],
  },
} as const;

/** Contactos oficiais — HAXR Signature */
export const siteContact = {
  location: "Maputo, Moçambique",
  shortLocation: "Maputo, Moçambique",
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Maputo+Mo%C3%A7ambique",
  email: "info@haxrsignature.com",
  instagram: {
    handle: "@haxr.signature",
    href: "https://www.instagram.com/haxr.signature/",
  },
  whatsapp: {
    display: "+258 870 883 428",
    href: "https://wa.me/258870883428",
  },
  phones: [
    { display: "+258 820 883 478", tel: "+258820883478" },
    { display: "+258 870 883 428", tel: "+258870883428" },
  ],
  facebook: null as { href: string; label: string } | null,
} as const;

export const projectTypeLabels: Record<string, string> = {
  "convite-digital": "Convite Digital",
  "identidade-visual": "Identidade Visual",
  assessoria: "Assessoria de Eventos",
  coordenacao: "Coordenação no Dia",
  experiencias: "Experiências Personalizadas",
  privado: "Evento Privado",
  social: "Social de Alto Perfil",
  corporativo: "Corporativo Estratégico",
  outro: "Outro",
};

export const universePillars = [
  {
    num: "01",
    title: "Convites Digitais",
    desc: portfolioCopy.convites.paragraphs[0],
  },
  {
    num: "02",
    title: "Identidade Visual",
    desc: `${portfolioCopy.identidadeVisual.headline} ${portfolioCopy.identidadeVisual.paragraphs[0]}`,
  },
  {
    num: "03",
    title: "Assessoria de Eventos",
    desc: portfolioCopy.assessoria.paragraphs[0],
  },
  {
    num: "04",
    title: "Coordenação no Dia",
    desc: portfolioCopy.coordenacao.paragraphs[0],
  },
  {
    num: "05",
    title: "Experiências Personalizadas",
    desc: portfolioCopy.experiencias.paragraphs[0],
  },
] as const;

export const invitationResources = [
  "Design personalizado",
  "Música de fundo",
  "Contagem regressiva",
  "Mapa de localização",
  "Confirmação de presença",
  "Galeria de fotos",
  "Programa do evento",
  "QR Code",
  "Página de presentes",
] as const;

export type InvitationProject = {
  id: string;
  href: string;
  label: string;
  mockupImage: string;
  previewPortrait: string;
  caption: string;
  occasion: string;
  category: string;
  format: string;
  editorialNote: string;
  mobileViewportWidth: number;
};

/** Projectos reais — secção Convites Digitais */
export const invitationShowcase: InvitationProject[] = demoCatalog.map(
  (demo) => ({
    id: demo.id,
    href: demo.publicPath,
    mobileViewportWidth: demo.mobileViewportWidth,
    label: demo.ctaLabel,
    mockupImage: demo.mockupImage,
    previewPortrait: demo.previewPortrait,
    caption: demo.caption,
    occasion: demo.occasion,
    category: demo.category,
    format: demo.format,
    editorialNote: demo.editorialNote,
  })
);

export const siteConfig = {
  featuredInvitation: invitationShowcase[0],
  invitationFullscreenMaxWidth: 1023,
  contact: {
    conviteProposalHash: "/contacto?tipo=convite-digital",
    assessoriaProposalHash: "/contacto?tipo=assessoria",
    convitePackageHash: (packageId: string) =>
      `/contacto?tipo=convite-digital&pacote=${packageId}`,
    whatsappProposalUrl: `https://wa.me/258870883428?text=${encodeURIComponent(
      "Olá HAXR Signature, gostaria de solicitar uma proposta para o meu evento."
    )}`,
  },
} as const;

export type PortfolioArchiveItem = {
  id: string;
  title: string;
  category: string;
  service: string;
  image: string;
  span?: boolean;
  href?: string;
  external?: boolean;
  ctaLabel?: string;
};

/** Portfólio editorial — projectos reais e categorias de serviço */
export const portfolioArchive: PortfolioArchiveItem[] = [
  {
    id: "casamento-signature",
    title: "Convite de Casamento Signature",
    category: "Casamento",
    service: "Convite Digital · Pacote Royal",
    image: portfolioAssets.casamentoSignature,
    span: true,
    href: demoCatalog[0].publicPath,
    external: false,
    ctaLabel: demoCatalog[0].ctaLabel,
  },
  {
    id: "save-the-date",
    title: "Save the Date Editorial",
    category: "Noivado",
    service: "Save the Date · Pacote Royal",
    image: portfolioAssets.saveTheDate,
    href: demoCatalog[1].publicPath,
    external: false,
    ctaLabel: demoCatalog[1].ctaLabel,
  },
  {
    id: "corporativo",
    title: "Evento Corporativo",
    category: "Corporativo",
    service: "Identidade Visual & Convite",
    image: portfolioAssets.corporativo,
    href: "/contacto?tipo=corporativo",
    ctaLabel: "Solicitar proposta",
  },
  {
    id: "assessoria-privada",
    title: "Celebração Privada",
    category: "Privado",
    service: "Assessoria & Curadoria",
    image: portfolioAssets.celebracaoPrivada,
    href: "/contacto?tipo=assessoria",
    ctaLabel: "Solicitar proposta",
  },
];

export type Testimonial = {
  id: string;
  quote: string;
  role: string;
  service: string;
  author?: string;
  href?: string;
  external?: boolean;
  linkLabel?: string;
};

/** Depoimentos reais — com autorização dos clientes */
export const testimonials: Testimonial[] = [
  {
    id: "vania-fabiao",
    quote:
      "Os nossos convidados falaram do convite durante semanas a experiência digital definiu o tom de todo o casamento. O evento correu com uma fluidez que ainda hoje nos comove. Não encontramos palavras para agradecer o cuidado em cada detalhe.",
    author: "Vânia Luky & Fabiao Dimande",
    role: "Casamento · Maputo",
    service: "Convite Digital · Pacote Royal",
    href: invitationShowcase[0].href,
    external: true,
    linkLabel: "Ver convite ao vivo",
  },
  {
    id: "helena-arson",
    quote:
      "Os convites são absolutamente top elegantes, impecáveis e com uma presença que impressiona antes mesmo do grande dia. Foi o primeiro gesto certo para o nosso evento, e os convidados adoraram.",
    author: "Helena & Arson",
    role: "Casamento",
    service: "Convite Digital · HAXR Signature",
    href: "/convites-identidade-visual",
    linkLabel: "Ver coleção de convites",
  },
];

export {
  getComparisonLevel,
  invitationCapabilities,
  invitationComparison,
  invitationFaqs,
  invitationOccasions,
  invitationPackages,
  type ComparisonLevel,
  type InvitationCapabilityId,
  type InvitationOccasionId,
  type InvitationPackage,
} from "@/lib/marketing/invitation-offer";
