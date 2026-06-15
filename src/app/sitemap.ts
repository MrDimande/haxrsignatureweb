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

  const extraSections = ["#arquivo", "#testemunhos", "#contacto"].map(
    (hash) => ({
      url: `${siteUrl}/${hash}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sections,
    ...extraSections,
  ];
}
