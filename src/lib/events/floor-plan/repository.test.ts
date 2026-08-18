import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateFloorPlanLayout } from "./repository";
import type {
  FloorPlanItem,
  FloorPlanRoom,
} from "@/lib/events/floor-plan/types";

const room: FloorPlanRoom = {
  width: 20,
  length: 14,
  gridSize: 0.5,
  unit: "m",
};

function table(overrides: Partial<FloorPlanItem> = {}): FloorPlanItem {
  return {
    id: "table:mesa-1",
    kind: "table",
    tableKey: "mesa 1",
    sourceTableName: "Mesa 1",
    shape: "round",
    x: 2,
    y: 2,
    width: 2.4,
    height: 2.4,
    rotation: 0,
    locked: false,
    ...overrides,
  } as FloorPlanItem;
}

describe("validateFloorPlanLayout", () => {
  it("aceita um layout válido", () => {
    assert.doesNotThrow(() => validateFloorPlanLayout(room, [table()]));
  });

  it("rejeita elementos fora da sala", () => {
    assert.throws(
      () => validateFloorPlanLayout(room, [table({ x: 19 })]),
      /fora dos limites/
    );
  });

  it("rejeita ids e mesas duplicados", () => {
    assert.throws(
      () =>
        validateFloorPlanLayout(room, [
          table(),
          table({ tableKey: "mesa 2", sourceTableName: "Mesa 2" }),
        ]),
      /identificador duplicado/
    );

    assert.throws(
      () =>
        validateFloorPlanLayout(room, [
          table(),
          table({
            id: "table:mesa-1-copy",
            x: 6,
          }),
        ]),
      /posicionada mais de uma vez/
    );
  });

  it("rejeita rotações não normalizadas", () => {
    assert.throws(
      () => validateFloorPlanLayout(room, [table({ rotation: 360 })]),
      /rotação/
    );
  });
});
