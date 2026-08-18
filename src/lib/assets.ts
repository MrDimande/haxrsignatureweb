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
  // Mosaico editorial real HAXR Signature
  casamentoSignature: "/images/portfolio/mosaic-casal-painel-branco.webp",
  salaoBranco: "/images/portfolio/mosaic-salao-branco-preparado.webp",
  conviteJessicaSamuel: "/images/portfolio/mosaic-convite-jessica-samuel-dark.webp",
  mesaDourada: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
  euEspioQr: "/images/portfolio/mosaic-eu-espio-qr.webp",

  // Aliases canónicos para retrocompatibilidade
  saveTheDate: "/images/portfolio/mosaic-convite-jessica-samuel-dark.webp",
  corporativo: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
  celebracaoPrivada: "/images/portfolio/mosaic-salao-branco-preparado.webp",
  convitePreviewPortrait: "/images/portfolio/mosaic-eu-espio-qr.webp",
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
