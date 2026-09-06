import type { NextConfig } from "next";
import { seoRedirectSources } from "./src/lib/seo/redirects";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const isMigrationPreviewBuild =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  env: {
    // Public build markers only; no secret values are exposed here.
    NEXT_PUBLIC_HAXR_GIT_COMMIT_REF:
      process.env.VERCEL_GIT_COMMIT_REF?.trim() ?? "",
    NEXT_PUBLIC_HAXR_AUTH_PROVIDER: isMigrationPreviewBuild
      ? "neon"
      : process.env.NEXT_PUBLIC_HAXR_AUTH_PROVIDER?.trim() ?? "",
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
