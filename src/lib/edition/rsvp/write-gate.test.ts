import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EDITION_RSVP_WRITES_DISABLED_CODE,
  editionRsvpWritesDisabledResponse,
  evaluateEditionRsvpWriteGate,
  parseProductionAllowedSlugs,
  resolveEditionRsvpWriteMode,
} from "./write-gate";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const OTHER = "uxleigndoomoezwsxlan";
const FAKE_SECRET = "test-proxy-secret-value-not-real";
const FAKE_SECRET_OTHER = "different-proxy-secret-value";

function cloneUrl(ref: string) {
  return `https://${ref}.supabase.co`;
}

function productionBase(
  overrides: Parameters<typeof evaluateEditionRsvpWriteGate>[0] = {}
) {
  return evaluateEditionRsvpWriteGate({
    writeMode: "production",
    vercelEnv: "production",
    configuredProxySecret: FAKE_SECRET,
    presentedProxySecret: FAKE_SECRET,
    productionAllowedSlugs: "nianwebnight",
    resolvedSlug: "nianwebnight",
    ...overrides,
  });
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

  it("accepts production", () => {
    assert.equal(resolveEditionRsvpWriteMode("production"), "production");
    assert.equal(resolveEditionRsvpWriteMode("PRODUCTION"), "production");
  });

  it("rejects unknown modes as unknown", () => {
    assert.equal(resolveEditionRsvpWriteMode("open"), "unknown");
    assert.equal(resolveEditionRsvpWriteMode("true"), "unknown");
  });
});

describe("parseProductionAllowedSlugs", () => {
  it("returns empty for unset or blank", () => {
    assert.deepEqual(parseProductionAllowedSlugs(undefined), []);
    assert.deepEqual(parseProductionAllowedSlugs(""), []);
    assert.deepEqual(parseProductionAllowedSlugs("   "), []);
  });

  it("normalizes spaces and case", () => {
    assert.deepEqual(parseProductionAllowedSlugs(" nianwebnight , Stanturns5 "), [
      "nianwebnight",
      "stanturns5",
    ]);
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
    assert.equal(serialized.includes(FAKE_SECRET), false);
  });
});

describe("evaluateEditionRsvpWriteGate production mode", () => {
  it("denies production mode on Preview", () => {
    const d = productionBase({ vercelEnv: "preview" });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "not_production");
  });

  it("denies production mode on Development", () => {
    const d = productionBase({ vercelEnv: "development", nodeEnv: "development" });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "not_production");
  });

  it("denies when proxy secret is unset", () => {
    const d = productionBase({ configuredProxySecret: "" });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "proxy_secret_unset");
  });

  it("denies when presented proxy secret is missing", () => {
    const d = productionBase({ presentedProxySecret: "" });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "proxy_secret_missing");
  });

  it("denies when presented proxy secret is incorrect", () => {
    const d = productionBase({ presentedProxySecret: FAKE_SECRET_OTHER });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "proxy_secret_invalid");
  });

  it("denies when production allowlist is unset", () => {
    const d = productionBase({ productionAllowedSlugs: undefined });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "production_allowlist_unset");
  });

  it("denies when production allowlist is empty after normalize", () => {
    const d = productionBase({ productionAllowedSlugs: "  ,  ," });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "production_allowlist_unset");
  });

  it("denies when resolved slug is missing", () => {
    const d = productionBase({ resolvedSlug: null });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.reason, "production_slug_required");
  });

  it("denies slug outside production allowlist", () => {
    const d = productionBase({ resolvedSlug: "stanturns5" });
    assert.equal(d.allowed, false);
    if (!d.allowed) {
      assert.equal(d.reason, "production_slug_denied");
      assert.equal(d.mode, "production");
    }
  });

  it("allows canonical nianwebnight when allowlisted", () => {
    const d = productionBase({ resolvedSlug: "nianwebnight" });
    assert.deepEqual(d, { allowed: true, mode: "production" });
  });

  it("allows resolved alias target nianwebnight (caller resolves nian → nianwebnight)", () => {
    // Simulate route/service already resolving payload "nian" → "nianwebnight"
    const d = productionBase({ resolvedSlug: "nianwebnight" });
    assert.equal(d.allowed, true);
    if (d.allowed) assert.equal(d.mode, "production");
  });

  it("keeps other valid invites blocked when not allowlisted", () => {
    for (const slug of [
      "stanturns5",
      "jessicakulaya",
      "jessicachadelingerie",
      "jessica-samuel-wedding",
    ]) {
      const d = productionBase({ resolvedSlug: slug });
      assert.equal(d.allowed, false, slug);
      if (!d.allowed) assert.equal(d.reason, "production_slug_denied", slug);
    }
  });

  it("decision and disabled response never expose secrets", () => {
    const denied = productionBase({ presentedProxySecret: FAKE_SECRET_OTHER });
    const allowed = productionBase();
    const body = editionRsvpWritesDisabledResponse();
    const blob = JSON.stringify({ denied, allowed, body });
    assert.equal(blob.includes(FAKE_SECRET), false);
    assert.equal(blob.includes(FAKE_SECRET_OTHER), false);
  });
});
