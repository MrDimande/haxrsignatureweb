import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createFindSeatPostHandler,
  FIND_SEAT_GENERIC_ERROR,
  type FindSeatApiDependencies,
} from "./find-seat-api";

const EVENT_ID = "0d72a919-57f4-4e8f-a7b6-742f36d4f195";
const CODE = "HXR-00112233445566778899AABB";

function request(
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request("https://example.test/api/events/find-seat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function allowed() {
  return { allowed: true, remaining: 9, retryAfterSeconds: 0 };
}

function dependencies(
  overrides: Partial<FindSeatApiDependencies> = {}
): FindSeatApiDependencies {
  return {
    search: async () => ({
      ok: true,
      event: {
        id: EVENT_ID,
        name: "Evento privado",
        type: "wedding",
        date: null,
        location: "",
      },
      results: [
        {
          name: "Ana Silva",
          seat: {
            tableName: "Mesa 1",
            tableKey: "mesa 1",
            seatNumber: 2,
            label: "",
          },
          matchKind: "exact",
        },
      ],
      floorPlan: null,
    }),
    rateLimit: async () => allowed(),
    getIp: () => "203.0.113.8",
    limits: {
      ip: { max: 10, windowMs: 60_000 },
      event: { max: 15, windowMs: 60_000 },
      code: { max: 30, windowMs: 60_000 },
    },
    ...overrides,
  };
}

describe("Find Your Seat public API", () => {
  it("rejeita JSON inválido sem chamar pesquisa", async () => {
    let searched = false;
    const handler = createFindSeatPostHandler(
      dependencies({ search: async () => ((searched = true), { ok: false }) })
    );
    const response = await handler(
      new Request("https://example.test/api/events/find-seat", {
        method: "POST",
        body: "{",
      })
    );

    assert.equal(response.status, 400);
    assert.equal(searched, false);
  });

  it("rejeita payloads inválidos e campos adicionais", async () => {
    const handler = createFindSeatPostHandler(dependencies());
    const response = await handler(
      request({
        eventId: "não-é-uuid",
        query: "An",
        accessCode: CODE,
        debug: true,
      })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), FIND_SEAT_GENERIC_ERROR);
  });

  it("limita corpos declarados acima de 2 KiB", async () => {
    const handler = createFindSeatPostHandler(dependencies());
    const response = await handler(
      request(
        { eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE },
        { "content-length": "4096" }
      )
    );

    assert.equal(response.status, 413);
  });

  it("aplica os três buckets sem guardar o código em claro", async () => {
    const keys: string[] = [];
    const handler = createFindSeatPostHandler(
      dependencies({
        rateLimit: async (key) => {
          keys.push(key);
          return allowed();
        },
      })
    );

    const response = await handler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );

    assert.equal(response.status, 200);
    assert.equal(keys.length, 3);
    assert.match(keys[0], /^find-seat:ip:/);
    assert.match(keys[1], /^find-seat:event:/);
    assert.match(keys[2], /^find-seat:code:/);
    assert.equal(keys.some((key) => key.includes(CODE)), false);
  });

  it("pára no primeiro bucket bloqueado e devolve Retry-After", async () => {
    let calls = 0;
    const handler = createFindSeatPostHandler(
      dependencies({
        rateLimit: async () => {
          calls += 1;
          return { allowed: false, remaining: 0, retryAfterSeconds: 37 };
        },
      })
    );

    const response = await handler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "37");
    assert.equal(calls, 1);
  });

  it("não distingue código inválido de nome inexistente", async () => {
    const handler = createFindSeatPostHandler(
      dependencies({ search: async () => ({ ok: false, error: "invalid_access" }) })
    );
    const invalidCode = await handler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );

    const notFoundHandler = createFindSeatPostHandler(
      dependencies({ search: async () => ({ ok: false, error: "not_found" }) })
    );
    const missingName = await notFoundHandler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );

    assert.equal(invalidCode.status, 404);
    assert.equal(missingName.status, 404);
    assert.deepEqual(await invalidCode.json(), await missingName.json());
  });

  it("marca respostas de sucesso como privadas e não armazenáveis", async () => {
    const handler = createFindSeatPostHandler(dependencies());
    const response = await handler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store, private");
    assert.equal(body.results[0].name, "Ana Silva");
  });

  it("não reflecte payloads nem segredos em falhas internas", async () => {
    let reported = false;
    const handler = createFindSeatPostHandler(
      dependencies({
        search: async () => {
          throw new Error(`database failure ${CODE}`);
        },
        reportUnavailable: () => {
          reported = true;
        },
      })
    );
    const response = await handler(
      request({ eventId: EVENT_ID, query: "Ana Silva", accessCode: CODE })
    );
    const serialized = JSON.stringify(await response.json());

    assert.equal(response.status, 503);
    assert.equal(serialized.includes(CODE), false);
    assert.equal(reported, true);
  });
});
