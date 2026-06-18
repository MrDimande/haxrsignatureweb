import type { NextConfig } from "next";
import { seoRedirectSources } from "./src/lib/seo/redirects";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
