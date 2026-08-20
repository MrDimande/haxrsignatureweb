import { HAXR_BRAND_ASSETS } from "@/lib/brand/brand-assets";
import type { Business, DocumentPdfTemplate, InvoiceDocument } from "@/lib/admin/types";

export const PDF_LOGO_FALLBACK = HAXR_BRAND_ASSETS.horizontalGold;

export function resolveDocumentLogoPath(
  business: Business,
  template: DocumentPdfTemplate = "editorial_ivory"
): string {
  if (business.id === "haxr-signature") {
    switch (template) {
      case "editorial_ivory":
        return HAXR_BRAND_ASSETS.horizontalGold;
      case "signature_noir":
        return HAXR_BRAND_ASSETS.horizontalGold;
      case "executive":
        return HAXR_BRAND_ASSETS.horizontalDark;
      case "atelier_blanc":
        return HAXR_BRAND_ASSETS.horizontalDark;
      case "maison_signature":
        return HAXR_BRAND_ASSETS.verticalGold;
      default:
        return HAXR_BRAND_ASSETS.horizontalGold;
    }
  }
  return business.logo;
}

export function normalizePdfLogoPath(logoPath: string): string {
  const trimmed = logoPath.trim();
  if (!trimmed) return PDF_LOGO_FALLBACK;
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
