import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AYLLA_GIFTS_CONFIG, canBabyAyllaGiftRegistryReserve } from "../config";
import { createCoreAyllaGiftService, canTransitionAyllaGiftReservation } from "../service";
import { createInMemoryAyllaGiftStore } from "../store";
import type {
  CoreGuestRecord,
  CoreGiftInventoryRecord,
  CoreAdminSession,
} from "../types";

const TEST_EVENT_ID = AYLLA_GIFTS_CONFIG.eventId;
const TEST_PEPPER = "test-secret-pepper-32-bytes-minimum-length-123456";

function makeEligibleGuest(overrides: Partial<CoreGuestRecord> = {}): CoreGuestRecord {
  return {
    id: "guest-aylla-1",
    eventId: TEST_EVENT_ID,
    name: "Tia Rosa",
    contact: "+258841234567",
    status: "confirmed",
    source: "edition_rsvp",
    archived: false,
    deleted: false,
    incorrect: false,
    ...overrides,
  };
}

function makeInventoryItem(overrides: Partial<CoreGiftInventoryRecord> = {}): CoreGiftInventoryRecord {
  return {
    eventId: TEST_EVENT_ID,
    registryKey: "baby-aylla-couture",
    itemId: "dior-dress-silk-rose",
    familyApproved: true,
    enabled: true,
    approvedQuantity: 1,
    specificationsComplete: true,
    childSafetyValidated: true,
    ...overrides,
  };
}

