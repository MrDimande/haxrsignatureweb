import type { MetadataRoute } from "next";
import { brandAssets } from "@/lib/assets";
import {
  buildDemoSitemapEntries,
  buildMarketingSitemapEntries,
} from "@/lib/seo/sitemap-config";
import { siteUrl } from "@/lib/seo";

/** Data base do sitemap — actualizar quando houver alteração editorial relevante. */
const SITE_CONTENT_REVISION = "2026-06-13";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITE_CONTENT_REVISION);
  const brandImage = `${siteUrl}${brandAssets.logoHorizontal}`;

  const marketing = buildMarketingSitemapEntries().map((entry) => ({
    url: entry.path === "/" ? siteUrl : `${siteUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    ...(entry.tier === "home" || entry.tier === "service"
      ? { images: [brandImage] }
      : {}),
  }));

  const demos = buildDemoSitemapEntries().map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  return [...marketing, ...demos];
}
