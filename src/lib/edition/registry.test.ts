import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEditionSlug, getEditionEventBinding } from "./registry";

describe("Core Event Registry Alignment", () => {
  it("resolves jessica-samuel to jessica-samuel-wedding binding", () => {
    const slug = resolveEditionSlug("jessica-samuel");
    assert.equal(slug, "jessica-samuel-wedding");

    // Test case-insensitivity and trim
    assert.equal(resolveEditionSlug("  Jessica-Samuel  "), "jessica-samuel-wedding");
  });

  it("resolves traditional-wedding to its own traditional wedding binding", () => {
    const slug = resolveEditionSlug("traditional-wedding");
    assert.equal(slug, "traditional-wedding");
  });

  it("resolves public Edition invite slug to traditional-wedding binding", () => {
    assert.equal(
      resolveEditionSlug("jessicaesamueltraditionalwedding"),
      "traditional-wedding"
    );
  });

  it("does not resolve traditional-wedding to rose-elegance or farewell", () => {
    assert.notEqual(resolveEditionSlug("traditional-wedding"), "rose-elegance");
    assert.notEqual(
      resolveEditionSlug("traditional-wedding"),
      "jessicachadelingerie"
    );
  });

  it("resolves jessicachadelingerie to the farewell binding", () => {
    const slug = resolveEditionSlug("jessicachadelingerie");
    assert.equal(slug, "jessicachadelingerie");
  });

  it("resolves despedida-de-solteira and jessica-farewell to jessicachadelingerie", () => {
    assert.equal(resolveEditionSlug("despedida-de-solteira"), "jessicachadelingerie");
    assert.equal(resolveEditionSlug("jessica-farewell"), "jessicachadelingerie");
  });

  it("resolves jessicasamuelwedding to jessica-samuel-wedding", () => {
    assert.equal(resolveEditionSlug("jessicasamuelwedding"), "jessica-samuel-wedding");
  });

  it("resolves lingerie aliases correctly", () => {
    assert.equal(resolveEditionSlug("cha-de-lingerie"), "cha-de-lingerie");
    assert.equal(resolveEditionSlug("chadelingerie"), "cha-de-lingerie");
    assert.equal(resolveEditionSlug("jessica-cha-de-lingerie"), "cha-de-lingerie");
  });

  it("resolves panela aliases correctly", () => {
    assert.equal(resolveEditionSlug("cha-de-panela"), "cha-de-panela");
    assert.equal(resolveEditionSlug("chadepanela"), "cha-de-panela");
    assert.equal(resolveEditionSlug("jessicabridetobe"), "cha-de-panela");
    assert.equal(resolveEditionSlug("jessica-bride-to-be"), "cha-de-panela");
  });

  it("resolves kulaya aliases correctly", () => {
    assert.equal(resolveEditionSlug("jessicakulaya"), "jessicakulaya");
    assert.equal(resolveEditionSlug("jessicakhulaya"), "jessicakulaya");
  });

  it("resolves stanturns5 and Stan aliases", () => {
    assert.equal(resolveEditionSlug("stanturns5"), "stanturns5");
    assert.equal(resolveEditionSlug("stan"), "stanturns5");
    assert.equal(resolveEditionSlug("convite-stan"), "stanturns5");
    assert.equal(resolveEditionSlug("stan-5-anos"), "stanturns5");
  });

  it("resolves nian and nianwebnight to nianwebnight binding", () => {
    assert.equal(resolveEditionSlug("nian"), "nianwebnight");
    assert.equal(resolveEditionSlug("nianwebnight"), "nianwebnight");
  });

  it("binds nianwebnight exclusively to EDITION_EVENT_NIAN_ID", () => {
    process.env.EDITION_EVENT_NIAN_ID = "test-nian-event";
    process.env.EDITION_EVENT_STAN_ID = "test-stan-event";

    try {
      const byAlias = getEditionEventBinding("nian");
      const byCanonical = getEditionEventBinding("nianwebnight");

      assert.ok(byAlias, "Binding for alias 'nian' should exist.");
      assert.ok(byCanonical, "Binding for 'nianwebnight' should exist.");
      assert.equal(byAlias.slug, "nianwebnight");
      assert.equal(byCanonical.slug, "nianwebnight");
      assert.equal(byAlias.envVar, "EDITION_EVENT_NIAN_ID");
      assert.equal(byCanonical.envVar, "EDITION_EVENT_NIAN_ID");
      assert.equal(byAlias.eventId, "test-nian-event");
      assert.equal(byCanonical.eventId, "test-nian-event");
      assert.notEqual(byAlias.envVar, "EDITION_EVENT_STAN_ID");
      assert.notEqual(byAlias.eventId, "test-stan-event");
    } finally {
      delete process.env.EDITION_EVENT_NIAN_ID;
      delete process.env.EDITION_EVENT_STAN_ID;
    }
  });

  it("every active canonical slug maps to its intended environment variable binding", () => {
    const expectedVars: Record<string, string> = {
      "jessica-samuel-wedding": "EDITION_EVENT_JESSICA_WEDDING_ID",
      "jessicakulaya": "EDITION_EVENT_JESSICA_KULAYA_ID",
      "cha-de-lingerie": "EDITION_EVENT_JESSICA_LINGERIE_ID",
      "cha-de-panela": "EDITION_EVENT_JESSICA_PANELA_ID",
      "jessicachadelingerie": "EDITION_EVENT_JESSICA_FAREWELL_ID",
      stanturns5: "EDITION_EVENT_STAN_ID",
      nianwebnight: "EDITION_EVENT_NIAN_ID",
    };

    for (const [slug, envVar] of Object.entries(expectedVars)) {
      process.env[envVar] = "test-uuid-value";
      const binding = getEditionEventBinding(slug);
      assert.ok(binding, `Binding for '${slug}' should exist.`);
      assert.equal(binding.envVar, envVar);
      assert.equal(binding.eventId, "test-uuid-value");
      delete process.env[envVar];
    }
  });

  it("cha-de-panela maps only to EDITION_EVENT_JESSICA_PANELA_ID", () => {
    process.env.EDITION_EVENT_JESSICA_PANELA_ID = "test-panela-event";
    process.env.EDITION_EVENT_JESSICA_LINGERIE_ID = "test-lingerie-event";

    try {
      const panela = getEditionEventBinding("cha-de-panela");
      const panelaAlias = getEditionEventBinding("jessicabridetobe");

      assert.ok(panela);
      assert.ok(panelaAlias);
      assert.equal(panela.slug, "cha-de-panela");
      assert.equal(panelaAlias.slug, "cha-de-panela");
      assert.equal(panela.envVar, "EDITION_EVENT_JESSICA_PANELA_ID");
      assert.equal(panelaAlias.envVar, "EDITION_EVENT_JESSICA_PANELA_ID");
      assert.notEqual(panela.envVar, "EDITION_EVENT_JESSICA_LINGERIE_ID");
    } finally {
      delete process.env.EDITION_EVENT_JESSICA_PANELA_ID;
      delete process.env.EDITION_EVENT_JESSICA_LINGERIE_ID;
    }
  });

  it("ensures no legacy alias resolves to wedding or traditional wedding incorrectly", () => {
    const traditionalRedirects = ["jessica-samuel-traditional", "jessica-traditional-wedding"];
    for (const redirect of traditionalRedirects) {
      assert.equal(resolveEditionSlug(redirect), "traditional-wedding");
    }

    const farewellRedirects = ["despedida-de-solteira", "jessica-farewell"];
    for (const redirect of farewellRedirects) {
      assert.equal(resolveEditionSlug(redirect), "jessicachadelingerie");
    }
  });

  it("returns null for unknown slugs safely with no default fallback", () => {
    assert.equal(resolveEditionSlug("unknown-slug-here"), null);
    assert.equal(resolveEditionSlug(""), null);
    assert.equal(resolveEditionSlug(undefined), null);

    assert.equal(getEditionEventBinding("unknown-slug-here"), null);
    assert.equal(getEditionEventBinding(""), null);
    assert.equal(getEditionEventBinding(undefined), null);
  });

  it("ensures different event canonical slugs cannot resolve to one another", () => {
    const canonicals = [
      "jessica-samuel",
      "jessicakulaya",
      "cha-de-lingerie",
      "cha-de-panela",
      "jessicachadelingerie",
    ];

    for (let i = 0; i < canonicals.length; i++) {
      for (let j = 0; j < canonicals.length; j++) {
        if (i !== j) {
          const resolved = resolveEditionSlug(canonicals[i]);
          assert.notEqual(resolved, canonicals[j]);
        }
      }
    }
  });
});