describe("HAXR Core — Baby Aylla Gift Registry (Phase C.3.1)", () => {
  it("enforces fail-closed catalog lock: AYLLA_GIFTS_CONFIG.enabled is false", () => {
    assert.equal(AYLLA_GIFTS_CONFIG.enabled, false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "active" }), false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "draft" }), false);
  });

  it("handles anti-enumeration: returns verification_pending for unknown contacts", async () => {
    const store = createInMemoryAyllaGiftStore();
    const service = createCoreAyllaGiftService({ store, pepper: TEST_PEPPER });

    const result = await service.requestVerification("+258849999999", "127.0.0.1");
    assert.equal(result.outcome, "verification_pending");
  });

  it("completes full verification lifecycle: request -> verify -> session issuance", async () => {
    const guest = makeEligibleGuest();
    let sentCode = "";
    let sentTo = "";

    const store = createInMemoryAyllaGiftStore({
      guests: [guest],
      inventory: [makeInventoryItem()],
    });

    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      deliveryProvider: {
        async sendVerificationCode(contact, code) {
          sentTo = contact;
          sentCode = code;
          return true;
        },
      },
    });

    const reqResult = await service.requestVerification(guest.contact, "127.0.0.1");
    assert.equal(reqResult.outcome, "verification_pending");
    assert.equal(sentTo, guest.contact);
    assert.ok(sentCode.length > 0);

    const verified = await service.verifyChallenge(reqResult.challengeId, sentCode, "127.0.0.1");
    assert.equal(verified.outcome, "verified");
    if (verified.outcome !== "verified") throw new Error("Expected verified");

    const resolved = await service.resolveSession(verified.sessionToken);
    assert.equal(resolved.valid, true);

    const fixedNow = new Date("2027-01-20T10:00:00Z");
    const testService = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      now: () => fixedNow,
      tokenGenerator: () => "mocked-code-123456",
    });

    const deterministicChallenge = await testService.requestVerification(guest.contact, "127.0.0.1");
    assert.equal(deterministicChallenge.outcome, "verification_pending");

    const directChallengeId = "challenge-test-uuid";
    await store.createChallenge({
      id: directChallengeId,
      eventId: guest.eventId,
      guestId: guest.id,
      verifierHash: "a".repeat(43),
      expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
      attempts: 0,
      maxAttempts: 5,
      consumedAt: null,
      createdAt: fixedNow,
    });
    const storedDirect = await store.getChallenge(directChallengeId);
    assert.equal(storedDirect?.id, directChallengeId);
  });

  it("issues and resolves guest session for confirmed RSVP guest", async () => {
    const guest = makeEligibleGuest();
    const store = createInMemoryAyllaGiftStore({ guests: [guest] });
    const fixedTime = new Date("2027-01-20T12:00:00Z");

    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      now: () => fixedTime,
      tokenGenerator: () => "code-secret-42",
    });

    // Request verification
    await service.requestVerification(guest.contact, "127.0.0.1");

    // Manually add challenge to verify exact code
    const challengeId = "challenge-roundtrip";
    const verifierHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update("code-secret-42").digest("base64url");
    await store.createChallenge({
      id: challengeId,
      eventId: guest.eventId,
      guestId: guest.id,
      verifierHash,
      expiresAt: new Date(fixedTime.getTime() + 10 * 60 * 1000),
      attempts: 0,
      maxAttempts: 5,
      consumedAt: null,
      createdAt: fixedTime,
    });

    const verifyResult = await service.verifyChallenge(challengeId, "code-secret-42", "127.0.0.1");
    assert.equal(verifyResult.outcome, "verified");
    if (verifyResult.outcome !== "verified") throw new Error("Expected verified");

    assert.ok(verifyResult.sessionToken.includes("."));

    // Resolve session
    const resolved = await service.resolveSession(verifyResult.sessionToken);
    assert.equal(resolved.valid, true);
    if (!resolved.valid) throw new Error("Expected valid");
    assert.equal(resolved.guest.id, guest.id);
    assert.equal(resolved.guest.name, "Tia Rosa");

    // Revoke session
    const revoked = await service.revokeSession(verifyResult.sessionToken);
    assert.equal(revoked, true);

    const reResolved = await service.resolveSession(verifyResult.sessionToken);
    assert.equal(reResolved.valid, false);
    if (reResolved.valid) throw new Error("Expected invalid");
    assert.equal(reResolved.reason, "session_expired");
  });

  it("rejects ineligible guest even with valid session token", async () => {
    const ineligibleGuest = makeEligibleGuest({ status: "declined" });
    const store = createInMemoryAyllaGiftStore({ guests: [ineligibleGuest] });
    const fixedTime = new Date("2027-01-20T12:00:00Z");

    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      now: () => fixedTime,
    });

    // Directly seed active session
    const sessionId = "session-ineligible";
    const secret = "secret-token-123";
    const secretHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update(secret).digest("base64url");
    await store.createSession({
      id: sessionId,
      eventId: ineligibleGuest.eventId,
      guestId: ineligibleGuest.id,
      secretHash,
      expiresAt: new Date(fixedTime.getTime() + 20 * 60 * 1000),
      revokedAt: null,
      createdAt: fixedTime,
    });

    const resolved = await service.resolveSession(`${sessionId}.${secret}`);
    assert.equal(resolved.valid, false);
    if (resolved.valid) throw new Error("Expected invalid");
    assert.equal(resolved.reason, "access_denied");
  });

  it("blocks reservation when catalog is disabled (fail-closed authority)", async () => {
    const guest = makeEligibleGuest();
    const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [makeInventoryItem()] });
    const fixedTime = new Date("2027-01-20T12:00:00Z");

    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      now: () => fixedTime,
    });

    const sessionId = "session-active";
    const secret = "secret-token-456";
    const secretHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update(secret).digest("base64url");
    await store.createSession({
      id: sessionId,
      eventId: guest.eventId,
      guestId: guest.id,
      secretHash,
      expiresAt: new Date(fixedTime.getTime() + 20 * 60 * 1000),
      revokedAt: null,
      createdAt: fixedTime,
    });

    const res = await service.reserveGift({
      sessionToken: `${sessionId}.${secret}`,
      itemId: "dior-dress-silk-rose",
      quantity: 1,
      idempotencyKey: "idem-key-1",
    });

    assert.equal(res.outcome, "registry_closed");
  });

  it("enforces admin state machine transitions strictly", async () => {
    const store = createInMemoryAyllaGiftStore();
    const service = createCoreAyllaGiftService({ store, pepper: TEST_PEPPER });

    assert.equal(canTransitionAyllaGiftReservation("reserved", "purchased"), true);
    assert.equal(canTransitionAyllaGiftReservation("reserved", "cancelled"), true);
    assert.equal(canTransitionAyllaGiftReservation("purchased", "delivered"), true);
    assert.equal(canTransitionAyllaGiftReservation("reserved", "delivered"), false);
    assert.equal(canTransitionAyllaGiftReservation("cancelled", "reserved"), false);
    assert.equal(canTransitionAyllaGiftReservation("delivered", "cancelled"), false);

    const validAdmin: CoreAdminSession = {
      id: "admin-1",
      active: true,
      permittedEventIds: [TEST_EVENT_ID],
    };
    const unauthorizedAdmin: CoreAdminSession = {
      id: "admin-2",
      active: true,
      permittedEventIds: ["other-event-id"],
    };

    // Attempt transition with valid admin on missing reservation
    const missing = await service.adminTransition(validAdmin, TEST_EVENT_ID, "res-1", "purchased");
    assert.equal(missing.ok, false);
    if (missing.ok) throw new Error("Expected reservation_not_found");
    assert.equal(missing.reason, "reservation_not_found");

    // Attempt transition with unauthorized admin
    const denied = await service.adminTransition(unauthorizedAdmin, TEST_EVENT_ID, "res-1", "purchased");
    assert.equal(denied.ok, false);
    if (denied.ok) throw new Error("Expected denied");
    assert.equal(denied.reason, "access_denied");
  });
});
