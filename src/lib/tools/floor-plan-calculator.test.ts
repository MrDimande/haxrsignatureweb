import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateFloorPlan,
  formatFloorPlanWhatsAppMessage,
  type FloorPlanInput,
} from "./floor-plan-calculator";

test("calculateFloorPlan calculates realistic area and table count for 350 guests", () => {
  const input: FloorPlanInput = {
    guestCount: 350,
    tableFormat: "round_10",
    serviceComfortLevel: "standard",
    hasDanceFloor: true,
    hasStageBanda: true,
    hasBuffetStations: true,
    hasOpenBarStation: true,
    hasHonorTable: true,
    hasLoungeArea: true,
    coupleNames: "Jessica & Samuel",
    venueName: "Evelyn Eventos, Maputo",
  };

  const result = calculateFloorPlan(input);

  // 350 convidados: ~34 a 36 mesas
  assert.ok(result.totalTables >= 34 && result.totalTables <= 36);
  // Área mínima de salão deve ser superior a 600m² para 350 convidados com pista e buffet
  assert.ok(result.minTotalAreaSqM >= 600);
  assert.ok(result.recommendedTotalAreaSqM > result.minTotalAreaSqM);
  // Pista de dança deve ter dimensão calculada
  assert.ok(result.danceFloorSqM >= 70);
  assert.ok(result.visualTables.length >= 35);
});

test("calculateFloorPlan handles hybrid royal format with large honor table", () => {
  const input: FloorPlanInput = {
    guestCount: 200,
    tableFormat: "hybrid_royal",
    serviceComfortLevel: "comfort",
    hasDanceFloor: true,
    hasStageBanda: false,
    hasBuffetStations: false,
    hasOpenBarStation: true,
    hasHonorTable: true,
    hasLoungeArea: false,
  };

  const result = calculateFloorPlan(input);
  assert.equal(result.honorTableCapacity, 24);
  // 200 - 24 = 176 convidados em mesas de 10 = 18 mesas normais + 1 de honra = 19
  assert.equal(result.totalTables, 19);
});

test("formats valid WhatsApp message containing technical specs", () => {
  const input: FloorPlanInput = {
    guestCount: 250,
    tableFormat: "round_10",
    serviceComfortLevel: "standard",
    hasDanceFloor: true,
    hasStageBanda: true,
    hasBuffetStations: true,
    hasOpenBarStation: true,
    hasHonorTable: true,
    hasLoungeArea: false,
    coupleNames: "Vânia & Fabião",
    venueName: "Polana Serena Hotel",
  };

  const result = calculateFloorPlan(input);
  const message = formatFloorPlanWhatsAppMessage(result);

  assert.ok(message.includes("VÂNIA & FABIÃO"));
  assert.ok(message.includes("250 pessoas"));
  assert.ok(message.includes("Polana Serena Hotel"));
  assert.ok(message.includes("HAXR SIGNATURE"));
});
