import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { marketingMetadata } from "@/lib/marketing/seo";
import { buildHomeStructuredData } from "@/lib/seo/jsonld";

describe("homepage-seo-foundation", () => {
  it("builds absolute homepage title without duplicate brand suffix", () => {
    const meta = marketingMetadata("home");

    // Must be absolute object to bypass %s | HAXR Signature template
    assert.deepEqual(meta.title, {
      absolute: "HAXR Signature | Assessoria de Eventos e Convites Digitais",
    });

    assert.equal(
      meta.description,
      "Assessoria de eventos, Web-Convites interactivos, gestão de convidados e soluções digitais para celebrações e experiências memoráveis. Conheça a HAXR Signature."
    );

    // Verify title string does not contain duplicate brand suffix
    const titleStr =
      typeof meta.title === "object" && meta.title && "absolute" in meta.title
        ? meta.title.absolute
        : String(meta.title);

    const matches = titleStr.match(/HAXR Signature/g);
    assert.equal(
      matches?.length,
      1,
      `Title should contain 'HAXR Signature' exactly once, found: ${matches?.length}`
    );
  });

  it("sets correct canonical and language alternates for homepage", () => {
    const meta = marketingMetadata("home");
    assert.equal(meta.alternates?.canonical, "/");
    assert.deepEqual(meta.alternates?.languages, { "pt-MZ": "/" });
  });

  it("produces syntactically valid JSON-LD structured data without unverified address/coordinates", () => {
    const schemas = buildHomeStructuredData();
    assert.ok(Array.isArray(schemas));
    assert.ok(schemas.length >= 4);

    const org = schemas.find(
      (s) =>
        Array.isArray(s["@type"]) &&
        (s["@type"] as string[]).includes("Organization")
    );
    assert.ok(org, "Organization schema should be present");
    assert.equal(org.name, "HAXR Signature");

    // Address verification: Locality only, no unverified street address or coordinates
    const address = org.address as Record<string, unknown>;
    assert.ok(address, "Address object should be present");
    assert.equal(address.addressLocality, "Maputo");
    assert.equal(address.addressCountry, "MZ");
    assert.equal(
      address.streetAddress,
      undefined,
      "Unverified street address must be omitted"
    );
    assert.equal(
      org.geo,
      undefined,
      "Unverified geo coordinates must be omitted"
    );
    assert.equal(
      org.openingHours,
      undefined,
      "Unverified opening hours must be omitted"
    );

    // Serialization check
    const serialized = JSON.stringify(schemas);
    assert.ok(serialized.length > 500);
    assert.doesNotThrow(() => JSON.parse(serialized));
  });

  it("ensures subpages continue to receive relative titles for template expansion", () => {
    const assessoriaMeta = marketingMetadata("assessoria");
    assert.equal(typeof assessoriaMeta.title, "string");
    assert.ok(
      !String(assessoriaMeta.title).includes("| HAXR Signature"),
      "Subpage title should not pre-append brand suffix"
    );
  });
});
