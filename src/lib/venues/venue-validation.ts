/**
 * HAXR Signature — Venue Validation & Publication Guardrails (Phase E.1)
 *
 * Funções de validação em tempo de execução, integridade de confiança e
 * cancelamento estrito de publicação acidental.
 */

import type {
  Venue,
  PrimaryPublicationReadiness,
  CapacitySpaceDetail,
} from "./types";

export type VenueValidationSummary = {
  totalVenues: number;
  identityVerified: number;
  identityAConfirmar: number;
  locationVerified: number;
  locationAConfirmar: number;
  contactVerified: number;
  contactAConfirmar: number;
  capabilityVerified: number;
  capabilityAConfirmar: number;
  capacityVerified: number;
  capacityAConfirmar: number;
  visitedByHaxrCount: number;
  haxrVerifiedCount: number;
  haxrPartnerCount: number;
  primaryReadinessCounts: Record<PrimaryPublicationReadiness, number>;
  primaryReadinessTotal: number;
};

export type VenueValidationResult = {
  isValid: boolean;
  errors: string[];
  summary: VenueValidationSummary;
};

/**
 * Gatekeeper de elegibilidade de publicação.
 * Conservador: na Fase E.1 nenhum local pode ser renderizado publicamente.
 */
export function isVenueEligibleForPublication(venue: Venue): boolean {
  // Guardrail 1: Locais em pesquisa pura estão permanentemente bloqueados
  if (venue.readiness.primary === "RESEARCH_ONLY") {
    return false;
  }

  // Guardrail 2: Locais dependentes de verificação externa ou confirmação do proprietário
  if (
    venue.readiness.primary === "NEEDS_EXTERNAL_VERIFICATION" ||
    venue.readiness.primary === "NEEDS_OWNER_CONFIRMATION"
  ) {
    return false;
  }

  // Guardrail 3: Locais Foundation Ready requerem revisão editorial completa
  if (venue.readiness.primary === "FOUNDATION_READY") {
    return false;
  }

  // Guardrail 4: Na Fase E.1, mesmo os locais "POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW"
  // não possuem revisão editorial concluída nem aprovação final do proprietário.
  if (venue.readiness.primary === "POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW") {
    return false;
  }

  return false;
}

/**
 * Avalia se um local cumpre os requisitos de verificação HAXR_VERIFIED.
 * Requer vistoria presencial física, caderno de encargos e evidência documental.
 * Na Fase E.1, o resultado para todos os 16 locais é obrigatoriamente FALSE.
 */
export function isVenueHaxrVerified(venue: Venue): boolean {
  if (venue.trust.haxrVerified !== true) {
    return false;
  }

  // Exigência de visita presencial documentada
  if (venue.trust.visitedByHaxr !== true) {
    return false;
  }

  // Exigência de identidade, capacidade e infra-estrutura verificadas
  if (
    venue.trust.identity !== "VERIFIED" ||
    venue.trust.capability !== "VERIFIED" ||
    venue.trust.capacity !== "VERIFIED"
  ) {
    return false;
  }

  return true;
}

/**
 * Assegura que uma capacidade observada em evento (OBSERVED_EVENT_GUEST_SCALE)
 * nunca seja promovida a capacidade oficial declarada (OFFICIAL_DECLARED_CAPACITY).
 */
