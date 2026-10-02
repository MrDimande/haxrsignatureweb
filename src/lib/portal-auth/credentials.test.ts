import assert from "node:assert/strict";
import test from "node:test";
import {
  createPortalCookieValue,
  createPortalSecret,
  decidePortalLogin,
  hashPortalPassword,
  hashPortalSecret,
  parsePortalCookieValue,
  verifyPortalPassword,
} from "./credentials";
import { isPortalEventMembership } from "./portal-auth.server";

test("portal password hashing uses a unique salted verifier", async () => {
  const first = await hashPortalPassword("correct-horse-battery-staple");
  const second = await hashPortalPassword("correct-horse-battery-staple");
  assert.notEqual(first, second);
  assert.equal(await verifyPortalPassword("correct-horse-battery-staple", first), true);
  assert.equal(await verifyPortalPassword("incorrect-password", first), false);
});

test("portal secrets are opaque, hashable, and cookie parsing rejects malformed values", () => {
  const secret = createPortalSecret();
  assert.equal(hashPortalSecret(secret).length, 64);
  const value = createPortalCookieValue("123e4567-e89b-42d3-a456-426614174000", secret);
  assert.deepEqual(parsePortalCookieValue(value), { sessionId: "123e4567-e89b-42d3-a456-426614174000", secret });
  assert.equal(parsePortalCookieValue("spoofed"), null);
});

test("pending and suspended accounts are never authenticated", () => {
  assert.equal(decidePortalLogin({ account: { status: "PENDING_ACTIVATION", password_hash: "hash" }, passwordMatches: true }).kind, "activation_required");
  assert.equal(decidePortalLogin({ account: { status: "SUSPENDED", password_hash: "hash" }, passwordMatches: true }).kind, "denied");
  assert.equal(decidePortalLogin({ account: { status: "ACTIVE", password_hash: "hash" }, passwordMatches: false }).kind, "denied");
});

test("event authorization derives from the bound profile, never a browser role", () => {
  assert.equal(isPortalEventMembership({ profileId: "profile-a", ownerProfileId: "profile-a", memberProfileIds: [] }), true);
  assert.equal(isPortalEventMembership({ profileId: "profile-b", ownerProfileId: "profile-a", memberProfileIds: ["profile-c"] }), false);
});
