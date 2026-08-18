import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FloorPlanSvg from "@/components/events/floor-plan/FloorPlanSvg";
import { buildFloorPlanTables, createTableItem } from "./model";
import type { EventSeat } from "@/lib/events/types";

const seats: EventSeat[] = [
  {
    id: "seat-1",
    eventId: "event-1",
    tableName: "Mesa Imperial",
    seatNumber: 1,
    label: "",
    createdAt: "2026-01-01",
    guestId: "guest-1",
    guestName: "Ana Silva",
  },
  {
    id: "seat-2",
    eventId: "event-1",
    tableName: "Mesa Imperial",
    seatNumber: 2,
    label: "",
    createdAt: "2026-01-01",
    guestId: null,
    guestName: null,
  },
];

describe("FloorPlanSvg", () => {
  it("renderiza SVG nítido com ocupação e nomes sem copiar convidados", () => {
    const tables = buildFloorPlanTables(seats);
    const markup = renderToStaticMarkup(
      React.createElement(FloorPlanSvg, {
        room: { width: 20, length: 14, gridSize: 0.5 },
        items: [{ ...createTableItem(tables[0], 2, 2), shape: "imperial" }],
        tables,
        template: "seating-chart",
        showGuestNames: true,
      })
    );

    assert.match(markup, /^<svg/);
    assert.match(markup, /Mesa Imperial/);
    assert.match(markup, /Ana Silva/);
    assert.match(markup, /1\/2/);
    assert.doesNotMatch(markup, /guest-1/);
  });

  it("renderiza uma planta vazia válida", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FloorPlanSvg, {
        room: { width: 10, length: 8, gridSize: 1 },
        items: [],
        tables: [],
      })
    );
    assert.match(markup, /viewBox="0 0 10 8"/);
  });

  it("destaca a mesa pública sem expor convidados ou ocupação", () => {
    const tables = buildFloorPlanTables(seats);
    const item = createTableItem(tables[0], 2, 2);
    const markup = renderToStaticMarkup(
      React.createElement(FloorPlanSvg, {
        room: { width: 20, length: 14, gridSize: 0.5 },
        items: [item],
        tables: [],
        template: "client",
        highlightedTableKey: item.tableKey,
      })
    );

    assert.match(markup, /com a sua mesa destacada/);
    assert.match(markup, /animate-pulse/);
    assert.match(markup, /Mesa Imperial/);
    assert.doesNotMatch(markup, /Ana Silva|1\/2|guest-1/);
  });
});
