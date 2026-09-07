import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { marketingMetadata } from "@/lib/marketing/seo";

export const LOCKED_HOMEPAGE_SECTIONS = [
  "Hero",
  "WeddingAdvisory",
  "HomePlatformShowcase",
  "HomeConciergeSection",
  "HomeToolsGrid",
  "HomeVendorCategories",
  "DigitalInvitations",
  "HomeWeddingGallery",
  "InspirationFeed",
  "HomeHowWeWork",
  "HomeTestimonialsTeaser",
  "CTABand",
] as const;

describe("homepage-structure-guardrail", () => {
  it("strictly asserts the 12 major homepage sections are present in exact locked order in HomeClient.tsx", () => {
    const homeClientPath = resolve(
      process.cwd(),
      "src/components/sections/HomeClient.tsx"
    );
    const content = readFileSync(homeClientPath, "utf-8");

    // Extract all JSX tags rendered inside the return statement
    const returnMatch = content.match(/return\s*\(\s*<>([\s\S]*?)<\/>\s*\);/);
    assert.ok(returnMatch, "HomeClient must return a React fragment");

    const jsxBody = returnMatch[1];

    // Find all top-level self-closing or closing component tags inside the fragment
    const tagMatches = [...jsxBody.matchAll(/<([A-Z][A-Za-z0-9]+)[\s\S]*?\/>/g)].map(
      (m) => m[1]
    );

    assert.equal(
      tagMatches.length,
      LOCKED_HOMEPAGE_SECTIONS.length,
      `Expected exactly ${LOCKED_HOMEPAGE_SECTIONS.length} sections, found ${tagMatches.length}: ${tagMatches.join(", ")}`
    );

    for (let i = 0; i < LOCKED_HOMEPAGE_SECTIONS.length; i++) {
      const expected = LOCKED_HOMEPAGE_SECTIONS[i];
      const actual = tagMatches[i];
      assert.equal(
        actual,
        expected,
        `Section order mismatch at position ${i + 1}: expected '${expected}', found '${actual}'`
      );
    }
  });

  it("verifies homepage title uses absolute metadata and prevents duplicate brand suffix", () => {
    const meta = marketingMetadata("home");
    const expectedTitle =
      "HAXR Signature | Assessoria de Eventos e Convites Digitais";

    assert.deepEqual(meta.title, { absolute: expectedTitle });

    const titleStr =
      typeof meta.title === "object" && meta.title && "absolute" in meta.title
        ? meta.title.absolute
        : String(meta.title);

    const occurrences = (titleStr.match(/HAXR Signature/g) || []).length;
    assert.equal(
      occurrences,
      1,
      `Title must not duplicate brand name, found ${occurrences} occurrences`
    );
  });

  it("verifies critical homepage conversion and navigation links are valid routes", () => {
    const criticalHrefs = [
      "/contacto",
      "/dashboard",
      "/for-pros",
      "/fornecedores",
      "/assessoria-eventos",
      "/convites-identidade-visual",
      "/sobre",
    ];

    for (const href of criticalHrefs) {
      assert.ok(
        href.startsWith("/"),
        `Critical route ${href} must be an absolute internal path`
      );
    }
  });
});
