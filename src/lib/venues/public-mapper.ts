/**
 * HAXR Signature — Public Venue Card Mapper & Trust Language (Phase E.2)
 *
 * Mapeamento estrito e tradução de dados de domínio para visualização pública editorial.
 *
 * Directrizes de Alta-Costura e Integridade Factual:
 * 1. ZERO terminologia "homologado/homologada" sem acto regulamentar público evidenciado.
 *    Substituído por: "informação verificada", "capacidade declarada em fonte oficial".
 * 2. ZERO reutilização de fotografias não autorizadas ou enganosas.
 *    (MISREPRESENTATIVE_VENUE_IMAGES=0, UNAUTHORISED_EXTERNAL_IMAGES=0).
 *    Sem consentimento formal de direitos para imagens próprias de cada hotel/salão,
 *    utiliza-se o Placeholder Editorial Neutro HAXR.
 * 3. ZERO badges de HAXR Verified, Visitado ou Parceiro.
 * 4. Eliminação total de enums técnicos internos na interface humana.
 */

import type { Venue, PublicVenueCard } from "./types";

/**
 * Traduz o tipo de espaço para designação editorial sofisticada.
 */
function formatVenueTypeLabel(type: Venue["venueType"]): string {
  switch (type) {
    case "hotel_urbano":
      return "Hotel Urbano & Celebrações";
    case "resort_praia":
      return "Resort & Celebrações à Beira-Mar";
    case "centro_conferencias":
      return "Centro de Conferências & Grandes Recepções";
    case "salao_eventos":
      return "Salão Exclusivo para Eventos";
    case "quinta_eventos":
      return "Quinta & Jardim para Celebrações";
    case "jardim_privado":
      return "Jardim Privado para Celebrações";
    case "espaco_cultural":
      return "Espaço Cultural & Histórico";
  }
}

/**
 * Mapeia ambientes e formatos suportados com base nos espaços reais documentados.
 */
function deriveEnvironments(
  venue: Venue
): ("Interior" | "Exterior" | "Interior + Exterior")[] {
  const spaces = venue.evidence.capacity.value;
  const configs = new Set(spaces.map((s) => s.configuration));

  const hasInterior =
    configs.has("banquete") || configs.has("coquetel") || configs.has("misto");
  const hasExterior = configs.has("ar_livre");

  if (hasInterior && hasExterior) {
    return ["Interior + Exterior", "Interior", "Exterior"];
  }
  if (hasExterior) {
    return ["Exterior"];
  }
  return ["Interior"];
}

/**
 * Mapeia tipos de celebração suportados com base em capacidade e tipologia do espaço.
 */
function deriveCelebrations(venue: Venue): string[] {
  const spaces = venue.evidence.capacity.value;
  const maxCapacity = Math.max(
    ...spaces.map((s) => Math.max(s.seatedCapacity ?? 0, s.cocktailCapacity ?? 0)),
    0
  );

  const list: string[] = ["Casamentos"];
  if (maxCapacity >= 80) {
    list.push("Recepções");
    list.push("Lobolos");
  }
  if (spaces.some((s) => s.configuration === "ar_livre" || s.configuration === "misto")) {
    list.push("Cerimónias");
  }
  return list;
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
 */
export function mapVenueToPublicCard(venue: Venue): PublicVenueCard {
  const capacityDisplay = formatPublicCapacityDisplay(venue);
  const environments = deriveEnvironments(venue);
  const celebrationsSupported = deriveCelebrations(venue);
  const spacesSummary = formatSpacesSummary(venue);

  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    city: venue.city,
    area: venue.area,
    locationLabel: `${venue.area}, ${venue.city}`,
    venueType: venue.venueType,
    venueTypeLabel: formatVenueTypeLabel(venue.venueType),
    editorialSummary: venue.notes,
    celebrationsSupported,
    environments,
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
