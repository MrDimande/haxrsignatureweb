import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  editionProxyUnauthorizedResponse,
  isEditionProxyProductionRuntime,
  setAyllaProxySecretForTesting,
  validateAyllaProxyRequest,
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

  it("rejeita segredo dedicado Baby Aylla nas rotas globais RSVP", () => {
    process.env.HAXR_EDITION_PROXY_SECRET = "global-rsvp-proxy-secret-32chars!!";
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = "aylla-gift-proxy-secret-32chars!!";

    const result = validateEditionProxyRequest(
      new Request("http://localhost/api/v1/edition/rsvp", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.HAXR_AYLLA_GIFT_PROXY_SECRET}`,
          "x-haxr-edition-proxy": process.env.HAXR_AYLLA_GIFT_PROXY_SECRET,
        },
      })
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
    }
    delete process.env.HAXR_AYLLA_GIFT_PROXY_SECRET;
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

describe("validateAyllaProxyRequest", () => {
  const tracked = [
    "HAXR_AYLLA_GIFT_PROXY_SECRET",
    "HAXR_EDITION_PROXY_SECRET",
    "VERCEL_ENV",
    "NODE_ENV",
  ] as const;
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    snapshot = Object.fromEntries(
      tracked.map((key) => [key, process.env[key]])
    );
    for (const key of tracked) delete process.env[key];
    setAyllaProxySecretForTesting(null);
  });

  afterEach(() => {
    restoreEnv([...tracked], snapshot);
    setAyllaProxySecretForTesting(null);
  });

  it("aceita segredo dedicado válido via Bearer, x-haxr-edition-proxy ou ambos idênticos", () => {
    const dedicated = "aylla-dedicated-secret-32chars!!";
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = dedicated;
    process.env.HAXR_EDITION_PROXY_SECRET = "global-rsvp-secret-32chars!!!!!!";

    const byBearer = validateAyllaProxyRequest(
      new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: { authorization: `Bearer ${dedicated}` },
      })
    );
    const byProxyHeader = validateAyllaProxyRequest(
      new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: { "x-haxr-edition-proxy": dedicated },
      })
    );
    const byBoth = validateAyllaProxyRequest(
      new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: {
          authorization: `Bearer ${dedicated}`,
          "x-haxr-edition-proxy": dedicated,
        },
      })
    );

    assert.equal(byBearer.ok, true);
    assert.equal(byProxyHeader.ok, true);
    assert.equal(byBoth.ok, true);
  });

  it("falha fechado quando HAXR_AYLLA_GIFT_PROXY_SECRET está ausente mesmo com HAXR_EDITION_PROXY_SECRET", () => {
    const globalSecret = "global-rsvp-secret-32chars!!!!!!";
    process.env.HAXR_EDITION_PROXY_SECRET = globalSecret;

    const mutableEnv = process.env as Record<string, string | undefined>;
    for (const runtime of [
      { vercel: "development", node: "test" },
      { vercel: "production", node: "production" },
    ]) {
      mutableEnv.VERCEL_ENV = runtime.vercel;
      mutableEnv.NODE_ENV = runtime.node;

      const result = validateAyllaProxyRequest(
        new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
          method: "POST",
          headers: {
            authorization: `Bearer ${globalSecret}`,
            "x-haxr-edition-proxy": globalSecret,
          },
        })
      );

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "missing");
      }
    }
  });

  it("rejeita segredo global quando segredo dedicado está configurado em produção", () => {
    const globalSecret = "global-rsvp-secret-32chars!!!!!!";
    const mutableEnv = process.env as Record<string, string | undefined>;
    mutableEnv.VERCEL_ENV = "production";
    mutableEnv.NODE_ENV = "production";
    process.env.HAXR_EDITION_PROXY_SECRET = globalSecret;
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = "aylla-dedicated-secret-32chars!!";

    const result = validateAyllaProxyRequest(
      new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: {
          authorization: `Bearer ${globalSecret}`,
          "x-haxr-edition-proxy": globalSecret,
        },
      })
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
    }
  });

  it("rejeita segredo dedicado incorrecto", () => {
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = "aylla-dedicated-secret-32chars!!";

    const result = validateAyllaProxyRequest(
      new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-dedicated-secret-32chars!",
          "x-haxr-edition-proxy": "wrong-dedicated-secret-32chars!",
        },
      })
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
    }
  });

  it("rejeita headers inválidos, vazios ou contraditórios", () => {
    const dedicated = "aylla-dedicated-secret-32chars!!";
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = dedicated;

    const cases = [
      new Headers({
        authorization: `Bearer ${dedicated}`,
        "x-haxr-edition-proxy": "other-secret-value-32chars!!!!!",
      }),
      new Headers({
        authorization: `Basic ${dedicated}`,
        "x-haxr-edition-proxy": dedicated,
      }),
      new Headers({
        authorization: "Bearer   ",
        "x-haxr-edition-proxy": dedicated,
      }),
      new Headers({
        authorization: `Bearer ${dedicated}`,
        "x-haxr-edition-proxy": "",
      }),
      new Headers({
        authorization: `Bearer ${dedicated}, Bearer ${dedicated}`,
      }),
    ];

    for (const headers of cases) {
      const result = validateAyllaProxyRequest(
        new Request("http://localhost/api/v1/edition/gifts/aylla/catalog", {
          method: "POST",
          headers,
        })
      );
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "invalid");
      }
    }
  });
});