export function validateCapacityDistinction(details: CapacitySpaceDetail[]): boolean {
  for (const detail of details) {
    if (detail.capacityType === "OBSERVED_EVENT_GUEST_SCALE") {
      // Capacidades observadas não podem ter asserção de lotação oficial máxima
      if (detail.notes && detail.notes.includes("capacidade máxima regulamentar")) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Validação rigorosa do dataset completo face às regras da Constituição HAXR e Fase E.0/E.1.
 */
export function validateVenueDataset(venues: Venue[]): VenueValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  const summary: VenueValidationSummary = {
    totalVenues: venues.length,
    identityVerified: 0,
    identityAConfirmar: 0,
    locationVerified: 0,
    locationAConfirmar: 0,
    contactVerified: 0,
    contactAConfirmar: 0,
    capabilityVerified: 0,
    capabilityAConfirmar: 0,
    capacityVerified: 0,
    capacityAConfirmar: 0,
    visitedByHaxrCount: 0,
    haxrVerifiedCount: 0,
    haxrPartnerCount: 0,
    primaryReadinessCounts: {
      RESEARCH_ONLY: 0,
      NEEDS_EXTERNAL_VERIFICATION: 0,
      NEEDS_OWNER_CONFIRMATION: 0,
      FOUNDATION_READY: 0,
      POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW: 0,
    },
    primaryReadinessTotal: 0,
  };

  for (const venue of venues) {
    // 1. Unicidade de IDs e Slugs
    if (seenIds.has(venue.id)) {
      errors.push(`ID de local duplicado: ${venue.id}`);
    }
    seenIds.add(venue.id);

    if (seenSlugs.has(venue.slug)) {
      errors.push(`Slug de local duplicado: ${venue.slug}`);
    }
    seenSlugs.add(venue.slug);

    // 2. Contabilização da Matriz de Confiança
    if (venue.trust.identity === "VERIFIED") summary.identityVerified++;
    if (venue.trust.identity === "A_CONFIRMAR") summary.identityAConfirmar++;

    if (venue.trust.location === "VERIFIED") summary.locationVerified++;
    if (venue.trust.location === "A_CONFIRMAR") summary.locationAConfirmar++;

    if (venue.trust.contact === "VERIFIED") summary.contactVerified++;
    if (venue.trust.contact === "A_CONFIRMAR") summary.contactAConfirmar++;

    if (venue.trust.capability === "VERIFIED") summary.capabilityVerified++;
    if (venue.trust.capability === "A_CONFIRMAR") summary.capabilityAConfirmar++;

    if (venue.trust.capacity === "VERIFIED") summary.capacityVerified++;
    if (venue.trust.capacity === "A_CONFIRMAR") summary.capacityAConfirmar++;

    if (venue.trust.visitedByHaxr === true) summary.visitedByHaxrCount++;
    if (venue.trust.haxrVerified === true) summary.haxrVerifiedCount++;
    if (venue.trust.haxrPartner === true) summary.haxrPartnerCount++;

    // 3. Contabilização da Prontidão Primária
    const primary = venue.readiness.primary;
    if (summary.primaryReadinessCounts[primary] !== undefined) {
      summary.primaryReadinessCounts[primary]++;
      summary.primaryReadinessTotal++;
    } else {
      errors.push(`Local ${venue.id} possui estado de prontidão primária desconhecido: ${primary}`);
    }

    // 4. Guardrail: Bloqueio de Publicação na Fase E.1
    if (isVenueEligibleForPublication(venue)) {
      errors.push(
        `VIOLAÇÃO DE GUARDRAIL E.1: Local ${venue.id} avaliado como elegível para publicação pública. Na Fase E.1 todos os locais devem permanecer inelegíveis.`
      );
    }

    // 5. Guardrail: Bloqueio de HAXR_VERIFIED na Fase E.1
    if (isVenueHaxrVerified(venue)) {
      errors.push(
        `VIOLAÇÃO DE GUARDRAIL E.1: Local ${venue.id} avaliado como HAXR_VERIFIED=true sem verificação presencial da checklist.`
      );
    }

    // 6. Guardrail: Locais secundários não podem ter identidade verificada
    const secondaryOnlyIds = [
      "QUINTA_DA_STELA",
      "CASTELO_EVENTOS",
      "NAMYLALA_EVENTOS",
      "COMPLEXO_LOUANINE",
    ];
    if (secondaryOnlyIds.includes(venue.id)) {
      if (venue.trust.identity === "VERIFIED") {
        errors.push(
          `Local dependente exclusivamente de directórios secundários (${venue.id}) não pode ter IDENTITY=VERIFIED.`
        );
      }
      if (venue.readiness.primary !== "RESEARCH_ONLY") {
        errors.push(
          `Local secundário (${venue.id}) deve ter prontidão primária RESEARCH_ONLY (actual: ${venue.readiness.primary}).`
        );
      }
    }

    // 7. Guardrail: Parceria não pode implicar verificação e vice-versa
    if (venue.trust.haxrPartner === true && venue.trust.haxrVerified === true) {
      errors.push(
        `Alerta de Governação: Local ${venue.id} possui haxrPartner e haxrVerified simultâneos sem contrato formal auditado.`
      );
    }

    // 8. Distinção de Capacidade
    const capacityDetails = venue.evidence.capacity.value;
    if (!validateCapacityDistinction(capacityDetails)) {
      errors.push(
        `Local ${venue.id} mistura capacidade observada em evento com lotação máxima regulamentar.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    summary,
  };
}
