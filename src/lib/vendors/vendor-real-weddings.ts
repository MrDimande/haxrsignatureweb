/**
 * Casamentos e Celebrações HAXR — Registo Curado e Governação de Dados
 *
 * Modelo canónico para casos de estudo e eventos no ecossistema HAXR Signature.
 * Rege rigorosamente a veracidade de provas sociais, evidência documental e
 * direitos de publicação/anonimização de clientes.
 */

import type { SupplierCategoryId } from "@/lib/vendors/marketplace";

export type RealWeddingEventType =
  | "Casamento"
  | "Lobolo"
  | "Celebração Privada"
  | "Corporativo";

export type RealWeddingEvidenceStatus =
  | "OWNER_CONFIRMED"
  | "VERIFIED"
  | "EVIDENCE_REQUIRED";

export type PublicationPermissionStatus =
  | "GRANTED"
  | "CLIENT_PERMISSION_REQUIRED"
  | "NOT_APPLICABLE";

export type HaxrDigitalService =
  | "Web-Convite HAXR"
  | "Gestão de Convidados"
  | "Plus Memories"
  | "Assessoria Completa"
  | "Coordenação de Dia";

export type RealWedding = {
  id: string;
  coupleId?: string;
  eventType: RealWeddingEventType;
  /**
   * Título público para renderização em componentes.
   * Se os direitos de nome estiverem pendentes (CLIENT_PERMISSION_REQUIRED),
   * contém o formato seguro minimizado (ex: "Casamento no Evelyn Eventos — cerca de 250 convidados").
   */
  couple: string;
  /**
   * Nomes reais dos titulares do evento (registados internamente; nunca renderizados
   * publicamente sem permissão escrita comprovada).
   */
  coupleNames?: string;
  /**
   * Rótulo seguro minimizado canónico.
   */
  anonymisedTitle: string;
  venue: string;
  city: string;
  date?: string;
  eventDate?: string; // Data ISO, ex: "2026-08-08" ou "2026-08-15"
  eventDateEnd?: string; // Data ISO de fecho para eventos de múltiplos dias, ex: "2026-08-16"
  /**
   * Escala de assistência aproximada estritamente preservada conforme confirmada pelo proprietário:
   * "cerca de 250 convidados", "mais de 300 convidados", "cerca de 300 convidados".
   * Proibida a conversão em número exacto arbitrário.
   */
  guestScale: string;
  /**
   * Serviços digitais e operacionais HAXR efectivamente contratados e utilizados.
   * Não inferir serviços não confirmados pelo proprietário.
   */
  servicesUsed?: HaxrDigitalService[];
  coverImage: string;
  slug: string;
  vendorCategories: SupplierCategoryId[];
  editorial: string;
  evidenceStatus: RealWeddingEvidenceStatus;
  clientPublicationPermission: PublicationPermissionStatus;
  photoPublicationPermission: PublicationPermissionStatus;
  plusMemoriesMarketingPermission?: PublicationPermissionStatus;
  testimonialPermission?: PublicationPermissionStatus;
  /**
   * Classificação rigorosa de privacidade e reidentificação:
   * PUBLIC_NAME_REMOVED=true
   * CLIENT_IDENTITY_DIRECTLY_DISPLAYED=false
   * REIDENTIFICATION_RISK="REQUIRES_REVIEW"
   */
  publicNameRemoved: boolean;
  clientIdentityDirectlyDisplayed: boolean;
  reidentificationRisk: "REQUIRES_REVIEW" | "LOW" | "MEDIUM";
  /**
   * Controla a elegibilidade para exibição pública em páginas de marketing.
   * OBRIGATÓRIO: isPublic === true para inclusão em directórios ou galerias públicas.
   */
  isPublic: boolean;
};

/**
 * Modelo de jornada contínua de celebrações de um cliente/casal HAXR.
 * Permite associar múltiplos eventos (ex.: Lobolo → Casamento) a um mesmo casal.
 */
export type HaxrClientCelebrationJourney = {
  coupleId: string;
  coupleNames: string;
  clientPublicationPermission: PublicationPermissionStatus;
  celebrations: RealWedding[];
};

/**
 * Retorna o título a exibir para um evento real, respeitando o estatuto
 * de permissão de publicação do cliente.
 */
export function getPublicRealWeddingTitle(wedding: RealWedding): string {
  if (wedding.clientPublicationPermission === "GRANTED" && wedding.coupleNames) {
    return wedding.coupleNames;
  }
  return wedding.anonymisedTitle;
}

/**
 * Retorna o subtítulo público minimizado para evitar a combinação simultânea
 * de data exacta, local, escala e serviços antes de autorização formal do cliente.
 */
