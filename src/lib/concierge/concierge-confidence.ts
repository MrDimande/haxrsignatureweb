export const CONCIERGE_CONFIDENCE_LOW_THRESHOLD = 0.7;

export type ConfidenceLevel = "high" | "low" | "unknown";

export function getConfidenceLevel(confidence: unknown): ConfidenceLevel {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return "unknown";
  }
  return confidence >= CONCIERGE_CONFIDENCE_LOW_THRESHOLD ? "high" : "low";
}

export function readConfidenceFromExtractedData(
  extractedData: Record<string, unknown>
): number | null {
  const value = extractedData.confidence;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

export function formatConfidencePercent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
