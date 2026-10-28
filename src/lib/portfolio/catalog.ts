import { isPortfolioProjectPubliclyEligible, type PortfolioProject, type PortfolioCategoryId } from "./types";
import { portfolioAssets } from "@/lib/assets";
import { getDemoById } from "@/lib/demos/catalog";

export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: "casamento-vania-fabiao",
    slug: "casamento-vania-fabiao",
    title: "Vânia & Fabião",
    subtitle: "Sobriedade estética, serenidade protocolar e acolhimento familiar.",
    category: "casamentos-lobolos",
    categoryLabel: "Casamento Signature",
    location: "Maputo · Moçambique",
    year: "2024",
    guestCount: "cerca de 250 convidados",
    isReal: true,
    projectType: "real",
    status: "draft",
    editorialReviewStatus: "pending_review",
    publicationAuthorized: false,
    clientConsentStatus: "CONFIRMATION_PENDING",
    authorizationNotes:
      "Pendente de validação de termo documental de autorização de imagem e publicação assinado pelos noivos.",
    isFeatured: true,
    coverImage: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    coverAspect: "landscape",
    services: [
      "Assessoria Completa",
      "Direcção Criativa & Styling",
      "Web-Convite HAXR (Edição Legado)",
      "RSVP em Tempo Real",
      "Coordenação de Dia",
    ],
    summary:
      "Celebração no Evelyn Eventos com cerca de 250 convidados. Continuidade estética rigorosa do primeiro convite digital à recepção cerimonial.",
    narrative: {
      vision:
        "Os noivos procuravam uma celebração que combinasse sofisticação contemporânea e o calor da hospitalidade moçambicana, sem o ruído e a ansiedade das montagens tradicionais.",
      challenge:
        "Articular múltiplos fornecedores de excelência num cronograma rigoroso, assegurando que o acolhimento das duas famílias decorresse com serenidade e distinção.",
      signature:
        "A HAXR assumiu a curadoria estética global e a coordenação operacional minuciosa. Desenvolvemos o Web-Convite interactivo com confirmação em tempo real e desenhámos o protocolo dos bastidores de forma invisível.",
      result:
        "Uma celebração fluida, memorável e descontraída para os noivos, elogiada pelos convidados pela elegância dos detalhes e pontualidade exemplar.",
    },
    gallery: [
      {
        src: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
        alt: "Casamento Vânia e Fabião no Evelyn Eventos",
        caption: "Recepção cerimonial no Evelyn Eventos, Maputo.",
        aspectRatio: "landscape",
      },
      {
        src: portfolioAssets.casamentoSignature,
        alt: "Casamento Signature com painel cerimonial",
        caption: "Composição visual do casal em cenário minimalista contemporâneo.",
        aspectRatio: "portrait",
      },
      {
        src: portfolioAssets.salaoBranco,
        alt: "Salão preparado para recepção",
        caption: "Disposição das mesas e iluminação cénica desenhada com precisão.",
        aspectRatio: "landscape",
      },
      {
        src: portfolioAssets.mesaDourada,
        alt: "Detalhes de mesa e cerâmica com acabamentos nobres",
        caption: "Curadoria de detalhes e louçaria com acentos a ouro champanhe.",
        aspectRatio: "square",
      },
    ],
    details: [
      { label: "Espaço", value: "Evelyn Eventos, Cidade de Maputo" },
      { label: "Dimensão", value: "Aprox. 250 convidados" },
      { label: "Edição Digital", value: "Edição Legado · Web-Convite Bespoke" },
      { label: "Protocolo", value: "Coordenação Integral de Cerimónia e Recepção" },
    ],
    credits: [
      { role: "Assessoria & Curadoria", name: "HAXR Signature Atelier Cerimonial" },
      { role: "Espaço", name: "Evelyn Eventos" },
      { role: "Experiência Digital", name: "Web-Convite HAXR" },
    ],
    demoUrl: getDemoById("casamento-vania-fabiao")?.publicPath || "/experiencias/casamento-vania-fabiao",
    demoLabel: "Explorar Web-Convite do Casamento",
    publishedAt: "2024-11-15",
    seo: {
      title: "Vânia & Fabião — The Signature Collection | HAXR Signature",
      description:
        "Casamento no Evelyn Eventos com cerca de 250 convidados. Assessoria integral, direcção criativa e Web-Convite interactivo em Maputo.",
      keywords: ["casamento Maputo", "Evelyn Eventos", "assessoria de casamentos", "web-convite HAXR"],
    },
  },
  {
    id: "lobolo-kutenga",
    slug: "lobolo-kutenga",
    title: "Lobolo Tradicional em Maputo",
    subtitle: "Harmonização entre tradição ancestral moçambicana e inovação digital de hospitalidade.",
    category: "casamentos-lobolos",
    categoryLabel: "Lobolo Tradicional",
    location: "Maputo · Moçambique",
    year: "2024",
    guestCount: "cerca de 300 convidados",
    isReal: true,
    projectType: "real",
    status: "draft",
    editorialReviewStatus: "pending_review",
    publicationAuthorized: false,
    clientConsentStatus: "CONFIRMATION_PENDING",
    authorizationNotes:
      "Pendente de confirmação documental de autorização das famílias anfitriãs e da Casa d'Artista Kutenga.",
    isFeatured: true,
    coverImage: portfolioAssets.mesaDourada,
    coverAspect: "square",
    services: [
      "Web-Convite Tradicional HAXR",
      "Gestão Digital de Convidados",
      "Acolhimento com QR Code",
      "Plus Memories (Galeria Colaborativa)",
    ],
    summary:
      "Cerimónia tradicional de Lobolo acolhendo cerca de 300 convidados. Integração de Web-Convite personalizado com cobertura participativa Plus Memories.",
    narrative: {
      vision:
        "Preservar a solenidade dos ritos tradicionais do Lobolo, proporcionando aos convidados e famílias um acolhimento moderno, transparente e memorável.",
      challenge:
        "Gerir com dignidade e precisão a chegada de mais de 300 convidados, respeitando a hierarquia cerimonial das famílias sem gerar filas ou desencontros.",
      signature:
        "Concebemos um Web-Convite temático com orientações culturais de vestuário e localização GPS directa. Integramos o Plus Memories permitindo aos convidados partilhar memórias fotográficas em tempo real.",
      result:
        "Uma celebração emocionante com recepção impecável e um arquivo vivo de centenas de fotografias capturadas sob a perspectiva íntima dos convidados.",
    },
    gallery: [
      {
        src: portfolioAssets.mesaDourada,
        alt: "Mesa de recepção do Lobolo com apontamentos dourados",
        caption: "Styling de mesa de honra honrando a riqueza cultural e festiva.",
        aspectRatio: "square",
      },
      {
        src: portfolioAssets.euEspioQr,
        alt: "Ponto de experiência Eu Espio Plus Memories com QR Code",
        caption: "Estação interactiva Plus Memories para os convidados partilharem memórias.",
        aspectRatio: "portrait",
      },
      {
        src: portfolioAssets.salaoBranco,
        alt: "Preparação do espaço cerimonial",
        caption: "Espaço cerimonial organizado para o acolhimento das duas delegações familiares.",
        aspectRatio: "landscape",
      },
    ],
    details: [
      { label: "Ocasião", value: "Cerimónia Tradicional de Lobolo" },
      { label: "Localização", value: "Cidade de Maputo" },
      { label: "Convidados", value: "Cerca de 300 familiares e amigos" },
      { label: "Tecnologia", value: "Web-Convite HAXR & Galeria Plus Memories" },
    ],
    credits: [
      { role: "Experiência Digital & RSVP", name: "HAXR Signature" },
      { role: "Memórias Interactivas", name: "Plus Memories" },
    ],
    publishedAt: "2024-10-20",
    seo: {
      title: "Lobolo Tradicional em Maputo — The Signature Collection | HAXR Signature",
      description:
        "Celebração de Lobolo para cerca de 300 convidados em Maputo. Web-Convite interactivo, acolhimento digital e memória fotográfica com Plus Memories.",
      keywords: ["lobolo Maputo", "tradição moçambicana", "web-convite lobolo", "plus memories"],
    },
  },
  {
    id: "save-the-date-jessica-samuel",
    slug: "save-the-date-jessica-samuel",
    title: "Jessica & Samuel",
    subtitle: "O primeiro gesto editorial. Anúncio exclusivo em capítulos com confirmação antecipada.",
    category: "convites-digitais",
    categoryLabel: "Save the Date Bespoke",
    location: "Maputo · Moçambique",
    year: "2025",
    guestCount: "Celebração Intimista",
    isReal: true,
    status: "published",
    isFeatured: false,
    coverImage: portfolioAssets.saveTheDate,
    coverAspect: "portrait",
    services: [
      "Edição Legado · Save the Date",
      "Narrativa Visual em Capítulos",
      "Guia Visual de Dress Code",
      "RSVP Antecipado Integrado",
    ],
    summary:
      "Save the date em formato de ensaio editorial digital, estabelecendo o tom estético, o dress code e o registo prévio de convidados com máxima elegância.",
    narrative: {
      vision:
        "O casal desejava anunciar a data do seu casamento não com uma imagem estática comum, mas com uma história que despertasse curiosidade, emoção e requinte.",
      challenge:
        "Transmitir as orientações de dress code e o ambiente da celebração com naturalidade, garantindo facilidade de acesso em qualquer telemóvel.",
      signature:
        "Criámos uma experiência digital imersiva em tom Noir & Ouro Champanhe, com transições fluídas, tipografia refinada e formulário de pré-confirmação intuitivo.",
      result:
        "Uma recepção calorosa pelos convidados, com mais de 80% de confirmações imediatas nas primeiras 48 horas de partilha.",
    },
    gallery: [
      {
        src: portfolioAssets.saveTheDate,
        alt: "Mockup do Save the Date Jessica e Samuel em smartphone",
        caption: "Interface optimizada para telemóveis em modo escuro com acabamentos dourados.",
        aspectRatio: "portrait",
      },
      {
        src: "/images/save-the-date-jessica-samuel-preview.png",
        alt: "Ensaio e visualização do Save the Date",
        caption: "Composição editorial com cronómetro e contagem decrescente.",
        aspectRatio: "landscape",
      },
    ],
    details: [
      { label: "Formato", value: "Experiência Digital Interactiva Mobile-First" },
      { label: "Edição", value: "Edição Legado Bespoke" },
      { label: "Funcionalidades", value: "Capítulos, Dress Code, RSVP, Adicionar ao Calendário" },
    ],
    credits: [
      { role: "Direcção de Arte & Tecnologia", name: "HAXR Signature Atelier Cerimonial" },
    ],
    demoUrl: getDemoById("save-the-date-jessica-samuel")?.publicPath || "/experiencias/save-the-date-jessica-samuel",
    demoLabel: "Abrir Save the Date ao Vivo",
    publishedAt: "2025-01-10",
    seo: {
      title: "Jessica & Samuel — The Signature Collection | HAXR Signature",
      description:
        "Save the date digital em capítulos com dress code e RSVP integrado. Criação exclusiva da HAXR Signature para celebração em Maputo.",
      keywords: ["save the date digital", "convite casamento telemovel", "rsvp digital", "HAXR Signature"],
    },
  },
  {
    id: "casamento-vila-verde",
    slug: "casamento-vila-verde",
    title: "Casamento na Vila Verde",
    subtitle: "Celebração campestre de grande escala acolhendo mais de 300 convidados com distinção.",
    category: "casamentos-lobolos",
    categoryLabel: "Casamento ao Ar Livre",
    location: "Maputo · Moçambique",
    year: "2024",
    guestCount: "mais de 300 convidados",
    isReal: true,
    status: "draft",
    projectType: "real",
    editorialReviewStatus: "pending_review",
    publicationAuthorized: false,
    clientConsentStatus: "CONFIRMATION_PENDING",
    authorizationNotes: "Pendente de confirmação fotográfica autorizada da Vila Verde e consentimento expresso dos noivos.",
    isFeatured: false,
    coverImage: portfolioAssets.salaoBranco,
    coverAspect: "landscape",
    services: [
      "Web-Convite HAXR",
      "Gestão de Convidados & Acolhimento",
      "Plataforma HAXR Concierge",
      "Plus Memories",
    ],
    summary:
      "Celebração campestre na Vila Verde para mais de 300 convidados. Gestão digital de listas, acolhimento protocolar e cobertura de memórias em tempo real.",
    narrative: {
      vision:
        "Uma festa aberta e luminosa em harmonia com a natureza, onde cada convidado desfrutasse de atenção individualizada e facilidade no acesso.",
      challenge:
        "A coordenação de um elevado número de convidados num espaço amplo ao ar livre, mantendo a ordem na chegada e na atribuição de lugares.",
      signature:
        "Implementação do sistema digital de confirmações e seating, com recepção assistida por tablet e registo fotográfico colaborativo.",
      result:
        "Fluidez no fluxo de entrada sem demoras, ambiente festivo contínuo e satisfação expressa por ambas as famílias.",
    },
    gallery: [
      {
        src: portfolioAssets.salaoBranco,
        alt: "Ambiente e decoração na recepção",
        caption: "Disposição ampla com detalhes florais discretos e sofisticados.",
        aspectRatio: "landscape",
      },
      {
        src: portfolioAssets.casamentoSignature,
        alt: "Casal e detalhes de coordenação",
        caption: "Acompanhamento discreto da equipa de coordenação HAXR nos momentos-chave.",
        aspectRatio: "portrait",
      },
    ],
    details: [
      { label: "Espaço", value: "Vila Verde, Maputo" },
      { label: "Escala", value: "Mais de 300 convidados" },
      { label: "Acompanhamento", value: "Gestão Digital e Coordenação de Acolhimento" },
    ],
    credits: [
      { role: "Tecnologia & Acolhimento", name: "HAXR Signature" },
      { role: "Espaço", name: "Vila Verde" },
    ],
    publishedAt: "2024-09-12",
    seo: {
      title: "Casamento na Vila Verde — The Signature Collection | HAXR Signature",
      description:
        "Casamento na Vila Verde para mais de 300 convidados. Web-Convite, gestão de listas e cobertura de memórias com hospitalidade de excelência.",
      keywords: ["Vila Verde Maputo", "casamento ao ar livre", "gestão de convidados", "HAXR"],
    },
  },
  {
    id: "identidade-cerimonial-legado",
    slug: "identidade-cerimonial-legado",
    title: "Colecção de Identidade Cerimonial",
    subtitle: "A alta-costura gráfica: monogramas em relevo, papelaria editorial e selagem em cera escura.",
    category: "identidade-cerimonial",
    categoryLabel: "Direcção Criativa",
    location: "Maputo · Moçambique",
    year: "2025",
    guestCount: "Edição Exclusiva",
    isReal: true,
    projectType: "conceptual",
    status: "published",
    editorialReviewStatus: "approved",
    publicationAuthorized: true,
    clientConsentStatus: "AUTHORIZED",
    materialSource: "Propriedade Intelectual HAXR Signature — Editorial Conceitual",
    isFeatured: false,
    coverImage: "/images/portfolio-page-5.png",
    coverAspect: "square",
    services: [
      "Criação de Monograma Exclusivo",
      "Papelaria Editorial Impressa",
      "Design de Menus e Marcadores de Mesa",
      "Selagem em Cera Escura & Ouro",
      "Sinalética Arquitectónica do Evento",
    ],
    summary:
      "Desenvolvimento de universos visuais exclusivos para celebrações que exigem coerência estética absoluta entre o mundo digital e os suportes físicos.",
    narrative: {
      vision:
        "Eliminar a dissonância entre os convites digitais de vanguarda e a papelaria física dos eventos, criando uma identidade visual unificada e intemporal.",
      challenge:
        "Criar suportes táteis de elevadíssimo padrão em Maputo, seleccionando papéis de textura fina, tintas pigmentadas e acabamentos manuais de luxo.",
      signature:
        "Direcção de arte personalizada para cada casal, com desenho tipográfico sob medida, medalhões gravados a quente e cartões em algodão puro.",
      result:
        "Uma colecção física que os convidados guardam como objecto de colecção e memória indelével do evento.",
    },
    gallery: [
      {
        src: "/images/portfolio-page-5.png",
        alt: "Caderno editorial e identidade cerimonial HAXR",
        caption: "Guia de estilo e caderno de direcção criativa para casamentos de assinatura.",
        aspectRatio: "portrait",
      },
      {
        src: portfolioAssets.mesaDourada,
        alt: "Cartão de menu e detalhes com toque dourado",
        caption: "Papelaria integrada na cenografia da mesa principal.",
        aspectRatio: "square",
      },
    ],
    details: [
      { label: "Aplicação", value: "Monogramas, Menus, Guias de Cerimónia, Sinalética" },
      { label: "Materiais", value: "Papel de Algodão, Hot Stamping Ouro Champanhe, Cera Noir" },
    ],
    credits: [
      { role: "Direcção de Arte", name: "HAXR Signature Atelier Cerimonial" },
    ],
    publishedAt: "2025-02-01",
    seo: {
      title: "Colecção de Identidade Cerimonial — The Signature Collection | HAXR Signature",
      description:
        "Direcção criativa, monogramas exclusivos e papelaria de casamento de alta-costura em Maputo pela HAXR Signature.",
      keywords: ["papelaria de luxo Maputo", "identidade cerimonial", "monograma casamento", "design de eventos"],
    },
  },
  {
    id: "gala-institucional-executiva",
    slug: "gala-institucional-executiva",
    title: "Gala Executiva & Celebração Institucional",
    subtitle: "Rigor protocolar, recepção com credenciação digital e discrição absoluta.",
    category: "corporativos",
    categoryLabel: "Evento Corporativo & Gala",
    location: "Maputo · Moçambique",
    year: "2024",
    guestCount: "200 convidados VIP",
    isReal: true,
    projectType: "real",
    status: "draft",
    editorialReviewStatus: "pending_review",
    publicationAuthorized: false,
    clientConsentStatus: "CONFIRMATION_PENDING",
    authorizationNotes:
      "Pendente de termo de consentimento corporativo do cliente institucional e do fotógrafo do evento.",
    isFeatured: false,
    coverImage: "/images/archive-01.webp",
    coverAspect: "landscape",
    services: [
      "Coordenação Protocolar",
      "Check-in QR Code com Lugares Atribuídos",
      "Gestão de Mesa de Honra",
      "Supervisão Operacional de Bastidores",
    ],
    summary:
      "Gala de alto padrão institucional na capital moçambicana. Coordenação protocolar de chefias, controlo de acessos e sincronização do programa oficial.",
    narrative: {
      vision:
        "Receber personalidades e delegações executivas com respeito escrupuloso pela precedência protocolar e pontualidade irrepreensível.",
      challenge:
        "Garantir a verificação de segurança e recepção de 200 convidados de destaque sem qualquer fricção, mantendo o ambiente calmo e prestigioso.",
      signature:
        "Implementação de leitor de credenciais digital da HAXR com identificação imediata da mesa e acompanhamento por hospedeiras dedicadas.",
      result:
        "Evento decorrido sem atrasos, com elogio explícito do conselho de administração pela sobriedade e eficiência dos bastidores.",
    },
    gallery: [
      {
        src: "/images/archive-01.webp",
        alt: "Espaço cerimonial preparado para gala institucional",
        caption: "Iluminação arquitetónica e preparação de mesas de honra.",
        aspectRatio: "landscape",
      },
      {
        src: "/images/archive-02.webp",
        alt: "Detalhes de recepção executiva",
        caption: "Ambiente executivo pautado pelo rigor e clareza visual.",
        aspectRatio: "square",
      },
    ],
    details: [
      { label: "Segmento", value: "Corporativo & Institucional" },
      { label: "Protocolo", value: "Mesa de Honra e Precedências de Estado" },
      { label: "Tecnologia", value: "Leitura de QR Code e Mapa de Mesas Digital" },
    ],
    credits: [
      { role: "Coordenação Protocolar & Tecnologia", name: "HAXR Signature" },
    ],
    publishedAt: "2024-12-05",
    seo: {
      title: "Gala Executiva & Celebração Institucional — The Signature Collection | HAXR Signature",
      description:
        "Coordenação protocolar, controlo de acessos e recepção de gala em Maputo. Soluções executivas de hospitalidade HAXR Signature.",
      keywords: ["eventos corporativos Maputo", "gala institucional", "protocolo executivo", "check-in vip"],
    },
  },
  {
    id: "celebracao-privada-aniversario",
    slug: "celebracao-privada-aniversario",
    title: "Celebração Íntima de Aniversário",
    subtitle: "Atmosfera intimista, cenografia calorosa e atenção dedicada a cada convidado.",
    category: "celebracoes-privadas",
    categoryLabel: "Celebração Privada",
    location: "Maputo · Moçambique",
    year: "2024",
    guestCount: "60 convidados",
    isReal: true,
    projectType: "real",
    status: "draft",
    editorialReviewStatus: "pending_review",
    publicationAuthorized: false,
    clientConsentStatus: "CONFIRMATION_PENDING",
    authorizationNotes:
      "Pendente de validação de termo de privacidade e autorização expressa do aniversariante e convidados.",
    isFeatured: false,
    coverImage: "/images/archive-03.webp",
    coverAspect: "portrait",
    services: [
      "Assessoria e Curadoria Parcial",
      "Styling Cenográfico e Iluminação",
      "Coordenação de Catering e Vinhos",
      "Recepção Personalizada",
    ],
    summary:
      "Celebração privada com 60 convidados em residência privada. Ambiente intimista com gastronomia de assinatura e supervisão atenta dos bastidores.",
    narrative: {
      vision:
        "Proporcionar ao anfitrião a oportunidade de ser verdadeiramente convidado na sua própria festa, sem preocupações com a coordenação das equipas.",
      challenge:
        "Trabalhar numa residência particular com restrições de espaço e acústica, mantendo o serviço impecável e a privacidade da família.",
      signature:
        "Estruturação de um circuito de serviço invisível, iluminação cénica em tons quentes e gestão milimétrica do timing dos pratos e discursos.",
      result:
        "Uma noite memorável e aconchegante, onde a elegância e a descontração conviveram em perfeito equilíbrio.",
    },
    gallery: [
      {
        src: "/images/archive-03.webp",
        alt: "Atmosfera noturna com iluminação intimista",
        caption: "Cenografia noturna para celebração de aniversário privada.",
        aspectRatio: "portrait",
      },
      {
        src: portfolioAssets.mesaDourada,
        alt: "Mesa posta com detalhes exclusivos",
        caption: "Mesa posta desenhada para conversas longas e celebração sem pressas.",
        aspectRatio: "landscape",
      },
    ],
    details: [
      { label: "Ocasião", value: "Celebração de Aniversário" },
      { label: "Formato", value: "Jantar Privado e Recepção" },
      { label: "Convidados", value: "60 pessoas" },
    ],
    credits: [
      { role: "Curadoria e Coordenação", name: "HAXR Signature" },
    ],
    publishedAt: "2024-08-18",
    seo: {
      title: "Celebração Íntima de Aniversário — The Signature Collection | HAXR Signature",
      description:
        "Celebração privada com curadoria de excelência em Maputo. Assessoria e coordenação de bastidores pela HAXR Signature.",
      keywords: ["aniversário de luxo Maputo", "celebração privada", "jantar intimista", "HAXR Signature"],
    },
  },
] as const;

