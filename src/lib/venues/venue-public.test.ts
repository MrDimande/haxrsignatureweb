/**
 * HAXR Signature — Phase E.2 Public Venue Guide Tests
 *
 * Testes automatizados rigorosos da experiência pública /locais-para-casamentos:
 * - Governação de publicação por ambiente (0 em produção, 4 em preview)
 * - Bloqueio absoluto de RESEARCH_ONLY e IDENTITY=A_CONFIRMAR
 * - Zero badges indevidos (HAXR Verified, Visitado, Parceiro)
 * - Zero termos não suportados de homologação
 * - Zero fotografias externas não autorizadas (uso estrito de placeholder editorial)
 * - Metadados de SEO, indexação bloqueada em preview (noindex)
 * - Ausência de fuga para sitemap, navegação ou homepage
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  HAXR_INTERNAL_VENUES,
  getPublicVenues,
  isVenueEligibleForEnvironment,
  mapVenueToPublicCard,
} from "./index";
import { navGroups, navDirectLinks } from "@/lib/marketing/navigation";
import { metadata } from "@/app/(marketing)/locais-para-casamentos/page";

describe("HAXR Venue Guide — Phase E.2 Public Experience & Governance", () => {
  const previewVenues = getPublicVenues("preview");
  const productionVenues = getPublicVenues("production");
  const previewCards = previewVenues.map(mapVenueToPublicCard);

  describe("Environment Publication Gates", () => {
    it("enforces that exactly 0 venues are renderable in production during Phase E.2", () => {
      assert.equal(
        productionVenues.length,
        0,
        `VIOLAÇÃO DE GOVERNAÇÃO E.2: ${productionVenues.length} locais renderizáveis em produção`
      );
    });

    it("enforces that exactly 4 review candidate venues are renderable in preview", () => {
      assert.equal(
        previewVenues.length,
        4,
        `Esperados 4 locais aprovados para preview, obtidos ${previewVenues.length}`
      );

      const expectedIds = [
        "POLANA_SERENA_HOTEL",
        "SOUTHERN_SUN_MAPUTO",
        "HOTEL_GLORIA_CCJC",
        "RADISSON_BLU_MAPUTO",
      ];
      const actualIds = previewVenues.map((v) => v.id);
      assert.deepEqual(actualIds.sort(), expectedIds.sort());
    });

    it("strictly forbids RESEARCH_ONLY venues from rendering in any environment", () => {
      const researchOnly = HAXR_INTERNAL_VENUES.filter(
        (v) => v.readiness.primary === "RESEARCH_ONLY"
      );
      assert.equal(researchOnly.length, 4);

      for (const venue of researchOnly) {
        assert.equal(
          isVenueEligibleForEnvironment(venue, "preview"),
          false,
          `Local RESEARCH_ONLY (${venue.id}) não pode renderizar em preview`
        );
        assert.equal(
          isVenueEligibleForEnvironment(venue, "production"),
          false,
          `Local RESEARCH_ONLY (${venue.id}) não pode renderizar em produção`
        );
      }
    });

    it("strictly forbids IDENTITY=A_CONFIRMAR venues from rendering in any environment", () => {
      const unverifiedIdentity = HAXR_INTERNAL_VENUES.filter(
        (v) => v.trust.identity === "A_CONFIRMAR"
      );
      assert.equal(unverifiedIdentity.length, 4);

      for (const venue of unverifiedIdentity) {
        assert.equal(
          isVenueEligibleForEnvironment(venue, "preview"),
          false,
          `Local com IDENTITY=A_CONFIRMAR (${venue.id}) não pode renderizar em preview`
        );
        assert.equal(
          isVenueEligibleForEnvironment(venue, "production"),
          false,
          `Local com IDENTITY=A_CONFIRMAR (${venue.id}) não pode renderizar em produção`
        );
      }
    });
  });

  describe("Trust Language & Badge Prohibitions", () => {
    it("ensures zero HAXR Verified badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.equal(
          venue.trust.haxrVerified,
          false,
          `Local ${venue.id} não pode ter HAXR_VERIFIED=true`
        );
      }
    });

    it("ensures zero Visited by HAXR badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.notEqual(
          venue.trust.visitedByHaxr,
          true,
          `Local ${venue.id} não pode ter VISITED_BY_HAXR=true`
        );
      }
    });

    it("ensures zero HAXR Partner badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.equal(
          venue.trust.haxrPartner,
          false,
          `Local ${venue.id} não pode ter HAXR_PARTNER=true`
        );
      }
    });

    it("ensures no unsupported homologation terminology exists in public cards", () => {
      for (const card of previewCards) {
        const serialized = JSON.stringify(card).toLowerCase();
        assert.equal(
          serialized.includes("homologad"),
          false,
          `Cartão público de ${card.id} contém terminologia não suportada de homologação`
        );
      }
    });

    it("ensures image rights are strictly respected with zero misrepresentative images", () => {
      for (const card of previewCards) {
        assert.equal(
          card.hasDedicatedImage,
          false,
          `Local ${card.id} não pode ter imagem própria sem cessão expressa de direitos`
        );
        assert.equal(
          card.imageUrl,
          undefined,
          `Local ${card.id} não pode referenciar imageUrl sem direitos confirmados`
        );
      }
    });
  });

  describe("SEO & Indexing Guardrails", () => {
    it("enforces noindex and nofollow during preview review phase", () => {
      assert.deepEqual(metadata.robots, {
        index: false,
        follow: false,
      });
    });

    it("enforces canonical SEO title and factual description", () => {
      assert.equal(
        metadata.title,
        "Locais para Casamentos em Maputo e Matola"
      );
      assert.equal(
        metadata.description,
        "Guia editorial e prático de espaços para casamentos e celebrações em Maputo e Matola, com informação sobre capacidade, ambientes e critérios de escolha."
      );
    });

    it("confirms zero venue-level JSON-LD schemas in E.2", () => {
      const pageFile = fs.readFileSync(
        path.resolve(
          process.cwd(),
          "src/app/(marketing)/locais-para-casamentos/page.tsx"
        ),
        "utf8"
      );
      assert.equal(
        pageFile.includes('"@type": "EventVenue"'),
        false,
        "Zero schema EventVenue permitido na Fase E.2"
      );
      assert.equal(
        pageFile.includes('"@type": "LocalBusiness"'),
        false,
        "Zero schema LocalBusiness permitido na Fase E.2"
      );
    });
  });

  describe("Surface Boundaries — No Navigation, Sitemap or Homepage Leakage", () => {
    it("ensures navigation menu does NOT link to /locais-para-casamentos in E.2 Preview", () => {
      for (const group of navGroups) {
        for (const link of group.links) {
          assert.notEqual(
            link.href,
            "/locais-para-casamentos",
            `Navegação contém link para locais-para-casamentos: ${link.label}`
          );
        }
      }
      for (const link of navDirectLinks) {
        assert.notEqual(
          link.href,
          "/locais-para-casamentos",
          `Link directo de navegação aponta para locais-para-casamentos: ${link.label}`
        );
      }
    });

    it("ensures public sitemap does NOT include /locais-para-casamentos", async () => {
      const sitemapModule = await import("@/app/sitemap");
      const sitemapEntries = sitemapModule.default();
      const hasVenueEntry = sitemapEntries.some((entry) =>
        entry.url.includes("locais-para-casamentos")
      );
      assert.equal(
        hasVenueEntry,
        false,
        "O sitemap público NÃO pode conter URLs de locais-para-casamentos na Fase E.2"
      );
    });

    it("ensures no venue detail routes were created in src/app", () => {
      const venuesDetailRoute = path.resolve(
        process.cwd(),
        "src/app/(marketing)/locais-para-casamentos/[slug]"
      );
      assert.equal(
        fs.existsSync(venuesDetailRoute),
        false,
        "Páginas de detalhe de local pertencem à Fase E.3, não à E.2"
      );
    });
  });

  describe("Filter Dimensions Operating on Stable Curated Data", () => {
    it("correctly filters by city based on verified location data", () => {
      const maputoCards = previewCards.filter((c) => c.city === "Maputo");
      assert.equal(maputoCards.length, 4);

      const matolaCards = previewCards.filter((c) => c.city === "Matola");
      assert.equal(matolaCards.length, 0);
    });

    it("correctly filters by environment based on verified room configurations", () => {
      const interiorCards = previewCards.filter((c) =>
        c.environments.includes("Interior")
      );
      assert.equal(interiorCards.length, 4);

      const exteriorCards = previewCards.filter((c) =>
        c.environments.includes("Exterior")
      );
      assert.equal(exteriorCards.length, 3);
    });

    it("correctly filters by celebration type based on venue capability", () => {
      const weddingCards = previewCards.filter((c) =>
        c.celebrationsSupported.includes("Casamentos")
      );
      assert.equal(weddingCards.length, 4);
    });
  });

  describe("Amendment 10 — Comprehensive Governance Invariants", () => {
    it("enforces UNSUPPORTED_HOMOLOGATION_TERMINOLOGY=0 in public card surface", () => {
      const allCards = previewCards;
      for (const card of allCards) {
        const serialized = JSON.stringify(card).toLowerCase();
        assert.equal(
          serialized.includes("homologad"),
          false,
          `Cartão ${card.id}: terminologia não suportada de homologação detectada`
        );
        assert.equal(
          serialized.includes("homologar"),
          false,
          `Cartão ${card.id}: verbo 'homologar' não suportado detectado`
        );
      }
    });

    it("enforces UNSUPPORTED_HOMOLOGATION_TERMINOLOGY=0 in venue notes exposed to editorialSummary", () => {
      for (const card of previewCards) {
        const summary = (card.editorialSummary || "").toLowerCase();
        assert.equal(
          summary.includes("homolog"),
          false,
          `Cartão ${card.id}: editorialSummary contém 'homolog*'`
        );
      }
    });

    it("enforces VENUE_LEVEL_SCHEMA_COUNT=0 — no individual venue JSON-LD schemas", () => {
      const pageFile = fs.readFileSync(
        path.resolve(
          process.cwd(),
          "src/app/(marketing)/locais-para-casamentos/page.tsx"
        ),
        "utf8"
      );
      assert.equal(
        pageFile.includes('"@type": "EventVenue"'),
        false,
        "Zero schema EventVenue permitido na Fase E.2"
      );
      assert.equal(
        pageFile.includes('"@type": "LocalBusiness"'),
        false,
        "Zero schema LocalBusiness permitido na Fase E.2"
      );
      assert.equal(
        pageFile.includes('"@type": "Place"'),
        false,
        "Zero schema Place de nível individual permitido na Fase E.2"
      );
    });

    it("enforces HOMEPAGE_CHANGED=false — no venue references in homepage page.tsx", () => {
      const homepagePath = path.resolve(
        process.cwd(),
        "src/app/(marketing)/page.tsx"
      );
      const homepage = fs.readFileSync(homepagePath, "utf8");
      assert.equal(
        homepage.includes("locais-para-casamentos"),
        false,
        "Homepage NÃO pode referenciar locais-para-casamentos"
      );
      assert.equal(
        homepage.includes("VenueGuide"),
        false,
        "Homepage NÃO pode importar componentes do Venue Guide"
      );
    });

    it("enforces no internal governance terms leaked into public cards", () => {
      const forbiddenTerms = [
        "A_CONFIRMAR",
        "OWNER_CONFIRMED",
        "EVIDENCE_REQUIRED",
        "APPROVED_FOR_PREVIEW",
        "POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW",
        "RESEARCH_ONLY",
        "NEEDS_EXTERNAL_VERIFICATION",
        "NEEDS_OWNER_CONFIRMATION",
        "FOUNDATION_READY",
      ];

      for (const card of previewCards) {
        const serialized = JSON.stringify(card);
        for (const term of forbiddenTerms) {
          assert.equal(
            serialized.includes(term),
            false,
            `Cartão ${card.id}: termo interno '${term}' exposto na interface pública`
          );
        }
      }
    });

    it("enforces MAP_IMPLEMENTED=false — no map component exists", () => {
      const mapComponent = path.resolve(
        process.cwd(),
        "src/components/venues/VenueMap.tsx"
      );
      assert.equal(
        fs.existsSync(mapComponent),
        false,
        "Componente de mapa NÃO pode existir na Fase E.2 (MAP_DECISION=DEFERRED)"
      );
    });

    it("enforces no venue detail routes ([slug]) in Phase E.2", () => {
      const slugRoute = path.resolve(
        process.cwd(),
        "src/app/(marketing)/locais-para-casamentos/[slug]"
      );
      assert.equal(
        fs.existsSync(slugRoute),
        false,
        "Páginas de detalhe de local pertencem à Fase E.3, não à E.2"
      );
    });
  });
});

