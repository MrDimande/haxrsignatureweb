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

export type RealWedding = {
  id: string;
  eventType: RealWeddingEventType;
  /**
   * Título público para renderização em componentes.
   * Se os direitos de nome estiverem pendentes (CLIENT_PERMISSION_REQUIRED),
   * contém o formato seguro e anónimo (ex: "Casamento no Evelyn Eventos — cerca de 250 convidados").
   */
  couple: string;
  /**
   * Nomes reais dos titulares do evento (registados internamente; nunca renderizados
   * publicamente sem permissão escrita comprovada).
   */
  coupleNames?: string;
  /**
   * Rótulo seguro e anónimo canónico.
   */
  anonymisedTitle: string;
  venue: string;
  city: string;
  date?: string;
  /**
   * Escala de assistência aproximada estritamente preservada conforme confirmada pelo proprietário:
   * "cerca de 250 convidados", "mais de 300 convidados", "cerca de 300 convidados".
   * Proibida a conversão em número exacto arbitrário.
   */
  guestScale: string;
  coverImage: string;
  slug: string;
  vendorCategories: SupplierCategoryId[];
  editorial: string;
  evidenceStatus: RealWeddingEvidenceStatus;
  clientPublicationPermission: PublicationPermissionStatus;
  photoPublicationPermission: PublicationPermissionStatus;
  testimonialPermission?: PublicationPermissionStatus;
  /**
   * Controla a elegibilidade para exibição pública em páginas de marketing.
   * OBRIGATÓRIO: isPublic === true para inclusão em directórios ou galerias públicas.
   */
  isPublic: boolean;
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
 * Registo Curado de Casamentos e Celebrações Reais HAXR.
 * Apenas eventos com isPublic === true e evidência confirmada são elegíveis para exibição pública.
 */
export const HAXR_REAL_WEDDINGS: RealWedding[] = [
  // ── CASO 1 (CONFIRMADO PELO PROPRIETÁRIO) ────────────────────────────────────
  {
    id: "evelyn-eventos-casamento",
    eventType: "Casamento",
    couple: "Casamento no Evelyn Eventos — cerca de 250 convidados",
    coupleNames: "Vânia Luky & Fabião Dimande",
    anonymisedTitle: "Casamento no Evelyn Eventos — cerca de 250 convidados",
    venue: "Evelyn Eventos",
    city: "Maputo",
    date: "Maio 2026",
    guestScale: "cerca de 250 convidados",
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
    isPublic: true,
  },

  // ── CASO 2 (CONFIRMADO PELO PROPRIETÁRIO) ────────────────────────────────────
  {
    id: "vila-verde-casamento",
    eventType: "Casamento",
    couple: "Casamento na Vila Verde — mais de 300 convidados",
    coupleNames: "Jéssica Muege & Samuel Govene",
    anonymisedTitle: "Casamento na Vila Verde — mais de 300 convidados",
    venue: "Vila Verde",
    city: "Maputo",
    date: "Agosto 2026",
    guestScale: "mais de 300 convidados",
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
      "Celebração de casamento na Vila Verde para mais de 300 convidados, com planeamento e coordenação operacional HAXR Signature.",
    evidenceStatus: "OWNER_CONFIRMED",
    clientPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "CLIENT_PERMISSION_REQUIRED",
    isPublic: true,
  },

  // ── CASO 3 (CONFIRMADO PELO PROPRIETÁRIO — LOBOLO KUTENGA) ──────────────────
  // Nota de Governação: NÃO associar a Jéssica Muege & Samuel Govene salvo confirmação expressa do proprietário.
  {
    id: "kutenga-lobolo",
    eventType: "Lobolo",
    couple: "Lobolo na Casa d'Artista Kutenga — cerca de 300 convidados",
    anonymisedTitle: "Lobolo na Casa d'Artista Kutenga — cerca de 300 convidados",
    venue: "Casa d'Artista Kutenga",
    city: "Maputo",
    guestScale: "cerca de 300 convidados",
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
      "Cerimónia tradicional de Lobolo na Casa d'Artista Kutenga para cerca de 300 convidados, com acompanhamento de protocolo e recepção HAXR Signature.",
    evidenceStatus: "OWNER_CONFIRMED",
    clientPublicationPermission: "NOT_APPLICABLE",
    photoPublicationPermission: "CLIENT_PERMISSION_REQUIRED",
    testimonialPermission: "NOT_APPLICABLE",
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
    isPublic: false,
  },
];

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