export function getPublicRealWeddingSubtitle(wedding: RealWedding): string {
  if (wedding.clientPublicationPermission === "GRANTED") {
    return `${wedding.venue}${wedding.date ? ` · ${wedding.date}` : ""}`;
  }
  return `${wedding.city} · ${wedding.guestScale}`;
}

/**
 * Registo Curado de Casamentos e Celebrações Reais HAXR.
 * Apenas eventos com isPublic === true e evidência confirmada são elegíveis para exibição pública.
 */
export const HAXR_REAL_WEDDINGS: RealWedding[] = [
  // ── CASO 1 (CONFIRMADO PELO PROPRIETÁRIO) ────────────────────────────────────
  {
    id: "evelyn-eventos-casamento",
    coupleId: "vania-luky-fabiao-dimande",
    eventType: "Casamento",
    couple: "Casamento no Evelyn Eventos — cerca de 250 convidados",
    coupleNames: "Vânia Luky & Fabião Dimande",
    anonymisedTitle: "Casamento no Evelyn Eventos — cerca de 250 convidados",
    venue: "Evelyn Eventos",
    city: "Maputo",
    date: "Maio 2026",
    eventDate: "2026-05-16",
    guestScale: "cerca de 250 convidados",
    servicesUsed: [
      "Web-Convite HAXR",
      "Gestão de Convidados",
      "Assessoria Completa",
      "Coordenação de Dia",
    ],
    coverImage: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "videographers",
      "caterers",
      "decor",
      "music",
      "beauty",
      "planning",
    ],
    editorial:
      "Casamento realizado no Evelyn Eventos para cerca de 250 convidados, integrando assessoria completa e coordenação HAXR Signature.",
    evidenceStatus: "OWNER_CONFIRMED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    publicNameRemoved: true,
    clientIdentityDirectlyDisplayed: false,
    reidentificationRisk: "REQUIRES_REVIEW",
    isPublic: true,
  },

  // ── CASO 2: EVENTO 1 DA JORNADA JÉSSICA & SAMUEL (LOBOLO KUTENGA) ─────────────
  // Associação factual confirmada pelo proprietário: 8 de Agosto de 2026 na Casa d'Artista Kutenga
  // Minimização de dados públicos: "Lobolo em Maputo — cerca de 300 convidados" (não expõe local específico + data exacta simultaneamente na oferta pública aberta)
  {
    id: "kutenga-lobolo",
    coupleId: "jessica-muege-samuel-govene",
    eventType: "Lobolo",
    couple: "Lobolo em Maputo — cerca de 300 convidados",
    coupleNames: "Jéssica Muege & Samuel Govene",
    anonymisedTitle: "Lobolo em Maputo — cerca de 300 convidados",
    venue: "Casa d'Artista Kutenga",
    city: "Maputo",
    date: "8 de Agosto de 2026",
    eventDate: "2026-08-08",
    guestScale: "cerca de 300 convidados",
    servicesUsed: [
      "Web-Convite HAXR",
      "Gestão de Convidados",
      "Plus Memories",
    ],
    coverImage: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "caterers",
      "decor",
      "music",
      "planning",
    ],
    editorial:
      "Celebração tradicional de Lobolo acolhendo cerca de 300 convidados em Maputo, integrando Web-Convite HAXR, gestão de convidados e registo de memórias Plus Memories.",
    evidenceStatus: "OWNER_CONFIRMED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    plusMemoriesMarketingPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    publicNameRemoved: true,
    clientIdentityDirectlyDisplayed: false,
    reidentificationRisk: "REQUIRES_REVIEW",
    isPublic: true,
  },

  // ── CASO 2: EVENTO 2 DA JORNADA JÉSSICA & SAMUEL (CASAMENTO VILA VERDE) ───────
  // Associação factual confirmada pelo proprietário: 15 e 16 de Agosto de 2026 na Vila Verde
  // Minimização de dados públicos: "Casamento na Vila Verde — mais de 300 convidados"
  {
    id: "vila-verde-casamento",
    coupleId: "jessica-muege-samuel-govene",
    eventType: "Casamento",
    couple: "Casamento na Vila Verde — mais de 300 convidados",
    coupleNames: "Jéssica Muege & Samuel Govene",
    anonymisedTitle: "Casamento na Vila Verde — mais de 300 convidados",
    venue: "Vila Verde",
    city: "Maputo",
    date: "15 e 16 de Agosto de 2026",
    eventDate: "2026-08-15",
    eventDateEnd: "2026-08-16",
    guestScale: "mais de 300 convidados",
    servicesUsed: [
      "Web-Convite HAXR",
      "Gestão de Convidados",
      "Plus Memories",
    ],
    coverImage: "/images/portfolio/mosaic-salao-branco-preparado.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "caterers",
      "decor",
      "stationery",
      "planning",
    ],
    editorial:
      "Celebração de casamento na Vila Verde acolhendo mais de 300 convidados, com Web-Convite HAXR, gestão de convidados e experiência digital interactiva Plus Memories.",
    evidenceStatus: "OWNER_CONFIRMED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    plusMemoriesMarketingPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    publicNameRemoved: true,
    clientIdentityDirectlyDisplayed: false,
    reidentificationRisk: "REQUIRES_REVIEW",
    isPublic: true,
  },

  // ── REGISTO HISTÓRICO INTERNO (REMOVIDO DAS SUPERFÍCIES PÚBLICAS) ───────────
  // Desactivado por Decisão Expressa do Proprietário: Não corroborado documentalmente.
  {
    id: "legacy-polana-serena",
    eventType: "Casamento",
    couple: "Lurdes & Fernando",
    coupleNames: "Lurdes & Fernando",
    anonymisedTitle: "Casamento Polana Serena Hotel",
    venue: "Polana Serena Hotel",
    city: "Maputo",
    date: "Setembro 2025",
    guestScale: "400 convidados",
    coverImage: "/images/portfolio/mosaic-casal-painel-branco.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "caterers",
      "beauty",
      "music",
      "planning",
    ],
    editorial:
      "Gala de luxo no Polana Serena com 400 convidados, menu de autor e orquestra ao vivo.",
    evidenceStatus: "EVIDENCE_REQUIRED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    publicNameRemoved: false,
    clientIdentityDirectlyDisplayed: false,
    reidentificationRisk: "REQUIRES_REVIEW",
    isPublic: false,
  },

  // Desactivado por Decisão de Governação: Não corroborado documentalmente.
  {
    id: "legacy-vila-laguna",
    eventType: "Casamento",
    couple: "Ana & Carlos",
    coupleNames: "Ana & Carlos",
    anonymisedTitle: "Casamento Vila Laguna Marracuene",
    venue: "Vila Laguna Marracuene",
    city: "Marracuene",
    date: "Junho 2025",
    guestScale: "280 convidados",
    coverImage: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "videographers",
      "caterers",
      "decor",
      "music",
    ],
    editorial:
      "Casamento ao ar livre numa quinta privada em Marracuene com 280 convidados.",
    evidenceStatus: "EVIDENCE_REQUIRED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    publicNameRemoved: false,
    clientIdentityDirectlyDisplayed: false,
    reidentificationRisk: "REQUIRES_REVIEW",
    isPublic: false,
  },
];

