/** Caminhos canónicos de assets estáticos — Fase 4 branding */

import { HAXR_BRAND_ASSETS } from "@/lib/brand/brand-assets";

export const brandAssets = {
  markGold: HAXR_BRAND_ASSETS.markGold,
  logoHorizontal: HAXR_BRAND_ASSETS.logoHorizontalGold,
  logoVertical: HAXR_BRAND_ASSETS.logoVerticalGold,
  brainywriteLogo: "/images/brand/brainywrite-logo.png",
  favicon: "/favicon.png",
  faviconPng: "/favicon.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const;

export const portfolioAssets = {
  casamentoSignature: "/images/portfolio/casamento-signature.svg",
  saveTheDate: "/images/portfolio/save-the-date-editorial.svg",
  corporativo: "/images/portfolio/corporativo.svg",
  celebracaoPrivada: "/images/portfolio/celebracao-privada.svg",
  convitePreviewPortrait: "/images/portfolio/convite-preview-portrait.svg",
} as const;

export const magazineAssets = {
  capaAssessor: "/images/magazine/revista-papel-assessor.png",
  capaCasamentosTops: "/images/magazine/revista-casamentos-tops.png",
  capaSegredosPlaneamento: "/images/magazine/revista-segredos-planeamento.png",
  capaBastidoresMontagem: "/images/magazine/revista-bastidores-montagem.png",
} as const;

export const heroAssets = {
  casamentoEditorial: "/images/hero/wedding-editorial-couple.png",
} as const;
