import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFloorPlanTables,
  createHistory,
  createTableItem,
  itemsOverlap,
  pushHistory,
  reconcileFloorPlanTables,
  redoHistory,
  snapValue,
  seatPositionForTable,
  undoHistory,
  updateItemGeometry,
} from "./model";
import type { EventSeat } from "@/lib/events/types";
import type { FloorPlanSnapshot } from "./types";

function seat(
  id: string,
  tableName: string,
  seatNumber: number,
  guestName: string | null = null
): EventSeat {
  return {
    id,
    eventId: "event-1",
    tableName,
    seatNumber,
    label: "",
    createdAt: "2026-01-01",
    guestId: guestName ? `guest-${id}` : null,
    guestName,
  };
}

const snapshot: FloorPlanSnapshot = {
  room: { width: 20, length: 14, gridSize: 0.5, unit: "m" },
  items: [],
  printPreferences: {
    format: "A4",
    orientation: "landscape",
    template: "technical",
    showGuestNames: false,
  },
};

describe("floor-plan model", () => {
  it("carrega mesas existentes sem duplicar lugares ou convidados", () => {
    const tables = buildFloorPlanTables([
      seat("1", "Mesa 1", 1, "Ana"),
      seat("2", "Mesa 1", 2),
      seat("3", "Mesa 2", 1, "Bruno"),
    ]);
    assert.equal(tables.length, 2);
    assert.equal(tables[0].capacity, 2);
    assert.equal(tables[0].occupied, 1);
    assert.deepEqual(tables[0].guestNames, ["Ana"]);
  });

  it("mostra mesas novas como por posicionar e sinaliza removidas", () => {
    const table = buildFloorPlanTables([seat("1", "Mesa 1", 1)])[0];
    const positioned = createTableItem(table, 1, 1);
    const newTable = buildFloorPlanTables([seat("2", "Mesa 2", 1)])[0];
    const withNew = reconcileFloorPlanTables([positioned], [table, newTable]);
    assert.equal(withNew.unpositioned[0].tableName, "Mesa 2");

    const removed = reconcileFloorPlanTables([positioned], [newTable]);
    assert.equal(removed.removed[0].sourceTableName, "Mesa 1");
    assert.equal(removed.items.length, 0);
  });

  it("aplica snap, rotação, resize e bloqueio", () => {
    const table = buildFloorPlanTables([seat("1", "Mesa 1", 1)])[0];
    const item = createTableItem(table, 0, 0);
    const updated = updateItemGeometry(
      item,
      { x: 1.24, y: 2.26, width: 3.2, rotation: 375 },
      0.5
    );
    assert.equal(updated.x, 1);
    assert.equal(updated.y, 2.5);
    assert.equal(updated.width, 3);
    assert.equal(updated.rotation, 15);
    assert.equal(snapValue(1.26, 0.5), 1.5);

    const locked = updateItemGeometry({ ...updated, locked: true }, { x: 9 }, 0.5);
    assert.equal(locked.x, updated.x);
  });

  it("suporta undo e redo sem perder estado", () => {
    const first = createHistory(snapshot);
    const secondSnapshot = {
      ...snapshot,
      room: { ...snapshot.room, width: 25 },
    };
    const second = pushHistory(first, secondSnapshot);
    assert.equal(undoHistory(second).present.room.width, 20);
    assert.equal(redoHistory(undoHistory(second)).present.room.width, 25);
  });

  it("detecta sobreposição visual", () => {
    const table = buildFloorPlanTables([seat("1", "Mesa 1", 1)])[0];
    const a = createTableItem(table, 1, 1);
    const b = { ...createTableItem(table, 2, 2), id: "second" };
    const c = { ...createTableItem(table, 10, 10), id: "third" };
    assert.equal(itemsOverlap(a, b), true);
    assert.equal(itemsOverlap(a, c), false);
  });

  it("trata layout sem mesas", () => {
    assert.deepEqual(buildFloorPlanTables([]), []);
    const result = reconcileFloorPlanTables([], []);
    assert.deepEqual(result.unpositioned, []);
    assert.deepEqual(result.removed, []);
  });
});

describe("seatPositionForTable", () => {
  it("distribui lugares de mesas rectangulares pelo perímetro", () => {
    const item = createTableItem(
      {
        tableKey: "mesa-imperial",
        tableName: "Mesa Imperial",
        seats: [],
        capacity: 8,
        occupied: 0,
        available: 8,
        guestNames: [],
      },
      0,
      0
    );
    item.shape = "imperial";
    item.width = 5;
    item.height = 1.5;

    const positions = Array.from({ length: 8 }, (_, index) =>
      seatPositionForTable(item, index, 8)
    );

    assert.ok(positions.some((position) => position.y < 0));
    assert.ok(positions.some((position) => position.y > item.height));
    assert.ok(positions.some((position) => position.x < 0));
    assert.ok(positions.some((position) => position.x > item.width));
  });
});
