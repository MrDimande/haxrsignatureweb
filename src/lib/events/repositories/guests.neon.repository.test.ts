import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOperationalGuestFilter } from "./guests.neon.repository";

describe("operational guest aggregates", () => {
  it("excludes archived, deleted, and incorrect guests from operational metrics", () => {
    assert.equal(
      buildOperationalGuestFilter(),
      "deleted_at IS NULL AND archived_at IS NULL AND is_incorrect IS NOT TRUE",
    );
    assert.equal(
      buildOperationalGuestFilter("g"),
      "g.deleted_at IS NULL AND g.archived_at IS NULL AND g.is_incorrect IS NOT TRUE",
    );
  });
});
