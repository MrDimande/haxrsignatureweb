import { CONCIERGE_CONFIDENCE_LOW_THRESHOLD } from "@/lib/concierge/concierge-confidence";
import type { ConciergeDocType } from "@/lib/concierge/types";

/** Tipos que a IA pode devolver antes de normalização para a BD. */
export type ClassifierDocType = ConciergeDocType | "irrelevant" | "event_document";

export const CONCIERGE_APPLICABLE_TYPES = [
  "vendor_proposal",
  "payment_receipt",
  "guest_list",
  "visual_reference",
  "checklist",
  "contract",
] as const satisfies readonly ConciergeDocType[];

export const IRRELEVANT_OPERATOR_MESSAGE =
  "Este documento não parece estar relacionado com o evento ou com os módulos do HAXR Concierge.";

export function readRejectionReason(data: Record<string, unknown>): string | null {
  const reason = data.rejectionReason;
  if (typeof reason === "string" && reason.trim()) {
    return reason.trim();
  }
  if (data.notEventRelated === true) {
    return "not_event_related";
  }
  return null;
}

export function isIrrelevantExtraction(data: Record<string, unknown>): boolean {
  const docType = data.documentType;
  if (docType === "irrelevant") {
    return true;
  }
  const reason = readRejectionReason(data);
  if (reason === "not_event_related" || reason === "irrelevant") {
    return true;
  }
  if (docType === "other" && reason) {
    return true;
  }
  return false;
}

export function isNonApplicableDocumentType(documentType: unknown): boolean {
  if (typeof documentType !== "string") return true;
  if (documentType === "irrelevant" || documentType === "event_document") {
    return true;
  }
  return (
    documentType === "other" ||
    !CONCIERGE_APPLICABLE_TYPES.includes(documentType as (typeof CONCIERGE_APPLICABLE_TYPES)[number])
  );
}

export function isConciergeExtractionApplicable(data: Record<string, unknown>): boolean {
  if (isIrrelevantExtraction(data)) {
    return false;
  }
  return !isNonApplicableDocumentType(data.documentType);
}

export function hasLowConfidenceForApply(data: Record<string, unknown>): boolean {
  const value = data.confidence;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return false;
  }
  return value < CONCIERGE_CONFIDENCE_LOW_THRESHOLD;
}

export function getApplicabilityLabel(data: Record<string, unknown>): string {
  if (isIrrelevantExtraction(data)) {
    return "Irrelevante";
  }
  const docType = data.documentType;
  if (docType === "contract" || docType === "event_document") {
    return "Arquivo (contrato)";
  }
  if (docType === "other") {
    return "Não aplicável";
  }
  if (isConciergeExtractionApplicable(data)) {
    return "Aplicável";
  }
  return "Não aplicável";
}

/**
 * Normaliza tipos da IA para valores aceites pelo enum PostgreSQL.
 * irrelevant → other + rejectionReason; event_document → contract.
 */
export function normalizeClassifierDocumentType(
  documentType: ClassifierDocType,
  rejectionReason?: string | null
): { documentType: ConciergeDocType; rejectionReason?: string } {
  switch (documentType) {
    case "irrelevant":
      return {
        documentType: "other",
        rejectionReason: rejectionReason?.trim() || "not_event_related",
      };
    case "event_document":
      return {
        documentType: "contract",
        rejectionReason: rejectionReason?.trim() || "event_document_archive_only",
      };
    default:
      return {
        documentType,
        ...(rejectionReason?.trim() ? { rejectionReason: rejectionReason.trim() } : {}),
      };
  }
}
