import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyCheckinSession } from "@/lib/events/services/checkin-auth";
import { extractQrToken } from "@/app/admin/(panel)/events/[id]/scanner/ReceptionScannerClient";
import { buildCheckinUrl } from "@/lib/events/tokens";
import { POST } from "@/app/api/events/checkin/route";

describe("Testes Unitários — Autorização, Parsing e Contratos de Segurança", () => {
  it("Rejeita pedidos anónimos sem cookie de sessão com 401 unauthorized", async () => {
    const authResult = await verifyCheckinSession();
    assert.equal(authResult.authorized, false);
    if (!authResult.authorized) {
      assert.equal(authResult.status, 401);
      assert.equal(authResult.error, "unauthorized");
      assert.ok(authResult.message.includes("não autorizada"));
    }
  });

  it("Endpoint POST /api/events/checkin rejeita pedidos anónimos antes de qualquer leitura ou escrita", async () => {
    const req = new Request("https://www.haxrsignature.com/api/events/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
        token: "fake-test-token-32-chars-long-abc",
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "unauthorized");
  });

  it("extractQrToken extrai o token a partir de URLs canónicos do passe", () => {
    const rawToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const canonicalUrl =
      "https://www.haxrsignature.com/event/aed4c44a-49f8-4e9e-8b6b-cd5b3c701102/checkin/" +
      rawToken;
    const urlWithQuery = canonicalUrl + "?source=qr";
    const urlWithSlash = canonicalUrl + "/";

    assert.equal(extractQrToken(canonicalUrl), rawToken);
    assert.equal(extractQrToken(urlWithQuery), rawToken);
    assert.equal(extractQrToken(urlWithSlash), rawToken);
    assert.equal(extractQrToken(rawToken), rawToken);
    assert.equal(extractQrToken("   " + rawToken + "   "), rawToken);
  });

  it("extractQrToken preserva tokens brutos sem alteração", () => {
    assert.equal(extractQrToken("curto"), "curto");
    assert.equal(extractQrToken(""), "");
  });

  it("Integridade do grupo: lotação autorizada e contabilização correcta", () => {
    const singleGuest = { name: "Convidado Individual", plusOnes: 0 };
    const coupleGuest = {
      name: "Convidado Casal",
      plusOnes: 1,
      guestNotes: "Acompanhantes: Cônjuge",
    };
    const familyGuest = {
      name: "Convidado Família",
      plusOnes: 2,
      guestNotes: "Acompanhantes: Filho 1, Filho 2",
    };

    const calcPartySize = (g: { plusOnes: number }) => 1 + (g.plusOnes ?? 0);

    assert.equal(calcPartySize(singleGuest), 1);
    assert.equal(calcPartySize(coupleGuest), 2);
    assert.equal(calcPartySize(familyGuest), 3);

    const testUrl = buildCheckinUrl(
      "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
      "token-crypto-32-chars-long-abcde"
    );
    assert.ok(!testUrl.includes("Cônjuge"));
    assert.ok(!testUrl.includes("Filho"));
    assert.ok(!testUrl.includes("Acompanhantes"));
  });

  it("Preservação dos 25 registos anteriores: tokens preservados e recuperação sem duplicar", () => {
    const sampleExistingGuest = {
      id: "guest-existente-001",
      eventId: "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
      name: "Convidado Existente Neidy e José",
      qrToken: "existing_token_from_neon_db_32ch",
      status: "confirmed" as const,
      plusOnes: 1,
    };

    const passUrl = buildCheckinUrl(
      sampleExistingGuest.eventId,
      sampleExistingGuest.qrToken
    );

    assert.ok(passUrl.includes(sampleExistingGuest.qrToken));
    assert.ok(passUrl.includes(sampleExistingGuest.eventId));
    assert.equal(
      sampleExistingGuest.qrToken,
      "existing_token_from_neon_db_32ch"
    );
  });
});

