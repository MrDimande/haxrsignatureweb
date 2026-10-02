import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateEditionRsvpWriteGate,
  parseProductionAllowedSlugs,
  resolveEditionRsvpWriteMode,
} from "./write-gate";

describe("Edition RSVP write gate", () => {
  it("defaults to disabled and rejects legacy preview_clone mode", () => {
    assert.equal(resolveEditionRsvpWriteMode(undefined), "disabled");
    assert.equal(resolveEditionRsvpWriteMode("preview_clone"), "unknown");
    assert.deepEqual(evaluateEditionRsvpWriteGate({ writeMode: "preview_clone" }), {
      allowed: false,
      mode: "unknown",
      reason: "mode_unknown",
    });
  });

  it("allows Preview RSVP writes only with Neon connectivity", () => {
    assert.deepEqual(evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "preview",
      neonDatabaseEnabled: true,
    }), { allowed: true, mode: "preview_neon" });

    assert.deepEqual(evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "preview",
      neonDatabaseEnabled: false,
    }), {
      allowed: false,
      mode: "preview_neon",
      reason: "neon_database_unavailable",
    });
  });

  it("denies Preview write mode in Production", () => {
    assert.deepEqual(evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "production",
      neonDatabaseEnabled: true,
    }), {
      allowed: false,
      mode: "preview_neon",
      reason: "production_runtime",
    });
  });

  it("requires a timing-safe secret and explicit slug allowlist for Production", () => {
    const base = {
      writeMode: "production",
      vercelEnv: "production",
      configuredProxySecret: "a-secret-with-adequate-length",
      productionAllowedSlugs: "nia-web-night, another-event",
      resolvedSlug: "nia-web-night",
    };
    assert.equal(evaluateEditionRsvpWriteGate(base).allowed, false);
    assert.deepEqual(evaluateEditionRsvpWriteGate({ ...base, presentedProxySecret: "wrong" }), {
      allowed: false,
      mode: "production",
      reason: "proxy_secret_invalid",
    });
    assert.deepEqual(evaluateEditionRsvpWriteGate({ ...base, presentedProxySecret: base.configuredProxySecret }), {
      allowed: true,
      mode: "production",
    });
  });

  it("normalizes the Production slug allowlist", () => {
    assert.deepEqual(parseProductionAllowedSlugs(" NIA-WEB-NIGHT,  another-event "), [
      "nia-web-night",
      "another-event",
    ]);
  });
});
