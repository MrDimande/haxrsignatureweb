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
    return seoRedirectSources.map((route) => ({
      source: route.source,
      destination: route.destination,
      permanent: true,
    }));
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
