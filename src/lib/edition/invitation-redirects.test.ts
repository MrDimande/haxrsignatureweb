import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nextConfig, {
  resolveEditionBaseUrl,
  CANONICAL_EDITION_PRODUCTION_URL,
  AUTHORIZED_EDITION_PREVIEW_URL,
} from "../../../next.config";

describe("Invitation Redirects in next.config.ts", () => {
  it("defines redirects for Neidy & José canonical URL and aliases in Production/Default", async () => {
    assert.ok(typeof nextConfig.redirects === "function", "nextConfig.redirects must be a function");
    const redirects = await nextConfig.redirects();

    const canonicalRedirect = redirects.find((r) => r.source === "/neidyejosewedding");
    assert.ok(canonicalRedirect, "Redirect for /neidyejosewedding must exist");
    assert.equal(canonicalRedirect.destination, `${CANONICAL_EDITION_PRODUCTION_URL}/neidyejosewedding`);
    assert.equal(canonicalRedirect.permanent, false);

    const aliases = ["/neidyejose", "/neidy-jose", "/neidy-e-jose"];
    for (const alias of aliases) {
      const aliasRedirect = redirects.find((r) => r.source === alias);
      assert.ok(aliasRedirect, `Redirect for alias '${alias}' must exist`);
      assert.equal(aliasRedirect.destination, `${CANONICAL_EDITION_PRODUCTION_URL}/neidyejosewedding`);
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
        `${CANONICAL_EDITION_PRODUCTION_URL}/neidyejosewedding`,
        `Neidy route ${r.source} pointed to unexpected destination: ${r.destination}`
      );
    }
  });

  it("uses HAXR_EDITION_URL in Preview environment to target Edition Preview", async () => {
    const previewUrl = AUTHORIZED_EDITION_PREVIEW_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.HAXR_EDITION_URL = previewUrl;
    try {
      const redirects = await nextConfig.redirects();
      const canonical = redirects.find((r) => r.source === "/neidyejosewedding");
      assert.ok(canonical, "Redirect for /neidyejosewedding must exist");
      assert.equal(canonical.destination, `${previewUrl}/neidyejosewedding`);

      const aliases = ["/neidyejose", "/neidy-jose", "/neidy-e-jose"];
      for (const alias of aliases) {
        const aliasRedirect = redirects.find((r) => r.source === alias);
        assert.ok(aliasRedirect, `Redirect for alias '${alias}' must exist`);
        assert.equal(aliasRedirect.destination, `${previewUrl}/neidyejosewedding`);
        assert.ok(!aliasRedirect.destination.includes("edition.haxrsignature.com"));
      }
    } finally {
      delete process.env.VERCEL_ENV;
      delete process.env.HAXR_EDITION_URL;
    }
  });

  it("throws fail-closed error in Preview if HAXR_EDITION_URL is missing, never falling back to Production", async () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.HAXR_EDITION_URL;
    delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
    try {
      await assert.rejects(
        async () => {
          await nextConfig.redirects();
        },
        {
          message: /não está definida no ambiente Preview/i,
        }
      );
    } finally {
      delete process.env.VERCEL_ENV;
    }
  });

  it("throws error in Preview if HAXR_EDITION_URL points to Production domain", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.HAXR_EDITION_URL = "https://edition.haxrsignature.com";
    try {
      await assert.rejects(
        async () => {
          await nextConfig.redirects();
        },
        {
          message: /não pode apontar para o domínio de Produção/i,
        }
      );
    } finally {
      delete process.env.VERCEL_ENV;
      delete process.env.HAXR_EDITION_URL;
    }
  });

  describe("resolveEditionBaseUrl unit logic", () => {
    it("returns production URL when VERCEL_ENV is production and no override", () => {
      const result = resolveEditionBaseUrl({ vercelEnv: "production" });
      assert.equal(result, CANONICAL_EDITION_PRODUCTION_URL);
    });

    it("returns explicit preview URL when VERCEL_ENV is preview", () => {
      const result = resolveEditionBaseUrl({
        vercelEnv: "preview",
        editionUrl: AUTHORIZED_EDITION_PREVIEW_URL,
      });
      assert.equal(result, AUTHORIZED_EDITION_PREVIEW_URL);
    });

    it("fails closed in preview when variable is missing", () => {
      assert.throws(
        () => resolveEditionBaseUrl({ vercelEnv: "preview", editionUrl: "" }),
        /não está definida no ambiente Preview/i
      );
    });

    it("fails closed in preview when variable attempts to point to production", () => {
      assert.throws(
        () =>
          resolveEditionBaseUrl({
            vercelEnv: "preview",
            editionUrl: "https://edition.haxrsignature.com",
          }),
        /não pode apontar para o domínio de Produção/i
      );
    });
  });
});
