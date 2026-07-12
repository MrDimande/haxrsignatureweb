import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  editionProxyUnauthorizedResponse,
  validateEditionProxyRequest,
} from "./proxy-auth";

describe("validateEditionProxyRequest", () => {
  it("permite quando o segredo não está configurado", () => {
    const prev = process.env.HAXR_EDITION_PROXY_SECRET;
    delete process.env.HAXR_EDITION_PROXY_SECRET;

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.skipped, true);

    if (prev) process.env.HAXR_EDITION_PROXY_SECRET = prev;
  });

  it("rejeita quando auth é obrigatória mas secret não está configurado", () => {
    const prevSecret = process.env.HAXR_EDITION_PROXY_SECRET;
    const prevRequire = process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH;
    delete process.env.HAXR_EDITION_PROXY_SECRET;
    process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH = "true";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    assert.equal(result.ok, false);

    if (prevSecret) process.env.HAXR_EDITION_PROXY_SECRET = prevSecret;
    else delete process.env.HAXR_EDITION_PROXY_SECRET;
    if (prevRequire) process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH = prevRequire;
    else delete process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH;
  });

  it("rejeita token inválido quando o segredo está configurado", () => {
    const prev = process.env.HAXR_EDITION_PROXY_SECRET;
    process.env.HAXR_EDITION_PROXY_SECRET = "test-secret-value-32chars!!!!";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-token" },
      })
    );

    assert.equal(result.ok, false);

    if (prev) process.env.HAXR_EDITION_PROXY_SECRET = prev;
    else delete process.env.HAXR_EDITION_PROXY_SECRET;
  });

  it("aceita Bearer válido", () => {
    const prev = process.env.HAXR_EDITION_PROXY_SECRET;
    const secret = "test-secret-value-32chars!!!!";
    process.env.HAXR_EDITION_PROXY_SECRET = secret;

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      })
    );

    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.skipped, false);

    if (prev) process.env.HAXR_EDITION_PROXY_SECRET = prev;
    else delete process.env.HAXR_EDITION_PROXY_SECRET;
  });
});

describe("editionProxyUnauthorizedResponse", () => {
  it("usa envelope success", () => {
    const body = editionProxyUnauthorizedResponse();
    assert.equal(body.success, false);
    assert.equal(body.error, "Não autorizado.");
  });
});
