import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EDITION_RSVP_WRITES_DISABLED_CODE,
  editionRsvpWritesDisabledResponse,
  evaluateEditionRsvpWriteGate,
  resolveEditionRsvpWriteMode,
} from "./write-gate";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const OTHER = "uxleigndoomoezwsxlan";

function cloneUrl(ref: string) {
  return `https://${ref}.supabase.co`;
}

describe("resolveEditionRsvpWriteMode", () => {
  it("defaults to disabled", () => {
    assert.equal(resolveEditionRsvpWriteMode(undefined), "disabled");
    assert.equal(resolveEditionRsvpWriteMode(""), "disabled");
    assert.equal(resolveEditionRsvpWriteMode("DISABLED"), "disabled");
  });

  it("accepts preview_clone", () => {
    assert.equal(resolveEditionRsvpWriteMode("preview_clone"), "preview_clone");
  });

  it("rejects unknown modes as unknown", () => {
    assert.equal(resolveEditionRsvpWriteMode("production"), "unknown");
    assert.equal(resolveEditionRsvpWriteMode("true"), "unknown");
  });
});

describe("evaluateEditionRsvpWriteGate", () => {
  it("blocks when mode is disabled (default)", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "disabled",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });
    assert.deepEqual(d, {
      allowed: false,
      mode: "disabled",
      reason: "mode_disabled",
    });
  });

  it("blocks unknown mode", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "open",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "mode_unknown");
  });

  it("blocks production runtime even if preview_clone", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "production",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "production_runtime");
  });

  it("requires VERCEL_ENV=preview for preview_clone", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "development",
      nodeEnv: "development",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "not_preview");
  });

  it("always rejects production supabase ref", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(PROD),
      allowedRef: PROD,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "production_ref");
  });

  it("blocks when allowed ref unset", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: "",
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "allowed_ref_unset");
  });

  it("blocks when url ref mismatches allowlist", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(OTHER),
      allowedRef: CLONE,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "ref_mismatch");
  });

  it("allows preview_clone with matching clone ref", () => {
    const d = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });
    assert.deepEqual(d, { allowed: true, mode: "preview_clone" });
  });

  it("block response never includes refs or secrets", () => {
    const body = editionRsvpWritesDisabledResponse();
    assert.equal(body.code, EDITION_RSVP_WRITES_DISABLED_CODE);
    assert.equal(body.success, false);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes(CLONE), false);
    assert.equal(serialized.includes(PROD), false);
    assert.equal(serialized.includes("service_role"), false);
  });
});
