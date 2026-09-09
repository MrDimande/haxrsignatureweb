/**
 * HAXR Signature — Public Venue Guide Presentation Types (Client-Safe Entry Point)
 *
 * Exportações estritamente de tipos para consumo de apresentação na interface.
 * Zero código executável, zero datasets internos, zero registries expostos ao cliente.
 * Para operações do lado servidor, importar exclusivamente de `@/lib/venues/server`.
 */

export type {
  PublicVenueCard,
  VenueId,
  VenueType,
  VenueEditorialPublicationStatus,
} from "./types";
