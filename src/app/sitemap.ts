import type { MetadataRoute } from "next";
import { marketingPagesSeo } from "@/lib/marketing/seo";
import { siteUrl } from "@/lib/seo";

const marketingRoutes = Object.values(marketingPagesSeo).filter(
  (page) => page.path !== "/"
);

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...marketingRoutes.map((page) => ({
      url: `${siteUrl}${page.path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: page.path === "/contacto" ? 0.9 : 0.8,
    })),
  ];
}
