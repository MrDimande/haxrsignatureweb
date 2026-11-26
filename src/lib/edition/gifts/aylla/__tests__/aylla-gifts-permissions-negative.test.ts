import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AYLLA_GIFT_RUNTIME_ROLE,
  validateAyllaGiftDatabaseEnvironment,
} from "@/lib/neon/aylla-gift-config";
import { assertRuntimeIdentity } from "@/lib/neon/aylla-gift-db";
import { AYLLA_GIFTS_CONFIG } from "../config";
import { createCoreAyllaGiftService } from "../service";
import { createInMemoryAyllaGiftStore, createNeonAyllaGiftStore } from "../store";
import type { CoreAdminSession, CoreGuestRecord, CoreGiftInventoryRecord } from "../types";

const TEST_EVENT_ID = AYLLA_GIFTS_CONFIG.eventId;
const TEST_PEPPER = "test-secret-pepper-32-bytes-minimum-length-123456";

describe("Baby Aylla Gift Registry — Negative Security & Direct Write Elimination", () => {
  describe("Neon Store direct table mutation lockout", () => {
    const neonStore = createNeonAyllaGiftStore();

    it("rejects direct reservation insertion (createReservation)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.createReservation({
            id: "fake-res-id",
            eventId: TEST_EVENT_ID,
            giftId: "dior-dress-silk-rose",
            guestId: "fake-guest-id",
            quantity: 1,
            status: "reserved",
            idempotencyKey: "fake-key",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        },
        /Direct reservation creation is forbidden; use reserveVerified RPC\./
      );
    });

    it("rejects direct reservation status update (updateReservationStatus)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.updateReservationStatus("fake-res-id", "purchased", new Date());
        },
        /Direct reservation status update is forbidden; use transitionAdminVerified RPC\./
      );
    });

    it("rejects direct audit record insertion (createAuditRecord)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.createAuditRecord({
            id: "fake-audit-id",
            reservationId: "fake-res-id",
            eventId: TEST_EVENT_ID,
            actorGuestId: null,
            actorAdminId: "fake-admin-id",
            action: "purchased",
            previousStatus: "reserved",
            nextStatus: "purchased",
            reason: null,
            createdAt: new Date(),
          });
        },
        /Direct audit record creation is forbidden; audit records are written by verified RPCs\./
      );
    });

    it("rejects direct challenge SELECT (getChallenge)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.getChallenge("00000000-0000-0000-0000-000000000000");
        },
        /Direct challenge query is forbidden; use verifyAndConsumeChallenge RPC\./
      );
    });

    it("rejects direct session SELECT (getSession)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.getSession("00000000-0000-0000-0000-000000000000");
        },
        /Direct session query is forbidden; use resolveSessionVerified RPC\./
      );
    });

    it("rejects isolated challenge attempt increment (incrementChallengeAttempts)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.incrementChallengeAttempts("00000000-0000-0000-0000-000000000000");
        },
        /Direct challenge attempt increment is forbidden; use verifyAndConsumeChallenge RPC\./
      );
    });

    it("rejects admin transition on guest runtime store (transitionAdminVerified)", async () => {
      await assert.rejects(
        async () => {
          await neonStore.transitionAdminVerified!({
            eventId: TEST_EVENT_ID,
            reservationId: "00000000-0000-0000-0000-000000000000",
            adminId: "00000000-0000-0000-0000-000000000000",
            nextStatus: "purchased",
          });
        },
        /Administrative transitions are strictly forbidden on guest runtime connection; use dedicated admin identity haxr_aylla_gift_admin\./
      );
    });
  });

  describe("assertRuntimeIdentity fail-closed perimeter checks", () => {
    function makeMockClient(overrides: Partial<{
      current_user: string;
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolcreaterole: boolean;
      rolcreatedb: boolean;
      rolbypassrls: boolean;
    }> = {}): Parameters<typeof assertRuntimeIdentity>[0] {
      const query = async () => ({
        rows: [
          {
            current_user: AYLLA_GIFT_RUNTIME_ROLE,
            rolcanlogin: true,
            rolsuper: false,
            rolcreaterole: false,
            rolcreatedb: false,
            rolbypassrls: false,
            ...overrides,
          },
        ],
      });
      return {
        query: query as unknown as Parameters<typeof assertRuntimeIdentity>[0]["query"],
      };
    }

    it("rejects connection when role is elevated to superuser", async () => {
      const client = makeMockClient({ rolsuper: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has bypassrls privilege", async () => {
      const client = makeMockClient({ rolbypassrls: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has createrole privilege", async () => {
      const client = makeMockClient({ rolcreaterole: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has createdb privilege", async () => {
      const client = makeMockClient({ rolcreatedb: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role cannot login", async () => {
      const client = makeMockClient({ rolcanlogin: false });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when effective user switches dynamically", async () => {
      const client = makeMockClient({ current_user: "postgres" });
      await assert.rejects(
        () => assertRuntimeIdentity(client),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });
  });

  describe("RPC isolation & state machine barrier", () => {
    const guest: CoreGuestRecord = {
      id: "guest-test-1",
      eventId: TEST_EVENT_ID,
      name: "Tia Rosa",
      contact: "+258841234567",
      status: "confirmed",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };

    const item: CoreGiftInventoryRecord = {
      eventId: TEST_EVENT_ID,
      registryKey: "baby-aylla-couture",
      itemId: "dior-dress-silk-rose",
      familyApproved: true,
      enabled: true,
      approvedQuantity: 1,
      specificationsComplete: true,
      childSafetyValidated: true,
    };

    it("rejects resolution of forged session token", async () => {
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });
      const service = createCoreAyllaGiftService({ store, pepper: TEST_PEPPER });

      const res = await service.resolveSession("forged-session-id.forged-secret");
      assert.equal(res.valid, false);
      if (res.valid) throw new Error("Expected invalid");
      assert.equal(res.reason, "session_expired");
    });

    it("rejects resolution when session has been revoked", async () => {
      const fixedTime = new Date("2027-01-20T10:00:00Z");
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });
      const service = createCoreAyllaGiftService({
        store,
        pepper: TEST_PEPPER,
        now: () => fixedTime,
      });

      const sessionId = "session-revoked-test";
      const secret = "secret-123";
      const secretHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update(secret).digest("base64url");
      await store.createSession({
        id: sessionId,
        eventId: guest.eventId,
        guestId: guest.id,
        secretHash,
        expiresAt: new Date(fixedTime.getTime() + 600000),
        revokedAt: new Date(fixedTime.getTime() - 1000), // already revoked
        createdAt: fixedTime,
      });

      const res = await service.resolveSession(`${sessionId}.${secret}`);
      assert.equal(res.valid, false);
      if (res.valid) throw new Error("Expected invalid");
      assert.equal(res.reason, "session_expired");
    });

    it("enforces fail-closed catalog lock: reserveGift returns registry_closed before session checks", async () => {
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });
      const service = createCoreAyllaGiftService({ store, pepper: TEST_PEPPER });

      const res = await service.reserveGift({
        sessionToken: "any-token.any-secret",
        itemId: item.itemId,
        quantity: 1,
        idempotencyKey: "idem-lock-1",
      });

      assert.equal(res.outcome, "registry_closed");
    });

    it("rejects direct reserveVerified RPC invocation when session is forged", async () => {
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });

      await assert.rejects(
        () =>
          store.reserveVerified({
            sessionId: "00000000-0000-0000-0000-000000000000",
            secretHash: "invalid-hash",
            itemId: item.itemId,
            quantity: 1,
            idempotencyKey: "idem-forged-1",
          }),
        /verified guest session required/
      );
    });

    it("rejects invalid status transitions in adminTransition", async () => {
      const store = createInMemoryAyllaGiftStore({
        reservations: [
          {
            id: "res-test-1",
            eventId: TEST_EVENT_ID,
            giftId: item.itemId,
            guestId: guest.id,
            quantity: 1,
            status: "reserved",
            idempotencyKey: "idem-3",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      const service = createCoreAyllaGiftService({ store, pepper: TEST_PEPPER });

      const admin: CoreAdminSession = {
        id: "admin-1",
        active: true,
        permittedEventIds: [TEST_EVENT_ID],
      };

      // Invalid transition: reserved -> delivered directly (must go reserved -> purchased -> delivered)
      const invalidTransition = await service.adminTransition(admin, TEST_EVENT_ID, "res-test-1", "delivered");
      assert.equal(invalidTransition.ok, false);
      if (invalidTransition.ok) throw new Error("Expected fail");
      assert.equal(invalidTransition.reason, "invalid_transition");
    });
    it("rejects session issuance without consumed challenge or when replayed (SEC-C3-P2-A)", async () => {
      const fixedTime = new Date("2027-01-20T10:00:00Z");
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });

      const challengeId = "challenge-bind-test";
      await store.createChallenge({
        id: challengeId,
        eventId: guest.eventId,
        guestId: guest.id,
        verifierHash: "hash-test",
        expiresAt: new Date(fixedTime.getTime() + 600000),
        attempts: 0,
        maxAttempts: 5,
        consumedAt: null, // NOT consumed yet!
        createdAt: fixedTime,
      });

      // Attempt session creation before challenge consumption -> must reject
      await assert.rejects(
        () =>
          store.createSession({
            id: "session-unconsumed-challenge",
            eventId: guest.eventId,
            guestId: guest.id,
            secretHash: "secret-hash",
            challengeId,
            expiresAt: new Date(fixedTime.getTime() + 1200000),
            revokedAt: null,
            createdAt: fixedTime,
          }),
        /challenge must be consumed before issuing session/
      );

      // Now consume challenge
      await store.consumeChallenge(challengeId, fixedTime);

      // Successfully issue first session
      await store.createSession({
        id: "session-valid-challenge",
        eventId: guest.eventId,
        guestId: guest.id,
        secretHash: "secret-hash",
        challengeId,
        expiresAt: new Date(fixedTime.getTime() + 1200000),
        revokedAt: null,
        createdAt: fixedTime,
      });

      // Attempt replay of the same challenge for another session -> must reject (single-use invariant)
      await assert.rejects(
        () =>
          store.createSession({
            id: "session-replay-challenge",
            eventId: guest.eventId,
            guestId: guest.id,
            secretHash: "secret-hash-2",
            challengeId,
            expiresAt: new Date(fixedTime.getTime() + 1200000),
            revokedAt: null,
            createdAt: fixedTime,
          }),
        /challenge already used to issue session/
      );

      // Attempt session issuance when challenge consumed > 120s ago -> must reject
      const expiredChallengeId = "challenge-expired-window";
      const oldTime = new Date(fixedTime.getTime() - 130000); // 130 seconds ago (> 120s)
      await store.createChallenge({
        id: expiredChallengeId,
        eventId: guest.eventId,
        guestId: guest.id,
        verifierHash: "hash-test-2",
        expiresAt: new Date(fixedTime.getTime() + 600000),
        attempts: 0,
        maxAttempts: 5,
        consumedAt: oldTime,
        createdAt: oldTime,
      });

      await assert.rejects(
        () =>
          store.createSession({
            id: "session-window-expired",
            eventId: guest.eventId,
            guestId: guest.id,
            secretHash: "secret-hash-3",
            challengeId: expiredChallengeId,
            expiresAt: new Date(fixedTime.getTime() + 1200000),
            revokedAt: null,
            createdAt: fixedTime,
          }),
        /challenge consumption expired for session issuance \(exceeded 120s\)/
      );
    });

    it("rejects hash-as-password reuse: presenting stored hash fails authentication (SEC-C3-P1-A)", async () => {
      const fixedTime = new Date("2027-01-20T10:00:00Z");
      const store = createInMemoryAyllaGiftStore({ guests: [guest], inventory: [item] });
      const service = createCoreAyllaGiftService({
        store,
        pepper: TEST_PEPPER,
        now: () => fixedTime,
      });

      const secretProof = "actual-guest-secret-proof";
      const secretHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update(secretProof).digest("base64url");
      const sessionId = "session-double-hash-test";

      await store.createSession({
        id: sessionId,
        eventId: guest.eventId,
        guestId: guest.id,
        secretHash,
        expiresAt: new Date(fixedTime.getTime() + 600000),
        revokedAt: null,
        createdAt: fixedTime,
      });

      // Legitimate guest presentation: token contains actual secret proof
      const validToken = `${sessionId}.${secretProof}`;
      const legitimate = await service.resolveSession(validToken);
      assert.equal(legitimate.valid, true);

      // Attacker presentation: attacker somehow read `secretHash` and presents it directly as if it were the secret proof
      // In a single-hashed model, this would succeed. In double-hashed / HMAC verifier model, it MUST fail!
      const attackerToken = `${sessionId}.${secretHash}`;
      const attacker = await service.resolveSession(attackerToken);
      assert.equal(attacker.valid, false);
      if (attacker.valid) throw new Error("Attacker token should have been rejected");
      assert.equal(attacker.reason, "session_expired");
    });
  });

  describe("Dual dedicated connections and environment validation (C.3.2)", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("fails when HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL is missing", () => {
      delete process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL;
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:pass@host/db";
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, false);
      if (check.ok) throw new Error("Expected fail");
      assert.match(check.message, /HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL não configurada/);
    });

    it("fails when HAXR_AYLLA_GIFT_DATABASE_URL is missing", () => {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:pass@host/db";
      delete process.env.HAXR_AYLLA_GIFT_DATABASE_URL;
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, false);
      if (check.ok) throw new Error("Expected fail");
      assert.match(check.message, /HAXR_AYLLA_GIFT_DATABASE_URL não configurada/);
    });

    it("fails when issuer connection uses wrong PostgreSQL role", () => {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxrweb_runtime:pass@host/db";
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:pass@host/db";
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, false);
      if (check.ok) throw new Error("Expected fail");
      assert.match(check.message, /requer a identidade haxr_aylla_gift_issuer/);
    });

    it("fails when runtime connection uses wrong PostgreSQL role", () => {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:pass@host/db";
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://neondb_owner:pass@host/db";
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, false);
      if (check.ok) throw new Error("Expected fail");
      assert.match(check.message, /requer a identidade haxr_aylla_gift_runtime/);
    });

    it("rejects configuration when issuer and runtime point to identical connection strings", () => {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:pass@host/db";
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:pass@host/db";
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, false);
      if (check.ok) throw new Error("Expected fail");
      assert.match(check.message, /requer a identidade haxr_aylla_gift_runtime/);
    });

    it("succeeds when issuer and runtime are properly segregated with their dedicated roles", () => {
      process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:secret1@host/db";
      process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:secret2@host/db";
      const check = validateAyllaGiftDatabaseEnvironment();
      assert.equal(check.ok, true);
      if (!check.ok) throw new Error("Expected ok");
      assert.equal(check.issuerDatabaseUrl, "postgresql://haxr_aylla_gift_issuer:secret1@host/db");
      assert.equal(check.runtimeDatabaseUrl, "postgresql://haxr_aylla_gift_runtime:secret2@host/db");
    });
  });

  describe("Cross-guest challenge binding and single-use invariants (C.3.2)", () => {
    const guestA: CoreGuestRecord = {
      id: "guest-aylla-A",
      eventId: TEST_EVENT_ID,
      name: "Tia Rosa",
      contact: "+258841111111",
      status: "confirmed",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };
    const guestB: CoreGuestRecord = {
      id: "guest-aylla-B",
      eventId: TEST_EVENT_ID,
      name: "Tio Carlos",
      contact: "+258842222222",
      status: "confirmed",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };

    it("rejects issuing session when challenge belongs to a different guest (cross-guest binding)", async () => {
      const fixedTime = new Date("2027-01-20T10:00:00Z");
      const store = createInMemoryAyllaGiftStore({ guests: [guestA, guestB] });

      const challengeId = "challenge-cross-guest";
      await store.createChallenge({
        id: challengeId,
        eventId: guestA.eventId,
        guestId: guestA.id, // Issued for Guest A
        verifierHash: "hash-test-cross",
        expiresAt: new Date(fixedTime.getTime() + 600000),
        attempts: 0,
        maxAttempts: 5,
        consumedAt: fixedTime, // Consumed
        createdAt: fixedTime,
      });

      // Attempt to issue session for Guest B using Guest A's consumed challenge -> MUST REJECT!
      await assert.rejects(
        () =>
          store.createSession({
            id: "session-cross-guest-steal",
            eventId: guestB.eventId,
            guestId: guestB.id, // Guest B attempting to use Guest A's challenge
            secretHash: "secret-hash-stolen",
            challengeId,
            expiresAt: new Date(fixedTime.getTime() + 1200000),
            revokedAt: null,
            createdAt: fixedTime,
          }),
        /cannot issue session: challenge guest and event must match session/
      );
    });
  });
});
