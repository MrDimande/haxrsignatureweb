import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  searchFindSeat,
  type FindSeatServiceDependencies,
} from "./find-seat.service";

const EVENT_ID = "0d72a919-57f4-4e8f-a7b6-742f36d4f195";
const CODE = "HXR-00112233445566778899AABB";

function dependencies(
  overrides: Partial<FindSeatServiceDependencies> = {}
): FindSeatServiceDependencies {
  return {
    verifyAccess: async () => ({
      id: EVENT_ID,
      name: "Casamento",
      type: "wedding",
      date: null,
      location: "Maputo",
    }),
    searchGuests: async () => [
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
    getPublicFloorPlan: async () => null,
    ...overrides,
  };
}

describe("searchFindSeat", () => {
  it("rejeita códigos malformados sem consultar o evento", async () => {
    let verified = false;
    const result = await searchFindSeat(EVENT_ID, "Ana Silva", "x", {
      ...dependencies(),
      verifyAccess: async () => {
        verified = true;
        return null;
      },
    });

    assert.deepEqual(result, { ok: false, error: "invalid_access" });
    assert.equal(verified, false);
  });

  it("valida os limites do nome antes de aceder a dados", async () => {
    let verified = false;
    const deps = dependencies({
      verifyAccess: async () => {
        verified = true;
        return null;
      },
    });

    assert.deepEqual(await searchFindSeat(EVENT_ID, "An", CODE, deps), {
      ok: false,
      error: "query_too_short",
    });
    assert.deepEqual(await searchFindSeat(EVENT_ID, "A".repeat(81), CODE, deps), {
      ok: false,
      error: "query_too_long",
    });
    assert.equal(verified, false);
  });

  it("valida o comprimento depois de normalizar sufixos de acompanhante", async () => {
    let verified = false;
    let searched = false;
    const result = await searchFindSeat(
      EVENT_ID,
      "Jo (+1)",
      CODE,
      dependencies({
        verifyAccess: async () => {
          verified = true;
          return null;
        },
        searchGuests: async () => {
          searched = true;
          return [];
        },
      })
    );

    assert.deepEqual(result, { ok: false, error: "query_too_short" });
    assert.equal(verified, false);
    assert.equal(searched, false);
  });

  it("não pesquisa convidados quando o acesso falha", async () => {
    let searched = false;
    const result = await searchFindSeat(
      EVENT_ID,
      "Ana Silva",
      CODE,
      dependencies({
        verifyAccess: async () => null,
        searchGuests: async () => {
          searched = true;
          return [];
        },
      })
    );

    assert.deepEqual(result, { ok: false, error: "invalid_access" });
    assert.equal(searched, false);
  });

  it("não carrega o Croqui quando o nome não corresponde", async () => {
    let floorPlanRead = false;
    const result = await searchFindSeat(
      EVENT_ID,
      "Nome Inexistente",
      CODE,
      dependencies({
        searchGuests: async () => [],
        getPublicFloorPlan: async () => {
          floorPlanRead = true;
          return null;
        },
      })
    );

    assert.deepEqual(result, { ok: false, error: "not_found" });
    assert.equal(floorPlanRead, false);
  });

  it("só devolve o Croqui público depois de código e nome válidos", async () => {
    const floorPlan = {
      room: { width: 20, length: 14, gridSize: 0.5, unit: "m" as const },
      items: [],
    };
    const result = await searchFindSeat(
      EVENT_ID,
      "  Ana Silva  ",
      CODE.toLowerCase(),
      dependencies({ getPublicFloorPlan: async () => floorPlan })
    );

    assert.equal(result.ok, true);
    assert.deepEqual(result.floorPlan, floorPlan);
    assert.equal(result.results?.[0]?.matchKind, "exact");
  });
});
