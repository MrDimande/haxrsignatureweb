import type { NextConfig } from "next";
import { seoRedirectSources } from "./src/lib/seo/redirects";

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

    const editionInviteRedirects = [
      {
        source: "/neidyejosewedding",
        destination: "https://edition.haxrsignature.com/neidyejosewedding",
        permanent: false,
      },
      {
        source: "/neidyejose",
        destination: "https://edition.haxrsignature.com/neidyejosewedding",
        permanent: false,
      },
      {
        source: "/neidy-jose",
        destination: "https://edition.haxrsignature.com/neidyejosewedding",
        permanent: false,
      },
      {
        source: "/neidy-e-jose",
        destination: "https://edition.haxrsignature.com/neidyejosewedding",
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
