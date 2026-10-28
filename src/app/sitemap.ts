import type { MetadataRoute } from "next";
import { brandAssets } from "@/lib/assets";
import {
  buildDemoSitemapEntries,
  buildMarketingSitemapEntries,
} from "@/lib/seo/sitemap-config";
import { insightArticles } from "@/lib/marketing/insights-articles";
import { getPublishedPortfolioProjects } from "@/lib/portfolio/catalog";
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

  const insightPages = insightArticles.map((article) => ({
    url: `${siteUrl}/insights/${article.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.68,
  }));

  // Projectos publicados do The Signature Collection (apenas públicos, aprovados e autorizados)
  const portfolioPages: MetadataRoute.Sitemap = getPublishedPortfolioProjects()
    .filter(
      (p) =>
        p.status === "published" &&
        p.publicationAuthorized === true &&
        p.editorialReviewStatus === "approved" &&
        p.clientConsentStatus === "AUTHORIZED"
    )
    .map((project) => ({
      url: `${siteUrl}/portfolio/${project.slug}`,
      lastModified: project.publishedAt ? new Date(project.publishedAt) : lastModified,
      changeFrequency: "monthly" as const,
      priority: project.isFeatured ? 0.85 : 0.75,
      images: project.coverImage
        ? [project.coverImage.startsWith("http") ? project.coverImage : `${siteUrl}${project.coverImage}`]
        : undefined,
    }));

  return [...marketing, ...demos, ...insightPages, ...portfolioPages];
}
