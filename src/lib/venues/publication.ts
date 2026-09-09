/**
 * HAXR Signature — Venue Editorial Publication & Whitelist Gate (Phase E.2 Corrective)
 *
 * Governação estrita de publicação no servidor:
 * 1. DOMAIN_READINESS (readiness primária e dimensões de confiança)
 * 2. EDITORIAL_APPROVAL (aprovação explícita no registo editorial)
 * 3. ENVIRONMENT_VISIBILITY (conjunção server-side exclusiva com VERCEL_ENV)
 *
 * Proibições Estritas de Segurança (Blocker 4 & Blocker 5):
 * - Execução restrita ao servidor (assertServerContext);
 * - Nunca permitir que cookies, query strings, searchParams, headers ou estado
 *   de cliente alterem a visibilidade (CLIENT_SIDE_PRODUCTION_UNLOCK = false);
 * - Em Produção: PRODUCTION_VENUES_RENDERABLE = 0;
 * - Em Preview: PREVIEW_VENUES_RENDERABLE = 4 (apenas os 4 candidatos de revisão).
 */

import type { Venue, VenueId, VenueEditorialPublicationStatus } from "./types";
import { HAXR_INTERNAL_VENUES } from "./venue-data";
import { isVenueEligibleForPublication } from "./venue-validation";

export { HAXR_INTERNAL_VENUES } from "./venue-data";
export {
  isVenueEligibleForPublication,
  isVenueHaxrVerified,
  validateVenueDataset,
  validateCapacityDistinction,
} from "./venue-validation";

export type PublicationEnvironment = "production" | "preview" | "development";

/**
 * Barreira de execução estritamente do lado servidor.
 * Impede execução acidental ou tentativa de importação/unlock no browser.
 */
export function assertServerContext(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY_VIOLATION: O módulo de publicação de locais só pode ser executado no ambiente servidor."
    );
  }
}

/**
 * Detecção canónica do ambiente server-side via variáveis de ambiente da Vercel / Node.
 * Não aceita nem inspecciona searchParams, cookies, cabeçalhos de pedido ou estado de cliente.
 */
export function getCanonicalEnvironment(): PublicationEnvironment {
  assertServerContext();

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";

  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return "development";
}

/**
 * Registo canónico de aprovação editorial de publicação para os 16 locais.
 */
export const VENUE_EDITORIAL_PUBLICATION_REGISTRY: Record<
  VenueId,
  VenueEditorialPublicationStatus
> = {
  // Os 4 candidatos de revisão (aprovados EXCLUSIVAMENTE para Preview)
  POLANA_SERENA_HOTEL: "APPROVED_FOR_PREVIEW",
  SOUTHERN_SUN_MAPUTO: "APPROVED_FOR_PREVIEW",
  HOTEL_GLORIA_CCJC: "APPROVED_FOR_PREVIEW",
  RADISSON_BLU_MAPUTO: "APPROVED_FOR_PREVIEW",

  // Os 5 de proprietário nomeado (aguardam confirmação do proprietário)
  THE_VENUE_MZ: "DRAFT",
  VILA_VERDE_MOZAL: "DRAFT",
  ALIANCA_EVENTOS: "DRAFT",
  EVELYN_EVENTOS: "DRAFT",
  CASA_D_ARTISTA_KUTENGA: "DRAFT",

  // Os 3 que requerem verificação externa independente
  MONTEBELO_INDY_HOTEL: "DRAFT",
  CATEMBE_GALLERY_HOTEL: "DRAFT",
  QUINTA_NARO_EVENTOS: "DRAFT",

  // Os 4 dependentes exclusivamente de directórios secundários
  QUINTA_DA_STELA: "DRAFT",
  CASTELO_EVENTOS: "DRAFT",
  NAMYLALA_EVENTOS: "DRAFT",
  COMPLEXO_LOUANINE: "DRAFT",
};

/**
 * Avalia se um local cumpre a conjunção de todas as regras de publicação para o ambiente alvo.
 */
export function isVenueEligibleForEnvironment(
  venue: Venue,
  env: PublicationEnvironment = getCanonicalEnvironment()
): boolean {
  assertServerContext();

  const editorialStatus =
    VENUE_EDITORIAL_PUBLICATION_REGISTRY[venue.id] ?? "DRAFT";

  // Regra Absoluta 1: Locais RESEARCH_ONLY nunca podem ser renderizados publicamente
  if (venue.readiness.primary === "RESEARCH_ONLY") {
    return false;
  }

  // Regra Absoluta 2: Locais cuja identidade seja A_CONFIRMAR nunca podem ser renderizados
  if (venue.trust.identity === "A_CONFIRMAR") {
    return false;
  }

  // Regra Absoluta 3: Locais suspensos ou em rascunho nunca são exibidos
  if (editorialStatus === "SUSPENDED" || editorialStatus === "DRAFT") {
    return false;
  }

  // Regra Absoluta 4: Ambiente de Produção
  if (env === "production") {
    if (editorialStatus !== "APPROVED_FOR_PUBLICATION") {
      return false;
    }
    return isVenueEligibleForPublication(venue);
  }

  // Regra Absoluta 5: Ambiente de Preview e Desenvolvimento
  if (env === "preview" || env === "development") {
    return (
      editorialStatus === "APPROVED_FOR_PREVIEW" ||
      editorialStatus === "APPROVED_FOR_PUBLICATION"
    );
  }

  return false;
}

/**
 * Ponto de entrada canónico no servidor (zero argumentos) para a rota pública.
 * Obtém os locais elegíveis determinando o ambiente exclusivamente no servidor.
 */
export function getPublicVenuesForCanonicalEnvironment(): Venue[] {
  assertServerContext();
  const env = getCanonicalEnvironment();
  return HAXR_INTERNAL_VENUES.filter((venue) =>
    isVenueEligibleForEnvironment(venue, env)
  );
}

/**
 * Obtém a colecção de locais elegíveis para o ambiente explicitado (usado para testes de integração e lógica pura).
 */
export function getPublicVenues(
  env: PublicationEnvironment = getCanonicalEnvironment()
): Venue[] {
  assertServerContext();
  return HAXR_INTERNAL_VENUES.filter((venue) =>
    isVenueEligibleForEnvironment(venue, env)
  );
}

