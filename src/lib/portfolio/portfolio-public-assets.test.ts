import assert from "node:assert/strict";
import { test } from "node:test";
import type { PortfolioProject } from "./types";
import { getPortfolioPublicAssetUrl } from "./portfolio-storage";
import { resolvePublicPortfolioAsset } from "./portfolio-public-assets";

const projectSlug = "preview-editorial-autorizado";
const assetId = "b31c0352-1e23-4d2c-985b-d8cc6a45f102.webp";
const assetUrl = getPortfolioPublicAssetUrl(projectSlug, assetId);

function project(overrides: Partial<PortfolioProject> = {}): PortfolioProject {
  return {
    id: "synthetic-project",
    slug: projectSlug,
    title: "Projecto sintético autorizado",
    subtitle: "",
    category: "identidade-cerimonial",
    categoryLabel: "Identidade Cerimonial",
    location: "Maputo",
    year: "2026",
    isReal: false,
    projectType: "demonstracao",
    status: "published",
    editorialReviewStatus: "approved",
    publicationAuthorized: true,
    clientConsentStatus: "AUTHORIZED",
    coverImage: assetUrl,
    services: [],
    summary: "",
    narrative: { vision: "", challenge: "", signature: "", result: "" },
    gallery: [],
    details: [],
    publishedAt: "2026-10-27",
    seo: { title: "", description: "" },
    ...overrides,
  };
}

test("entrega apenas um activo público registado num projecto editorialmente elegível", () => {
  assert.deepEqual(resolvePublicPortfolioAsset(project(), projectSlug, assetId), {
    objectKey: `portfolio/public/${projectSlug}/${assetId}`,
  });
});

test("bloqueia fotografia sob revisão, outro projecto e despublicação", () => {
  assert.equal(resolvePublicPortfolioAsset(project(), projectSlug, "storage-review.webp"), null);
  assert.equal(resolvePublicPortfolioAsset(project(), "outro-projecto", assetId), null);
  assert.equal(resolvePublicPortfolioAsset(project({ status: "draft" }), projectSlug, assetId), null);
  assert.equal(
    resolvePublicPortfolioAsset(project({ clientConsentStatus: "CONFIRMATION_PENDING" }), projectSlug, assetId),
    null
  );
});
