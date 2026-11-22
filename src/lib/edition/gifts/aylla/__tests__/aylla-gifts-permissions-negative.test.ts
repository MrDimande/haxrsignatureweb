import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AYLLA_GIFT_RUNTIME_ROLE } from "@/lib/neon/aylla-gift-config";
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
  });

  describe("assertRuntimeIdentity fail-closed perimeter checks", () => {
    function makeMockClient(overrides: Partial<{
      current_user: string;
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolcreaterole: boolean;
      rolcreatedb: boolean;
      rolbypassrls: boolean;
    }> = {}) {
      return {
        async query() {
          return {
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
          };
        },
      };
    }

    it("rejects connection when role is elevated to superuser", async () => {
      const client = makeMockClient({ rolsuper: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has bypassrls privilege", async () => {
      const client = makeMockClient({ rolbypassrls: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has createrole privilege", async () => {
      const client = makeMockClient({ rolcreaterole: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role has createdb privilege", async () => {
      const client = makeMockClient({ rolcreatedb: true });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when role cannot login", async () => {
      const client = makeMockClient({ rolcanlogin: false });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
        /Gift Registry PostgreSQL runtime identity is not permitted/
      );
    });

    it("rejects connection when effective user switches dynamically", async () => {
      const client = makeMockClient({ current_user: "postgres" });
      await assert.rejects(
        () => assertRuntimeIdentity(client as any),
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
  });
});
