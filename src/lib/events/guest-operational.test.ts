import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOperationalGuest } from "./guest-operational";

describe("isOperationalGuest", () => {
  it("accepts only current, valid guests", () => {
    assert.equal(
      isOperationalGuest({ archivedAt: null, deletedAt: null, isIncorrect: false }),
      true,
    );
    assert.equal(
      isOperationalGuest({
        archivedAt: "2026-11-01T10:00:00.000Z",
        deletedAt: null,
        isIncorrect: false,
      }),
      false,
    );
    assert.equal(
      isOperationalGuest({
        archivedAt: null,
        deletedAt: "2026-11-01T10:00:00.000Z",
        isIncorrect: false,
      }),
      false,
    );
    assert.equal(
      isOperationalGuest({ archivedAt: null, deletedAt: null, isIncorrect: true }),
      false,
    );
  });
});
