/**
 * HAXR Signature — Public Venue Guide Types & Mappers (Client-Safe Entry Point)
 *
 * Exportações públicas seguras para consumo no cliente e em componentes de interface.
 * Não exporta o dataset interno (HAXR_INTERNAL_VENUES) nem a lógica de publicação do servidor (Blocker B).
 * Para acesso restrito do lado servidor, importar exclusivamente de `@/lib/venues/server`.
 */

export type * from "./types";
export {
  mapVenueToPublicCard,
  formatVenueTypeLabel,
  VENUE_PUBLIC_EDITORIAL_REGISTRY,
} from "./public-mapper";
