import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchCatalog, SITE_SEARCH_INDEX } from "./search-index";

describe("search-index", () => {
  it("returns empty array for empty or whitespace query", () => {
    assert.deepEqual(searchCatalog(""), []);
    assert.deepEqual(searchCatalog("   "), []);
  });

  it("finds assessoria de eventos by direct title and keyword", () => {
    const results = searchCatalog("assessoria");
    assert.ok(results.length > 0);
    assert.equal(results[0].id, "assessoria");
  });

  it("finds convites by normalized accent-insensitive search", () => {
    const results = searchCatalog("orcamento");
    assert.ok(results.length > 0);
    const hasBudget = results.some((r) => r.id === "budget-tracker-tool");
    assert.ok(hasBudget, "Should find budget tracker with unaccented search");
  });

  it("finds photographers in vendor category", () => {
    const results = searchCatalog("fotografo");
    assert.ok(results.length > 0);
    const hasPhoto = results.some((r) => r.id === "fornecedores-fotografia");
    assert.ok(hasPhoto, "Should find photography category");
  });

  it("all items in SITE_SEARCH_INDEX have required fields", () => {
    for (const item of SITE_SEARCH_INDEX) {
      assert.ok(item.id.length > 0);
      assert.ok(item.title.length > 0);
      assert.ok(item.href.startsWith("/"));
      assert.ok(item.description.length > 0);
      assert.ok(item.keywords.length > 0);
    }
  });
});
