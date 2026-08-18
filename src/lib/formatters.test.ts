import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDatePtMZ, formatDateTimePtMZ } from "./formatters";

describe("formatters", () => {
  it("preserves formatDatePtMZ contract", () => {
    const formatted = formatDatePtMZ("2026-07-26T18:42:00.000Z");
    assert.ok(formatted);
    assert.strictEqual(typeof formatted, "string");
    assert.ok(!formatted.includes("Invalid Date"));
  });

  it("formatDateTimePtMZ formats valid ISO string in Africa/Maputo timezone", () => {
    const formatted = formatDateTimePtMZ("2026-07-26T18:42:00.000Z");
    assert.ok(formatted);
    assert.notStrictEqual(formatted, "—");
    assert.ok(!formatted.includes("Invalid Date"));
  });

  it("formatDateTimePtMZ handles null, undefined and invalid dates gracefully", () => {
    assert.strictEqual(formatDateTimePtMZ(null), "—");
    assert.strictEqual(formatDateTimePtMZ(undefined), "—");
    assert.strictEqual(formatDateTimePtMZ("invalid-date-string"), "—");
  });
});
