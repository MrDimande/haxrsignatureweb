/**
 * Caminhos canónicos dos assets de marca HAXR Signature.
 *
 * public/images/brand/:
 * - haxr-mark-gold.png
 * - logo-horizontal-gold.png
 * - logo-vertical-gold.png
 * - logo-horizontal-light.png (fundos claros)
 *
 * Pendentes (adicionar quando exportados):
 * - haxr-mark-light.png
 * - haxr-logo-dark.png
 */

export const HAXR_BRAND_ALT = "HAXR Signature" as const;

export const HAXR_BRAND_ASSETS = {
  markGold: "/images/brand/logo-horizontal-gold.png",
  markLight: "/images/brand/haxr-mark-light.png",
  logoHorizontalGold: "/images/brand/logo-horizontal-gold.png",
  logoHorizontalLight: "/images/brand/logo-horizontal-light.png",
  logoVerticalGold: "/images/brand/logo-vertical-gold.png",
  logoDark: "/images/brand/haxr-logo-dark.png",
  /** Email — horizontal preferido; mark como fallback */
  emailHorizontal: "/images/brand/logo-horizontal-gold.png",
  emailHorizontalCropped: "/images/brand/logo-horizontal-gold-email.png",
  emailMark: "/images/brand/logo-horizontal-gold.png",
} as const;

/** Ficheiros confirmados em public/ */
export const HAXR_BRAND_ASSETS_AVAILABLE = {
  markGold: true,
  markLight: false,
  logoHorizontalGold: true,
  logoHorizontalLight: true,
  logoVerticalGold: true,
  logoHorizontalGoldEmail: false,
  logoDark: false,
} as const;

export type HaxrLogoVariant = "full" | "mark" | "wordmark";
export type HaxrLogoTone = "light" | "dark" | "gold";
export type HaxrLogoSize = "sm" | "md" | "lg" | "email";

export function getBrandAssetPath(
  key: keyof typeof HAXR_BRAND_ASSETS
): string {
  return HAXR_BRAND_ASSETS[key];
}

/** Asset horizontal para UI conforme tom de fundo */
export function resolveHorizontalLogoPath(tone: HaxrLogoTone): string {
  if (tone === "light") {
    if (HAXR_BRAND_ASSETS_AVAILABLE.logoDark) {
      return HAXR_BRAND_ASSETS.logoDark;
    }
    if (HAXR_BRAND_ASSETS_AVAILABLE.logoHorizontalLight) {
      return HAXR_BRAND_ASSETS.logoHorizontalLight;
    }
  }
  return HAXR_BRAND_ASSETS.logoHorizontalGold;
}

/** Monograma conforme tom de fundo */
export function resolveMarkLogoPath(tone: HaxrLogoTone): string {
  if (tone === "light" && HAXR_BRAND_ASSETS_AVAILABLE.markLight) {
    return HAXR_BRAND_ASSETS.markLight;
  }
  return HAXR_BRAND_ASSETS.markGold;
}

/** Logo para emails — crop email-specific, depois horizontal, depois mark */
export function resolveEmailLogoPath(): string {
  if (HAXR_BRAND_ASSETS_AVAILABLE.logoHorizontalGoldEmail) {
    return HAXR_BRAND_ASSETS.emailHorizontalCropped;
  }
  if (HAXR_BRAND_ASSETS_AVAILABLE.logoHorizontalGold) {
    return HAXR_BRAND_ASSETS.emailHorizontal;
  }
  return HAXR_BRAND_ASSETS.emailMark;
}

export function isHorizontalLogoAvailable(): boolean {
  return HAXR_BRAND_ASSETS_AVAILABLE.logoHorizontalGold;
}

export function isVerticalLogoAvailable(): boolean {
  return HAXR_BRAND_ASSETS_AVAILABLE.logoVerticalGold;
}
