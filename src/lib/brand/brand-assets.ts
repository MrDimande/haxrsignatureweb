/**
 * Caminhos canónicos dos assets de marca HAXR Signature.
 *
 * Preferred canonical names in public/images/brand/:
 * - haxr-horizontal-gold.png
 * - haxr-horizontal-dark.png
 * - haxr-horizontal-white.png
 * - haxr-vertical-gold.png
 * - haxr-vertical-dark.png
 * - haxr-vertical-white.png
 * - haxr-mark-gold.png
 */

export const HAXR_BRAND_ALT = "HAXR Signature" as const;

export const HAXR_BRAND_ASSETS = {
  // Explicit canonical naming
  horizontalGold: "/images/brand/haxr-horizontal-gold.png",
  horizontalDark: "/images/brand/haxr-horizontal-dark.png",
  horizontalWhite: "/images/brand/haxr-horizontal-white.png",
  verticalGold: "/images/brand/haxr-vertical-gold.png",
  verticalDark: "/images/brand/haxr-vertical-dark.png",
  verticalWhite: "/images/brand/haxr-vertical-white.png",
  markGold: "/images/brand/haxr-mark-gold.png",
  markLight: "/images/brand/haxr-mark-light.png",

  // Backward compatibility aliases for existing callers
  logoHorizontalGold: "/images/brand/haxr-horizontal-gold.png",
  logoHorizontalLight: "/images/brand/haxr-horizontal-dark.png",
  logoVerticalGold: "/images/brand/haxr-vertical-gold.png",
  logoDark: "/images/brand/haxr-horizontal-dark.png",

  /** Email — horizontal preferido; mark como fallback */
  emailHorizontal: "/images/brand/haxr-horizontal-gold.png",
  emailHorizontalCropped: "/images/brand/logo-horizontal-gold-email.png",
  emailMark: "/images/brand/haxr-horizontal-gold.png",
} as const;

/** Ficheiros confirmados em public/ */
export const HAXR_BRAND_ASSETS_AVAILABLE = {
  horizontalGold: true,
  horizontalDark: true,
  horizontalWhite: true,
  verticalGold: true,
  verticalDark: true,
  verticalWhite: true,
  markGold: true,
  markLight: false,
  logoHorizontalGold: true,
  logoHorizontalLight: true,
  logoVerticalGold: true,
  logoHorizontalGoldEmail: false,
  logoDark: true,
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
    return HAXR_BRAND_ASSETS.horizontalDark;
  }
  return HAXR_BRAND_ASSETS.horizontalGold;
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
  return HAXR_BRAND_ASSETS.horizontalGold;
}

export function isHorizontalLogoAvailable(): boolean {
  return HAXR_BRAND_ASSETS_AVAILABLE.horizontalGold;
}

export function isVerticalLogoAvailable(): boolean {
  return HAXR_BRAND_ASSETS_AVAILABLE.verticalGold;
}
