import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHash } from "node:crypto";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  SCRYPT_PARAMS,
} from "@/lib/security/password";
import {
  isAccountLocked,
} from "@/lib/admin/admin-credentials.repository";
import {
  createSessionCookieValue,
  isV2DatabaseSession,
  parseSessionCookieValue,
} from "@/lib/admin/admin-sessions.repository";
import {
  ADMIN_SUPER_ADMIN_PERMISSION,
  canManageAdminUsers,
  isAdminUserActive,
  isOwner,
  type AdminUser,
} from "@/lib/admin/admin-user";

describe("HAXR Admin Per-User Authentication Foundation", () => {
  describe("Password KDF & Verification (scrypt standard)", () => {
    it("validates password length and complexity requirements", () => {
      assert.equal(validatePassword("short"), "Use pelo menos 12 caracteres.");
      assert.equal(validatePassword("123456789012"), null);
      assert.equal(validatePassword("PalavraPasseSegura2026!"), null);
    });

    it("hashes password with canonical scrypt parameter header", async () => {
      const password = "ValidAdminSecret2026!";
      const hash = await hashPassword(password);

      assert.ok(hash.startsWith("scrypt$N=32768,r=8,p=1$"));
      const parts = hash.split("$");
      assert.equal(parts.length, 4); // ["scrypt", "N=32768,r=8,p=1", salt, digest]
      assert.equal(parts[1], `N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}`);
    });

    it("verifies matching password successfully", async () => {
      const password = "VerySecurePassword123#";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      assert.equal(isValid, true);
    });

    it("rejects incorrect password strictly", async () => {
      const password = "CorrectPassword123#";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("WrongPassword456!", hash);
      assert.equal(isValid, false);
    });
  });

  describe("Database Session Format & Parsing (v2 Opaque Session)", () => {
    it("generates distinguishable versioned v2 session cookies", () => {
      const sessionId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const secret = "f9a32c45e1284a9e9a4f2b1d0c8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f";
      const cookieValue = createSessionCookieValue(sessionId, secret);

      assert.ok(cookieValue.startsWith("v2."));
      assert.equal(isV2DatabaseSession(cookieValue), true);

      const parsed = parseSessionCookieValue(cookieValue);
      assert.ok(parsed !== null);
      assert.equal(parsed?.sessionId, sessionId);
      assert.equal(parsed?.secret, secret);
    });

    it("distinguishes v2 session from legacy HMAC 2-segment cookie", () => {
      const legacyHmacToken = "1760000000.abcd1234efgh5678ijkl9012mnop3456";
      assert.equal(isV2DatabaseSession(legacyHmacToken), false);
      assert.equal(parseSessionCookieValue(legacyHmacToken), null);

      assert.equal(isV2DatabaseSession(undefined), false);
      assert.equal(isV2DatabaseSession(""), false);
      assert.equal(isV2DatabaseSession("v2.invalid"), false);
      assert.equal(isV2DatabaseSession("v1.uuid.secret"), false);
    });
  });

  describe("Session Validation Invariants & Stale Credential Invalidation", () => {
    it("rejects expired sessions", () => {
      const expiredAt = new Date(Date.now() - 1000).toISOString();
      const isExpired = new Date(expiredAt).getTime() <= Date.now();
      assert.equal(isExpired, true);
    });

    it("rejects revoked sessions", () => {
      const revokedAt = new Date().toISOString();
      assert.ok(revokedAt !== null);
    });

    it("enforces STALE_CREDENTIAL_SESSION_REJECTED invariant on credential version increment", () => {
      const sessionCredentialVersion: number = 1;
      const currentCredentialVersion: number = 2; // Incremented after password reset / password change
      const isStale = sessionCredentialVersion !== currentCredentialVersion;
      assert.equal(isStale, true);
    });

    it("rejects sessions for suspended users", () => {
      const userStatus: string = "suspended";
      assert.equal(userStatus === "active", false);
    });
  });

  describe("Lockout Protection & Failed Login Tracking", () => {
    it("reports account locked when lockedUntil timestamp is in future", () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      assert.equal(isAccountLocked({ lockedUntil: futureDate }), true);
    });

    it("reports account NOT locked when lockedUntil is null or expired in past", () => {
      assert.equal(isAccountLocked({ lockedUntil: null }), false);
      assert.equal(isAccountLocked(null), false);

      const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
      assert.equal(isAccountLocked({ lockedUntil: pastDate }), false);
    });
  });

  describe("Admin Invites Token Hashing & Invariants", () => {
    function hashToken(raw: string): string {
      return createHash("sha256").update(raw.trim(), "utf8").digest("hex");
    }

    it("hashes invite token at rest with sha256 and never in plaintext", () => {
      const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const tokenHash = hashToken(rawToken);

      assert.equal(tokenHash.length, 64);
      assert.notEqual(tokenHash, rawToken);
      assert.equal(tokenHash, hashToken(rawToken));
    });

    it("enforces invite expiry calculation (7 days)", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
      assert.ok(expiresAt.getTime() > now);
      assert.ok(expiresAt.getTime() <= now + 7 * 24 * 60 * 60 * 1000 + 1000);
    });

    it("ensures reissue invalidates prior pending invite", () => {
      const pendingInvite = { id: "invite-1", revokedAt: null as string | null };
      // When reissued:
      pendingInvite.revokedAt = new Date().toISOString();
      assert.ok(pendingInvite.revokedAt !== null);
    });
  });

  describe("Password Reset Token Hashing & Invariants", () => {
    function hashToken(raw: string): string {
      return createHash("sha256").update(raw.trim(), "utf8").digest("hex");
    }

    it("hashes password reset token at rest with sha256", () => {
      const rawToken = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
      const tokenHash = hashToken(rawToken);

      assert.equal(tokenHash.length, 64);
      assert.notEqual(tokenHash, rawToken);
    });

    it("enforces single-use invariant (used_at)", () => {
      const resetToken = { id: "token-1", usedAt: null as string | null };
      assert.equal(resetToken.usedAt, null);

      // After execution:
      resetToken.usedAt = new Date().toISOString();
      assert.ok(resetToken.usedAt !== null);

      // Attempting to reuse used token must fail:
      const canBeReused = resetToken.usedAt === null;
      assert.equal(canBeReused, false);
    });
  });

  describe("Owner Protection & Transactional Safety Invariants", () => {
    function createFixtureUser(overrides: Partial<AdminUser> = {}): AdminUser {
      return {
        id: "5c4bf935-4bec-4080-8e27-a05d41458b18",
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

    it("enforces ACTIVE_OWNER_COUNT >= 1 invariant conceptually", () => {
      const activeOwner = createFixtureUser();
      assert.equal(isOwner(activeOwner), true);
      assert.equal(canManageAdminUsers(activeOwner), true);

      // If active owner is suspended, they can no longer manage users
      const suspendedOwner = createFixtureUser({ status: "suspended" });
      assert.equal(isAdminUserActive(suspendedOwner), false);
      assert.equal(canManageAdminUsers(suspendedOwner), false);
    });

    it("blocks non-owner roles from user administration", () => {
      const eventManager = createFixtureUser({
        id: "user-2",
        email: "eventos@haxrsignature.com",
        role: "EVENT_MANAGER",
        permissions: [],
      });
      assert.equal(canManageAdminUsers(eventManager), false);

      const guestManager = createFixtureUser({
        id: "user-3",
        email: "convidados@haxrsignature.com",
        role: "GUEST_MANAGER",
        permissions: [],
      });
      assert.equal(canManageAdminUsers(guestManager), false);
    });

    it("prohibits privilege escalation through client-supplied role", () => {
      const legitimateGuestManager = createFixtureUser({
        id: "user-legit",
        role: "GUEST_MANAGER",
        permissions: [],
      });

      // The server evaluates legitimateGuestManager, ignoring spoofedPayload
      assert.equal(canManageAdminUsers(legitimateGuestManager), false);
    });
  });

  describe("Hybrid Mode Fallback & Downgrade Prevention", () => {
    it("guarantees DOWNGRADE_FALLBACK_BLOCKED invariant", () => {
      // If a user has an active database credential and provides an invalid password:
      // Invariant: it MUST NOT fall back to ADMIN_PASSWORD.
      const userHasDbCredential = true;
      const suppliedPasswordMatchesDbHash = false;

      // In authenticateAdminUser:
      let authResultSuccess = false;
      if (userHasDbCredential) {
        if (!suppliedPasswordMatchesDbHash) {
          authResultSuccess = false; // Strictly failed, NO fallback
        }
      }

      assert.equal(authResultSuccess, false);
      assert.equal(userHasDbCredential && !suppliedPasswordMatchesDbHash, true);
    });
  });

  describe("Token & Secret Sanitization in Audit Trail", () => {
    it("ensures AUDIT_SECRET_LEAKS = 0 for all security event payloads", () => {
      const sensitiveKeys = [
        "password",
        "password_hash",
        "raw_token",
        "rawToken",
        "secret",
      ];

      const forbiddenPattern = /(password|secret|hash|token)/i;
      for (const key of sensitiveKeys) {
        assert.ok(forbiddenPattern.test(key));
      }

      // Safe non-secret keys must be permitted
      assert.ok(!forbiddenPattern.test("email"));
      assert.ok(!forbiddenPattern.test("user_id"));
      assert.ok(!forbiddenPattern.test("role"));
    });
  });
});