/**
 * Jornadas Contínuas de Clientes HAXR Signature.
 * Modela explicitamente a relação entre celebrações de um mesmo cliente/casal.
 */
export const HAXR_CLIENT_JOURNEYS: HaxrClientCelebrationJourney[] = [
  {
    coupleId: "jessica-muege-samuel-govene",
    coupleNames: "Jéssica Muege & Samuel Govene",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    celebrations: HAXR_REAL_WEDDINGS.filter(
      (w) => w.coupleId === "jessica-muege-samuel-govene",
    ),
  },
  {
    coupleId: "vania-luky-fabiao-dimande",
    coupleNames: "Vânia Luky & Fabião Dimande",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    celebrations: HAXR_REAL_WEDDINGS.filter(
      (w) => w.coupleId === "vania-luky-fabiao-dimande",
    ),
  },
];

/**
 * Retorna as celebrações associadas a um casal específico.
 */
export function getCelebrationsForCouple(coupleId: string): RealWedding[] {
  return HAXR_REAL_WEDDINGS.filter(
    (w) => w.coupleId === coupleId && w.isPublic === true,
  );
}

/**
 * Retorna os casamentos reais curados que correspondem
 * à categoria do fornecedor (máximo 3 por perfil).
 *
 * Guardrail estrito:
 * 1. isPublic === true
 * 2. evidenceStatus === 'OWNER_CONFIRMED' || evidenceStatus === 'VERIFIED'
 */
export function getRealWeddingsForCategory(
  category: SupplierCategoryId,
  maxResults = 3,
): RealWedding[] {
  return HAXR_REAL_WEDDINGS.filter(
    (wedding) =>
      wedding.isPublic === true &&
      (wedding.evidenceStatus === "OWNER_CONFIRMED" ||
        wedding.evidenceStatus === "VERIFIED") &&
      wedding.vendorCategories.includes(category),
  ).slice(0, maxResults);
}
