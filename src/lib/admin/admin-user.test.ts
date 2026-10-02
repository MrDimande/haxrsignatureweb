import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_SUPER_ADMIN_PERMISSION,
  canManageAdminUsers,
  getAdminInitials,
  getAdminRoleLabel,
  isAdminUserActive,
  isOwner,
  normalizeAdminEmail,
  type AdminUser,
} from "./admin-user";

function createUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "owner-id",
    name: "Alberto Dimande",
    email: "dimande@haxrsignature.com",
    role: "OWNER",
    permissions: [ADMIN_SUPER_ADMIN_PERMISSION],
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    lastLoginAt: null,
    ...overrides,
  };
}

describe("admin-user", () => {
  it("normalizes the unique login email consistently", () => {
    assert.equal(
      normalizeAdminEmail("  DIMANDE@HAXRSIGNATURE.COM "),
      "dimande@haxrsignature.com",
    );
  });

  it("allows user management only to an active OWNER with SUPER_ADMIN", () => {
    assert.equal(canManageAdminUsers(createUser()), true);
    assert.equal(canManageAdminUsers(createUser({ permissions: [] })), false);
    assert.equal(canManageAdminUsers(createUser({ role: "ADMIN" })), false);
    assert.equal(canManageAdminUsers(createUser({ status: "suspended" })), false);
  });

  it("does not treat suspended accounts as owners or active sessions", () => {
    const suspendedOwner = createUser({ status: "suspended" });
    assert.equal(isAdminUserActive(suspendedOwner), false);
    assert.equal(isOwner(suspendedOwner), false);
  });

  it("derives the HAXR avatar initials from persisted profile data", () => {
    assert.equal(getAdminInitials(createUser()), "AD");
    assert.equal(getAdminRoleLabel("OWNER"), "Proprietário");
  });
});
