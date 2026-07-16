import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getEditionRsvpHealth } from "./registry-health";

const originalWeddingId = process.env.EDITION_EVENT_JESSICA_WEDDING_ID;

afterEach(() => {
  if (originalWeddingId === undefined) {
    delete process.env.EDITION_EVENT_JESSICA_WEDDING_ID;
  } else {
    process.env.EDITION_EVENT_JESSICA_WEDDING_ID = originalWeddingId;
  }
});

describe("Edition RSVP publish health", () => {
  it("blocks unknown registry", () => {
    assert.deepEqual(getEditionRsvpHealth("unknown"), {
      healthy: false,
      registryKey: "unknown",
      reason: "unknown_registry",
    });
  });

  it("blocks publishing when binding env is missing", () => {
    delete process.env.EDITION_EVENT_JESSICA_WEDDING_ID;
    assert.deepEqual(getEditionRsvpHealth("jessica-samuel-wedding"), {
      healthy: false,
      registryKey: "jessica-samuel-wedding",
      reason: "binding_missing",
    });
  });

  it("resolves canonical registry, public slug and server binding", () => {
    process.env.EDITION_EVENT_JESSICA_WEDDING_ID =
      "7cec4447-de0d-40a5-8f03-8d7c87acb3f5";

    const health = getEditionRsvpHealth("jessica-samuel-wedding");
    assert.equal(health.healthy, true);
    if (health.healthy) {
      assert.equal(health.publicSlug, "jessicasamuelwedding");
      assert.equal(
        health.bindingEnvVar,
        "EDITION_EVENT_JESSICA_WEDDING_ID"
      );
      assert.equal(
        health.inviteUrl,
        "https://edition.haxrsignature.com/jessicasamuelwedding"
      );
    }
  });
});
