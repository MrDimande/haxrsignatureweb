import type { MetadataRoute } from "next";
import { siteSeo, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const sections = siteSeo.serviceDetails.map((service) => ({
    url: `${siteUrl}${service.url}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sections,
    {
      url: `${siteUrl}/#contacto`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