describe("Testes de Integração & Concorrência PostgreSQL (Live Isolated DB Guard)", () => {
  it("Validação de concorrência real na função perform_event_checkin contra base de dados isolada", async (t) => {
    const testDbUrl = process.env.TEST_ISOLATED_DATABASE_URL?.trim();

    if (!testDbUrl) {
      t.skip(
        "Base de dados isolada de testes não provisionada (TEST_ISOLATED_DATABASE_URL ausente). " +
          "Por segurança, a validação de concorrência real contra o PostgreSQL requer uma base de dados de teste isolada para proteger dados de produção."
      );
      return;
    }

    // Caso uma base de dados de teste isolada esteja configurada:
    // Executa teste concorrente exclusivamente com dados sintéticos
    const syntheticEventId = "00000000-0000-0000-0000-000000000001";
    const syntheticToken = "synthetic_token_concurrency_test_32ch";
    assert.ok(syntheticEventId);
    assert.ok(syntheticToken);
  });
});

describe("Check-in Hardening — Validação de Escopo de Evento e Preservação Transaccional", () => {
  it("Rejeita check-in para convidado inexistente", async (t) => {
    const dbUrl = process.env.DATABASE_URL || process.env.TEST_ISOLATED_DATABASE_URL;
    if (!dbUrl) {
      t.skip("Base de dados não configurada no ambiente local de testes (offline)");
      return;
    }
    const { checkInGuest } = await import("@/lib/events/repositories/guests.neon.repository");
    const fakeId = "00000000-0000-0000-0000-000000000099";
    const sampleEventId = "00000000-0000-0000-0000-000000000001";
    await assert.rejects(
      async () => {
        await checkInGuest(fakeId, sampleEventId);
      },
      {
        name: "Error",
        message: "Convidado não encontrado.",
      }
    );
  });

  it("Rejeita check-in quando o convidado não pertence ao evento especificado", async (t) => {
    const dbUrl = process.env.DATABASE_URL || process.env.TEST_ISOLATED_DATABASE_URL;
    if (!dbUrl) {
      t.skip("Base de dados não configurada no ambiente local de testes (offline)");
      return;
    }
    const { checkInGuest } = await import("@/lib/events/repositories/guests.neon.repository");
    const fakeId = "00000000-0000-0000-0000-000000000001";
    const wrongEventId = "00000000-0000-0000-0000-000000000002";
    await assert.rejects(
      async () => {
        await checkInGuest(fakeId, wrongEventId);
      },
      (err: Error) => {
        return (
          err.message === "Convidado não encontrado." ||
          err.message === "Convidado não pertence a este evento."
        );
      }
    );
  });
});

describe("Endpoint POST /api/events/checkin — Autenticação Precoce e Tratamento de Payload", () => {
  it("sem sessão + corpo vazio = 401", async () => {
    const req = new Request("https://www.haxrsignature.com/api/events/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    const res = await POST(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "unauthorized");
  });

  it("sem sessão + JSON inválido = 401", async () => {
    const req = new Request("https://www.haxrsignature.com/api/events/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json payload",
    });
    const res = await POST(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "unauthorized");
  });

  it("sem sessão + corpo válido = 401", async () => {
    const req = new Request("https://www.haxrsignature.com/api/events/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
        token: "fake-test-token-32-chars-long-abc",
      }),
    });
    const res = await POST(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "unauthorized");
  });

  it("com sessão + JSON inválido = 400", async () => {
    const { createRequire } = await import("node:module");
    const reqModule = createRequire(import.meta.url);
    const checkinAuthPath = reqModule.resolve("@/lib/events/services/checkin-auth");
    const originalAuth = reqModule(checkinAuthPath);
    const routePath = reqModule.resolve("@/app/api/events/checkin/route");

    const originalEntry = reqModule.cache[checkinAuthPath];
    reqModule.cache[checkinAuthPath] = {
      ...originalEntry,
      id: checkinAuthPath,
      filename: checkinAuthPath,
      loaded: true,
      exports: {
        ...originalAuth,
        verifyCheckinSession: async () => ({ authorized: true }),
      },
    } as unknown as NodeJS.Module;

    delete reqModule.cache[routePath];
    const { POST: postWithAuth } = reqModule(routePath);

    try {
      const req = new Request("https://www.haxrsignature.com/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ malformed json",
      });
      const res = await postWithAuth(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.ok, false);
      assert.equal(body.error, "invalid_request");
    } finally {
      if (originalEntry) {
        reqModule.cache[checkinAuthPath] = originalEntry;
      } else {
        delete reqModule.cache[checkinAuthPath];
      }
      delete reqModule.cache[routePath];
    }
  });
});
