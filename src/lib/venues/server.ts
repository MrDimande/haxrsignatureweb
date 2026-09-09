/**
 * HAXR Signature — Venue Intelligence & Domain Foundation (Server-Only Entry Point)
 *
 * Ponto de entrada canónico e exclusivo do lado servidor para acesso ao dataset interno,
 * validação de domínio e portas de publicação governadas por ambiente.
 *
 * Directriz Arquitectural (Blocker B):
 * - Este módulo NUNCA deve ser importado por componentes de cliente ("use client").
 * - O barrel genérico `@/lib/venues` (index.ts) permanece estritamente client-safe.
 */

import "server-only";
import { assertServerContext, getPublicVenuesForCanonicalEnvironment } from "./publication";
import { mapVenueToPublicCard } from "./public-mapper";
import type { PublicVenueCard } from "./types";

// Assegura contexto estritamente de servidor aquando da inicialização do módulo
assertServerContext();

export * from "./types";
export * from "./venue-data";
export * from "./venue-validation";
export * from "./publication";
export * from "./public-mapper";

/**
 * Ponto de entrada canónico de servidor que devolve directamente os DTOs públicos
 * já sanitizados (PublicVenueCard[]), assegurando que o modelo interno Venue
 * nunca é exposto aos componentes de interface.
 */
export function getPublicVenueCardsForCanonicalEnvironment(): PublicVenueCard[] {
  assertServerContext();
  const venues = getPublicVenuesForCanonicalEnvironment();
  return venues.map(mapVenueToPublicCard);
}

