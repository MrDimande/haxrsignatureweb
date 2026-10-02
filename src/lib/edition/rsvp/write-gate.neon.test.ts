import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateEditionRsvpWriteGate } from "./write-gate";

describe("Edition RSVP Neon Preview write gate", () => {
  it("requires Vercel Preview and a Neon database", () => {
    assert.deepEqual(evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "development",
      neonDatabaseEnabled: true,
    }), {
      allowed: false,
      mode: "preview_neon",
      reason: "not_preview",
    });
  });
});
