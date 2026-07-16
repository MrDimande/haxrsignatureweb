import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SUPABASE_PRODUCTION_PROJECT_REF,
  SUPABASE_STAGING_PROJECT_REF,
  validateSupabaseRuntimeEnvironment,
} from "@/lib/supabase/config";

describe("validateSupabaseRuntimeEnvironment", () => {
  it("blocks preview/development when project ref is production", () => {
    const result = validateSupabaseRuntimeEnvironment({
      vercelEnv: "preview",
      projectRef: SUPABASE_PRODUCTION_PROJECT_REF,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /Production/i);
    }
  });

  it("allows preview when project ref is staging", () => {
    const result = validateSupabaseRuntimeEnvironment({
      vercelEnv: "preview",
      projectRef: SUPABASE_STAGING_PROJECT_REF,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.projectRef, SUPABASE_STAGING_PROJECT_REF);
    }
  });

  it("blocks production deploy when project ref is not production", () => {
    const result = validateSupabaseRuntimeEnvironment({
      vercelEnv: "production",
      projectRef: SUPABASE_STAGING_PROJECT_REF,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /Production exige/i);
    }
  });

  it("allows production deploy with production project ref", () => {
    const result = validateSupabaseRuntimeEnvironment({
      vercelEnv: "production",
      projectRef: SUPABASE_PRODUCTION_PROJECT_REF,
    });
    assert.equal(result.ok, true);
  });

  it("fails closed when project ref is missing", () => {
    const result = validateSupabaseRuntimeEnvironment({
      vercelEnv: "preview",
      projectRef: null,
    });
    assert.equal(result.ok, false);
  });
});
