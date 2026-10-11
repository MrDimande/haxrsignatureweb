import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nextConfig from "../../../next.config";

describe("Invitation Redirects in next.config.ts", () => {
  it("defines redirects for Neidy & José canonical URL and aliases", async () => {
    assert.ok(typeof nextConfig.redirects === "function", "nextConfig.redirects must be a function");
    const redirects = await nextConfig.redirects();

    const canonicalRedirect = redirects.find((r) => r.source === "/neidyejosewedding");
    assert.ok(canonicalRedirect, "Redirect for /neidyejosewedding must exist");
    assert.equal(canonicalRedirect.destination, "https://edition.haxrsignature.com/neidyejosewedding");
    assert.equal(canonicalRedirect.permanent, false);

    const aliases = ["/neidyejose", "/neidy-jose", "/neidy-e-jose"];
    for (const alias of aliases) {
      const aliasRedirect = redirects.find((r) => r.source === alias);
      assert.ok(aliasRedirect, `Redirect for alias '${alias}' must exist`);
      assert.equal(aliasRedirect.destination, "https://edition.haxrsignature.com/neidyejosewedding");
      assert.equal(aliasRedirect.permanent, false);
    }
  });

  it("ensures no circular redirects exist", async () => {
    const redirects = await nextConfig.redirects();
    for (const r of redirects) {
      assert.notEqual(r.source, r.destination, `Circular redirect detected: ${r.source}`);
      assert.notEqual(r.source + "/", r.destination, `Circular redirect detected: ${r.source}`);
    }
  });

  it("ensures Neidy & José aliases do not redirect to other events", async () => {
    const redirects = await nextConfig.redirects();
    const neidyRedirects = redirects.filter((r) =>
      r.source.includes("neidy") || r.source.includes("jose")
    );
    for (const r of neidyRedirects) {
      assert.equal(
        r.destination,
        "https://edition.haxrsignature.com/neidyejosewedding",
        `Neidy route ${r.source} pointed to unexpected destination: ${r.destination}`
      );
    }
  });
});
