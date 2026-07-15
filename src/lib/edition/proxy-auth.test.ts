import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  editionProxyUnauthorizedResponse,
  isEditionProxyProductionRuntime,
  validateEditionProxyJsonBody,
  validateEditionProxyRequest,
} from "./proxy-auth";

function restoreEnv(
  keys: string[],
  snapshot: Record<string, string | undefined>
) {
  for (const key of keys) {
    const previous = snapshot[key];
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
}

describe("validateEditionProxyRequest", () => {
  const tracked = [
    "HAXR_EDITION_PROXY_SECRET",
    "HAXR_REQUIRE_EDITION_PROXY_AUTH",
    "VERCEL_ENV",
  ] as const;
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    snapshot = Object.fromEntries(
      tracked.map((key) => [key, process.env[key]])
    );
    for (const key of tracked) delete process.env[key];
  });

  afterEach(() => {
    restoreEnv([...tracked], snapshot);
  });

  it("permite skip quando secret ausente fora de produção (sem VERCEL_ENV production)", () => {
    delete process.env.HAXR_EDITION_PROXY_SECRET;
    delete process.env.VERCEL_ENV;

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    // Em CI/test NODE_ENV costuma ser "test" (não production) → skip permitido.
    if (!isEditionProxyProductionRuntime()) {
      assert.equal(result.ok, true);
      if (result.ok) assert.equal(result.skipped, true);
    } else {
      assert.equal(result.ok, false);
    }
  });

  it("fail-closed com VERCEL_ENV=production quando secret ausente", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.HAXR_EDITION_PROXY_SECRET;

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "missing");
    assert.equal(isEditionProxyProductionRuntime(), true);
  });

  it("rejeita quando auth é obrigatória mas secret não está configurado", () => {
    delete process.env.HAXR_EDITION_PROXY_SECRET;
    delete process.env.VERCEL_ENV;
    process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH = "true";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    assert.equal(result.ok, false);
  });

  it("rejeita token inválido", () => {
    process.env.HAXR_EDITION_PROXY_SECRET = "test-secret-value-32chars!!!!";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-token" },
      })
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid");
  });

  it("rejeita header ausente quando secret configurado", () => {
    process.env.HAXR_EDITION_PROXY_SECRET = "test-secret-value-32chars!!!!";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", { method: "POST" })
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "missing");
  });

  it("aceita Bearer válido", () => {
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
  });

  it("aceita header x-haxr-edition-proxy", () => {
    const secret = "test-secret-value-32chars!!!!";
    process.env.HAXR_EDITION_PROXY_SECRET = secret;

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: { "x-haxr-edition-proxy": secret },
      })
    );

    assert.equal(result.ok, true);
  });
});

describe("validateEditionProxyJsonBody", () => {
  it("rejeita content-type inválido", () => {
    const result = validateEditionProxyJsonBody(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: { "content-type": "text/plain" },
      })
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 415);
  });

  it("rejeita body demasiado grande", () => {
    const result = validateEditionProxyJsonBody(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "999999",
        },
      })
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 413);
  });

  it("aceita application/json válido", () => {
    const result = validateEditionProxyJsonBody(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "120",
        },
      })
    );
    assert.equal(result.ok, true);
  });
});

describe("editionProxyUnauthorizedResponse", () => {
  it("não inclui secret nem detalhes internos", () => {
    const body = editionProxyUnauthorizedResponse();
    assert.equal(body.success, false);
    assert.equal(body.error, "Não autorizado.");
    assert.equal(JSON.stringify(body).includes("HAXR"), false);
  });
});
