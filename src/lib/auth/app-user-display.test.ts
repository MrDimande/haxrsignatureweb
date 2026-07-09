import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAppUserDisplay,
  buildInitials,
  resolveAppRoleLabel,
} from "./app-user-display";

describe("app-user-display", () => {
  it("uses profile full_name and app_role when profile exists", () => {
    const display = buildAppUserDisplay({
      user: {
        email: "staging-a@haxrsignature.test",
        user_metadata: {},
      },
      profile: {
        full_name: "Staging A",
        app_role: "client",
      },
    });

    assert.equal(display.name, "Staging A");
    assert.equal(display.email, "staging-a@haxrsignature.test");
    assert.equal(display.roleLabel, "Cliente");
    assert.equal(display.initials, "SA");
  });

  it("falls back to email when profile is missing", () => {
    const display = buildAppUserDisplay({
      user: {
        email: "staging-a@haxrsignature.test",
        user_metadata: {},
      },
      profile: null,
    });

    assert.equal(display.name, "staging-a@haxrsignature.test");
    assert.equal(display.email, "staging-a@haxrsignature.test");
    assert.equal(display.roleLabel, "Cliente");
  });

  it("does not use the legacy client shell hardcoded name", () => {
    const display = buildAppUserDisplay({
      user: {
        email: "client@example.test",
        user_metadata: {},
      },
      profile: null,
    });

    assert.notEqual(display.name, "Equipa HAXR");
  });

  it("buildInitials handles names and emails", () => {
    assert.equal(buildInitials("Staging A"), "SA");
    assert.equal(buildInitials("client@example.test"), "CL");
  });

  it("resolveAppRoleLabel maps known roles and preserves custom roles", () => {
    assert.equal(resolveAppRoleLabel("client"), "Cliente");
    assert.equal(resolveAppRoleLabel("vip_client"), "vip_client");
  });
});
