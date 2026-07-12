import type { InvoiceDocument } from "@/lib/admin/types";

/** Logo horizontal em falta no public/ — usar mark existente no PDF. */
export const LEGACY_MISSING_HORIZONTAL_LOGO =
  "/images/brand/logo-horizontal-gold.png";

export const PDF_LOGO_FALLBACK = "/images/brand/logo-horizontal-gold.png";

export function normalizePdfLogoPath(logoPath: string): string {
  const trimmed = logoPath.trim();
  if (!trimmed) return PDF_LOGO_FALLBACK;
  if (trimmed === LEGACY_MISSING_HORIZONTAL_LOGO) return PDF_LOGO_FALLBACK;
  return trimmed;
}

export function resolvePublicAssetUrl(path: string, origin: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const base = origin.replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function resolvePdfLogoUrl(logoPath: string, origin: string): string {
  const normalized = normalizePdfLogoPath(logoPath);
  return resolvePublicAssetUrl(normalized, origin);
}

export function getPdfFilename(document: InvoiceDocument): string {
  return `${document.documentNumber.replace(/\//g, "-")}.pdf`;
}