export function getAllPortfolioProjects(): readonly PortfolioProject[] {
  return PORTFOLIO_PROJECTS;
}

export function getPublishedPortfolioProjects(): readonly PortfolioProject[] {
  return PORTFOLIO_PROJECTS.filter(isPortfolioProjectPubliclyEligible);
}

export function getPortfolioProjectBySlug(slug: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug);
}

export function getPortfolioProjectById(id: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((p) => p.id === id);
}

export function getPortfolioProjectsByCategory(category: PortfolioCategoryId): readonly PortfolioProject[] {
  if (category === "todos") {
    return getPublishedPortfolioProjects();
  }
  return PORTFOLIO_PROJECTS.filter(
    (p) => isPortfolioProjectPubliclyEligible(p) && p.category === category
  );
}

export function getFeaturedPortfolioProjects(): readonly PortfolioProject[] {
  return PORTFOLIO_PROJECTS.filter((p) => isPortfolioProjectPubliclyEligible(p) && p.isFeatured);
}

export function getNextPortfolioProject(currentSlug: string): PortfolioProject | undefined {
  const published = getPublishedPortfolioProjects();
  const currentIndex = published.findIndex((p) => p.slug === currentSlug);
  if (currentIndex === -1) return undefined;
  const nextIndex = (currentIndex + 1) % published.length;
  return published[nextIndex];
}
