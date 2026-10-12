import type { NextConfig } from "next";
import { seoRedirectSources } from "./src/lib/seo/redirects";

export const CANONICAL_EDITION_PRODUCTION_URL = "https://edition.haxrsignature.com";
export const AUTHORIZED_EDITION_PREVIEW_URL =
  "https://projecto-haxrsignature-edition-idrrp46to.vercel.app";

/**
 * Resolve o domínio base de destino dos convites da Edition por ambiente.
 *
 * Regras estritas:
 * 1. Em Vercel Preview (VERCEL_ENV=preview):
 *    - Requer obrigatoriamente HAXR_EDITION_URL ou NEXT_PUBLIC_EDITION_SITE_URL configurada.
 *    - Falha ruidosamente (fail-closed) se a variável estiver ausente, impedindo qualquer recurso
 *      silencioso ao domínio de Produção.
 *    - Proíbe explicitamente que o destino aponte para o domínio de Produção.
 * 2. Em Produção (ou ambiente padrão/local):
 *    - Utiliza o domínio canónico oficial https://edition.haxrsignature.com (ou override explícito).
 */
export function resolveEditionBaseUrl(options?: {
  vercelEnv?: string;
  editionUrl?: string;
  publicEditionUrl?: string;
}): string {
  const vercelEnv = (options?.vercelEnv ?? process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  const isPreview = vercelEnv === "preview";

  const configuredUrl = (
    options?.editionUrl ??
    process.env.HAXR_EDITION_URL ??
    options?.publicEditionUrl ??
    process.env.NEXT_PUBLIC_EDITION_SITE_URL ??
    ""
  ).trim().replace(/\/$/, "");

  if (isPreview) {
    if (!configuredUrl) {
      throw new Error(
        "[edition-redirects] Vercel Preview build error: HAXR_EDITION_URL (ou NEXT_PUBLIC_EDITION_SITE_URL) não está definida no ambiente Preview. É estritamente proibido recorrer silenciosamente ao domínio de Produção."
      );
    }
    if (configuredUrl.toLowerCase().includes("edition.haxrsignature.com")) {
      throw new Error(
        "[edition-redirects] Vercel Preview build error: HAXR_EDITION_URL no ambiente Preview não pode apontar para o domínio de Produção (edition.haxrsignature.com)."
      );
    }
    return configuredUrl;
  }

  return configuredUrl || CANONICAL_EDITION_PRODUCTION_URL;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  env: {
    // Public build marker only; no identity-provider configuration is exposed.
    NEXT_PUBLIC_HAXR_GIT_COMMIT_REF:
      process.env.VERCEL_GIT_COMMIT_REF?.trim() ?? "",
  },
  async redirects() {
    const seoRedirects = seoRedirectSources.map((route) => ({
      source: route.source,
      destination: route.destination,
      permanent: true,
    }));

    const editionBaseUrl = resolveEditionBaseUrl();

    const editionInviteRedirects = [
      {
        source: "/neidyejosewedding",
        destination: `${editionBaseUrl}/neidyejosewedding`,
        permanent: false,
      },
      {
        source: "/neidyejose",
        destination: `${editionBaseUrl}/neidyejosewedding`,
        permanent: false,
      },
      {
        source: "/neidy-jose",
        destination: `${editionBaseUrl}/neidyejosewedding`,
        permanent: false,
      },
      {
        source: "/neidy-e-jose",
        destination: `${editionBaseUrl}/neidyejosewedding`,
        permanent: false,
      },
    ];

    return [...seoRedirects, ...editionInviteRedirects];
  },
  experimental: {
    optimizePackageImports: [
      "gsap",
      "lucide-react",
      "framer-motion",
      "@tsparticles/react",
      "@tsparticles/slim",
    ],
  },
};

export default nextConfig;
