/**
 * HAXR Signature — Venue Domain Model (Phase E.1)
 *
 * Modelo de domínio canónico interno para espaços de celebrações e casamentos.
 * Governa dimensões de confiança independentes, evidência ao nível do campo,
 * estados de prontidão de publicação e guardrails estritos de integridade.
 *
 * Norma Linguística: Português de Moçambique (documentação e comentários).
 * Identificadores Técnicos: Inglês canónico.
 */

export type VenueId =
  | "THE_VENUE_MZ"
  | "VILA_VERDE_MOZAL"
  | "ALIANCA_EVENTOS"
  | "EVELYN_EVENTOS"
  | "CASA_D_ARTISTA_KUTENGA"
  | "POLANA_SERENA_HOTEL"
  | "SOUTHERN_SUN_MAPUTO"
  | "HOTEL_GLORIA_CCJC"
  | "MONTEBELO_INDY_HOTEL"
  | "RADISSON_BLU_MAPUTO"
  | "CATEMBE_GALLERY_HOTEL"
  | "QUINTA_DA_STELA"
  | "CASTELO_EVENTOS"
  | "QUINTA_NARO_EVENTOS"
  | "NAMYLALA_EVENTOS"
  | "COMPLEXO_LOUANINE";

export type VenueType =
  | "salao_eventos"
  | "quinta_eventos"
  | "hotel_urbano"
  | "resort_praia"
  | "centro_conferencias"
  | "jardim_privado"
  | "espaco_cultural";

export type TrustDimensionStatus = "VERIFIED" | "A_CONFIRMAR" | "NOT_APPLICABLE";

export type VisitedByHaxrStatus = boolean | "A_CONFIRMAR";

export type EvidenceSourceType =
  | "OFFICIAL_WEBSITE"
  | "OFFICIAL_SOCIAL_PROFILE"
  | "OFFICIAL_DOCUMENT"
  | "OWNER_CONFIRMED"
  | "VERIFIED_BUSINESS_LISTING"
  | "TRUSTED_EXTERNAL_SOURCE"
  | "SECONDARY_DIRECTORY"
  | "DOCUMENTARY_EVIDENCE"
  | "VISITED_BY_HAXR";

/**
 * Rastreabilidade de evidência ao nível de cada atributo factual individual.
 */
export type VenueFieldEvidence<T = unknown> = {
  field: string;
  value: T;
  status: TrustDimensionStatus;
  sourceType: EvidenceSourceType;
  sourceReference: string;
  sourceDate?: string;
  verifiedAt?: string;
  notes?: string;
};

/**
 * Tipificação estrita de capacidade discriminada por ambiente e formato.
 * Banida qualquer referência a "capacidade homologada" sem acto regulamentar público.
 */
export type CapacityConfigurationType =
  | "OFFICIAL_DECLARED_CAPACITY"
  | "OBSERVED_EVENT_GUEST_SCALE"
  | "A_CONFIRMAR";

export type CapacitySpaceDetail = {
  spaceName: string;
  configuration: "banquete" | "coquetel" | "misto" | "ar_livre" | "outro";
  seatedCapacity: number | null;
  cocktailCapacity: number | null;
  capacityType: CapacityConfigurationType;
  source: string;
  notes?: string;
};

/**
 * Matriz de 8 Dimensões Independentes de Confiança HAXR Signature.
 * É expressamente proibido fundir estas dimensões num único booleano genérico.
 */
export type VenueTrustMatrix = {
  identity: TrustDimensionStatus;
  location: TrustDimensionStatus;
  contact: TrustDimensionStatus;
  capability: TrustDimensionStatus;
  capacity: TrustDimensionStatus;
  visitedByHaxr: VisitedByHaxrStatus;
  haxrVerified: boolean;
  haxrPartner: boolean;
};

/**
 * Estado Primário de Prontidão de Publicação (Mutuamente Exclusivo).
 * Cada local possui exactamente um estado primário.
 */
export type PrimaryPublicationReadiness =
  | "RESEARCH_ONLY"
  | "NEEDS_EXTERNAL_VERIFICATION"
  | "NEEDS_OWNER_CONFIRMATION"
  | "FOUNDATION_READY"
  | "POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW";

/**
 * Indicadores Secundários de Acção / Auditoria Pendente.
 */
export type SecondaryReadinessFlag =
  | "NEEDS_IDENTITY_VERIFICATION"
  | "NEEDS_LOCATION_VERIFICATION"
  | "NEEDS_CONTACT_VERIFICATION"
  | "NEEDS_CAPABILITY_VERIFICATION"
  | "NEEDS_CAPACITY_VERIFICATION"
  | "NEEDS_CAPACITY_BREAKDOWN_VERIFICATION"
  | "NEEDS_PHYSICAL_VISIT"
  | "NEEDS_EDITORIAL_REVIEW"
  | "NEEDS_EDITORIAL_POSITIONING"
  | "NEEDS_LOGISTICS_EVALUATION";

/**
 * Conjunto de campos de alto valor com obrigatoriedade de rastreabilidade de evidência.
 */
export type VenueHighValueEvidence = {
  name: VenueFieldEvidence<string>;
  address: VenueFieldEvidence<string>;
  cityArea: VenueFieldEvidence<string>;
  phone: VenueFieldEvidence<string | null>;
  website: VenueFieldEvidence<string | null>;
  capacity: VenueFieldEvidence<CapacitySpaceDetail[]>;
  venueCapability: VenueFieldEvidence<{
    generator: TrustDimensionStatus;
    airConditioning: TrustDimensionStatus;
    dedicatedKitchen: TrustDimensionStatus;
    privateRestrooms: TrustDimensionStatus;
  }>;
  generator: VenueFieldEvidence<string>;
  accessibility: VenueFieldEvidence<string>;
  accommodation: VenueFieldEvidence<string>;
  parking: VenueFieldEvidence<string>;
  pricing: VenueFieldEvidence<string>;
};

/**
 * Entidade Canónica de Local (Venue).
 */
export type Venue = {
  id: VenueId;
  slug: string;
  name: string;
  officialRegisteredName?: string;
  city: "Maputo" | "Matola";
  area: string;
  venueType: VenueType;

  // Matriz de Confiança Independente
  trust: VenueTrustMatrix;

  // Prontidão de Publicação
  readiness: {
    primary: PrimaryPublicationReadiness;
    secondaryFlags: SecondaryReadinessFlag[];
  };

  // Evidência Detalhada ao Nível do Campo
  evidence: VenueHighValueEvidence;

  // Fontes Gerais de Rastreio da Investigação
  sources: {
    primary: {
      type: EvidenceSourceType;
      reference: string;
    };
    secondary: {
      type: EvidenceSourceType;
      reference: string;
    };
  };

  // Notas Editoriais e de Auditoria Interna
  notes: string;
  lastChecked: string;
};
