import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysUntilDateHold,
  formatDateHoldUntil,
  isDateHoldActive,
} from "@/lib/portal/date-hold";

describe("date-hold", () => {
  it("detecta reserva activa", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isDateHoldActive(future), true);
    assert.equal(isDateHoldActive(null), false);
  });

  it("formata data em pt-MZ", () => {
    const label = formatDateHoldUntil("2026-12-25T12:00:00.000Z");
    assert.match(label, /2026/);
  });

  it("calcula dias restantes", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    assert.ok(daysUntilDateHold(future) >= 4);
  });
});
