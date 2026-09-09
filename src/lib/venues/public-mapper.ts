/**
 * HAXR Signature — Public Venue Card Mapper & Trust Language (Phase E.2 Corrective)
 *
 * Mapeamento estrito e tradução de dados de domínio para visualização pública editorial.
 *
 * Directrizes de Alta-Costura e Integridade Factual:
 * 1. ZERO terminologia "homologado/homologada" sem acto regulamentar público evidenciado.
 * 2. ZERO inferência de tipos de celebração sem evidência explícita (Blocker 1).
 *    (PUBLIC_CELEBRATION_ATTRIBUTE_REQUIRES_EXPLICIT_EVIDENCE=true).
 * 3. ZERO inferência de ambientes a partir de configurações de capacidade (Blocker 2).
 * 4. Desacoplamento estrutural absoluto entre notas de auditoria interna (Venue.notes)
 *    e a cópia editorial pública (PublicVenueCard.editorialSummary) (Blocker 3).
 * 5. ZERO reutilização de fotografias não autorizadas ou enganosas.
 *    (MISREPRESENTATIVE_VENUE_IMAGES=0, UNAUTHORISED_EXTERNAL_IMAGES=0).
 * 6. ZERO badges de HAXR Verified, Visitado ou Parceiro.
 * 7. Eliminação total de enums técnicos internos na interface humana.
 */

import "server-only";
import type { Venue, VenueId, PublicVenueCard } from "./types";

/**
 * Traduz o tipo de espaço para designação factual contida.
 */
export function formatVenueTypeLabel(type: Venue["venueType"]): string {
  switch (type) {
    case "hotel_urbano":
      return "Hotel Urbano";
    case "resort_praia":
      return "Resort de Praia";
    case "centro_conferencias":
      return "Centro de Conferências";
    case "salao_eventos":
      return "Salão para Eventos";
    case "quinta_eventos":
      return "Quinta para Eventos";
    case "jardim_privado":
      return "Jardim Privado";
    case "espaco_cultural":
      return "Espaço Cultural";
  }
}

/**
 * Registo canónico de cópia editorial pública para espaços revistos em Preview.
 * Desacoplado categoricamente de Venue.notes (notas internas de auditoria técnica)
 * e estritamente restrito a atributos factuais verificados no modelo de evidência E.1.
 * ZERO adjectivação não comprovada, ZERO inferência de celebrações.
 */
export const VENUE_PUBLIC_EDITORIAL_REGISTRY: Partial<Record<VenueId, string>> = {
  POLANA_SERENA_HOTEL:
    "Hotel urbano na Avenida Julius Nyerere, Polana Cimento, dispondo do Salão Nobre com capacidade declarada para até 300 convidados em banquete e jardins exteriores.",
  SOUTHERN_SUN_MAPUTO:
    "Hotel urbano na Avenida da Marginal, Sommerschield, dispondo de sala principal com capacidade declarada para até 100 convidados em banquete e esplanada exterior.",
  HOTEL_GLORIA_CCJC:
    "Complexo hoteleiro e centro de conferências na Avenida da Marginal, Sommerschield II, dispondo de salão principal modular com capacidade declarada para até 1.000 convidados em banquete.",
  RADISSON_BLU_MAPUTO:
    "Hotel urbano na Avenida Marginal, Sommerschield, dispondo da Sala Zambeze com capacidade declarada para até 160 convidados em banquete e área de jardim privativo.",
};

/**
 * Composição factual de reserva baseada exclusivamente em dados públicos verificados.
 * NUNCA acede nem injecta Venue.notes.
 */
function composeFactualPublicSummary(venue: Venue): string {
  const typeLabel = formatVenueTypeLabel(venue.venueType);
  return `${typeLabel} localizado em ${venue.area}, ${venue.city}, seleccionado na curadoria editorial da HAXR Signature.`;
}

/**
 * Traduz a matriz de capacidade interna em linguagem pública editorial elegante.
 */
function formatPublicCapacityDisplay(venue: Venue): {
  label: string;
  isDeclared: boolean;
  detail?: string;
} {
  if (venue.trust.capacity === "VERIFIED") {
    const spaces = venue.evidence.capacity.value;
    const officialSpaces = spaces.filter(
      (s) => s.capacityType === "OFFICIAL_DECLARED_CAPACITY"
    );

    if (officialSpaces.length > 0) {
      const topSpace = officialSpaces.reduce((prev, curr) => {
        const prevCap = Math.max(prev.seatedCapacity ?? 0, prev.cocktailCapacity ?? 0);
        const currCap = Math.max(curr.seatedCapacity ?? 0, curr.cocktailCapacity ?? 0);
        return currCap > prevCap ? curr : prev;
      });

      const capNumber =
        topSpace.seatedCapacity ?? topSpace.cocktailCapacity ?? null;

      if (capNumber) {
        const formatNote = topSpace.seatedCapacity
          ? `${capNumber} convidados em banquete`
          : `${capNumber} convidados em coquetel`;

        return {
          label: `Capacidade declarada pelo espaço: até ${formatNote}`,
          isDeclared: true,
          detail: `Espaço de referência: ${topSpace.spaceName} (${topSpace.source})`,
        };
      }
    }
  }

  return {
    label: "Capacidade a confirmar directamente com o espaço",
    isDeclared: false,
    detail: "Sob consulta com a gerência do espaço segundo a configuração pretendida.",
  };
}

/**
 * Resumo dos espaços e ambientes do local.
 */
function formatSpacesSummary(venue: Venue): string {
  const spaces = venue.evidence.capacity.value;
  if (spaces.length === 0) {
    return "Configuração e salões a confirmar com o espaço.";
  }
  const spaceNames = spaces.map((s) => s.spaceName).filter(Boolean);
  if (spaceNames.length <= 2) {
    return spaceNames.join(" e ");
  }
  return `${spaceNames.slice(0, 2).join(", ")} e outros ambientes`;
}

/**
 * Mapeia uma entidade de domínio Venue para o cartão público PublicVenueCard.
 *
 * Invariantes Estritos:
 * - Venue.notes NUNCA é atribuído a editorialSummary (Blocker 3).
 * - Sem inferência de celebrações nem ambientes (Blockers 1 e 2).
 */
export function mapVenueToPublicCard(venue: Venue): PublicVenueCard {
  const capacityDisplay = formatPublicCapacityDisplay(venue);
  const spacesSummary = formatSpacesSummary(venue);

  // Blocker 3: Fronteira explícita. Nunca atribuir venue.notes directamente!
  const editorialSummary =
    VENUE_PUBLIC_EDITORIAL_REGISTRY[venue.id] ?? composeFactualPublicSummary(venue);

  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    city: venue.city,
    area: venue.area,
    locationLabel: `${venue.area}, ${venue.city}`,
    venueType: venue.venueType,
    venueTypeLabel: formatVenueTypeLabel(venue.venueType),
    editorialSummary,
    spacesSummary,
    capacityDisplay,
    // Política estrita de direitos de imagem: sem cessão expressa, utiliza placeholder editorial neutro
    hasDedicatedImage: false,
    imageUrl: undefined,
    imageAlt: undefined,
    contactAvailability: {
      hasPhone: venue.trust.contact === "VERIFIED" && Boolean(venue.evidence.phone.value),
      hasWebsite: venue.trust.contact === "VERIFIED" && Boolean(venue.evidence.website.value),
    },
  };
}
