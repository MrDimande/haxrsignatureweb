import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import { POST as challengeHandler } from "@/app/api/v1/edition/gifts/aylla/challenge/route";
import { POST as verifyHandler } from "@/app/api/v1/edition/gifts/aylla/verify/route";
import { POST as reserveHandler } from "@/app/api/v1/edition/gifts/aylla/reserve/route";
import { POST as cancelHandler } from "@/app/api/v1/edition/gifts/aylla/cancel/route";
import { POST as catalogHandler } from "@/app/api/v1/edition/gifts/aylla/catalog/route";
import { POST as sessionHandler } from "@/app/api/v1/edition/gifts/aylla/session/route";
import { POST as testOutboxHandler } from "@/app/api/v1/edition/gifts/aylla/test-outbox/route";
import { AYLLA_GIFT_POOL_CONFIG } from "@/lib/neon/aylla-gift-db";
import { AYLLA_GIFTS_CONFIG } from "@/lib/edition/gifts/aylla/config";
import { isAyllaGiftRegistryOperational, isAyllaTestActivationEnabled } from "@/lib/edition/gifts/aylla/test-activation";
import { setCoreAyllaGiftStoreForTesting } from "@/lib/edition/gifts/aylla/instance";
import { createInMemoryAyllaGiftStore } from "@/lib/edition/gifts/aylla/store";
import { createCoreAyllaGiftService } from "@/lib/edition/gifts/aylla/service";
import type { CoreGiftInventoryRecord, CoreGuestRecord } from "@/lib/edition/gifts/aylla/types";

const TEST_SECRET = "production-super-secret-key-42";
const TEST_PEPPER = "test-pepper-synthetic-c3-32-chars-long";
const TEST_EVENT_ID = AYLLA_GIFTS_CONFIG.eventId;

function makeGuest(overrides: Partial<CoreGuestRecord> = {}): CoreGuestRecord {
  return {
    id: randomUUID(),
    eventId: TEST_EVENT_ID,
    name: "Tia Rosa (Sintético)",
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
    registryKey: AYLLA_GIFTS_CONFIG.registryKey,
    itemId: "dream-cot-sheets",
    familyApproved: true,
    enabled: true,
    approvedQuantity: 2,
    specificationsComplete: true,
    childSafetyValidated: true,
    ...overrides,
  };
}

const trackedEnvKeys = [
  "HAXR_AYLLA_GIFT_PROXY_SECRET",
  "HAXR_EDITION_PROXY_SECRET",
  "HAXR_AYLLA_GIFT_PEPPER",
  "HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION",
  "HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY",
  "VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_ENV",
  "VERCEL_TARGET_ENV",
] as const;

describe("HAXR Core — Baby Aylla Gift Registry Gate D Integration", () => {
  beforeEach(() => {
    process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = TEST_SECRET;
    process.env.HAXR_EDITION_PROXY_SECRET = "unrelated-global-rsvp-secret-32";
    process.env.HAXR_AYLLA_GIFT_PEPPER = TEST_PEPPER;
  });

  afterEach(() => {
    for (const key of trackedEnvKeys) {
      delete (process.env as Record<string, string | undefined>)[key];
    }
    setCoreAyllaGiftStoreForTesting(null);
  });

  it("keeps isolated test activation strictly fail-closed in production and partial configs", () => {
    assert.equal(AYLLA_GIFTS_CONFIG.enabled, false);
    assert.equal(isAyllaTestActivationEnabled(), false);
    assert.equal(isAyllaGiftRegistryOperational(), false);

    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    assert.equal(isAyllaTestActivationEnabled(), false);

    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";
    assert.equal(isAyllaTestActivationEnabled(), true);
    assert.equal(isAyllaGiftRegistryOperational(), true);

    (process.env as Record<string, string | undefined>).VERCEL_ENV = "production";
    assert.equal(isAyllaTestActivationEnabled(), false);
    assert.equal(isAyllaGiftRegistryOperational(), false);
  });

  it("hides test-outbox endpoint with 404 unless dual non-production test flags are enabled", async () => {
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/test-outbox", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ contact: "+258841234567" }),
    });
    const closedRes = await testOutboxHandler(req);
    assert.equal(closedRes.status, 404);
  });

  it("completes 6-digit synthetic OTP challenge -> verify -> catalog -> reserve -> cancel flow in isolated test mode", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";
    (process.env as Record<string, string | undefined>).VERCEL_ENV = "preview";

    const guest = makeGuest();
    const otherGuest = makeGuest({ id: randomUUID(), name: "Outro Convidado", contact: "+258849999888" });
    const store = createInMemoryAyllaGiftStore({
      guests: [guest, otherGuest],
      inventory: [makeInventoryItem({ itemId: "dream-cot-sheets", approvedQuantity: 2 })],
    });
    setCoreAyllaGiftStoreForTesting(store);

    // 1. Challenge issues 6-digit OTP via synthetic barrier and opaque UUID even for unknown contacts
    const unknownChallengeRes = await challengeHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({ contact: "+258840009999" }),
      })
    );
    assert.equal(unknownChallengeRes.status, 200);
    const unknownJson = await unknownChallengeRes.json();
    assert.equal(unknownJson.outcome, "verification_pending");
    assert.match(unknownJson.challengeId, /^[0-9a-f-]{36}$/i);

    const challengeRes = await challengeHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({ contact: guest.contact }),
      })
    );
    assert.equal(challengeRes.status, 200);
    const challengeJson = await challengeRes.json();
    assert.match(challengeJson.challengeId, /^[0-9a-f-]{36}$/i);

    // 2. Test outbox retrieves exact 6-digit code
    const outboxRes = await testOutboxHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/test-outbox", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({ contact: guest.contact }),
      })
    );
    assert.equal(outboxRes.status, 200);
    const outboxJson = await outboxRes.json();
    assert.match(outboxJson.latestCode, /^\d{6}$/);

    // 3. Verify challenge (including trimmed whitespace tolerance)
    const verifyRes = await verifyHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/verify", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({
          challengeId: challengeJson.challengeId,
          code: ` ${outboxJson.latestCode} `,
        }),
      })
    );
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.outcome, "verified");
    assert.ok(verifyJson.sessionToken);

    // 4. Reserve item
    const reserveRes = await reserveHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/reserve", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({
          sessionToken: verifyJson.sessionToken,
          itemId: "dream-cot-sheets",
          quantity: 1,
          idempotencyKey: randomUUID(),
        }),
      })
    );
    assert.equal(reserveRes.status, 200);
    const reserveJson = await reserveRes.json();
    assert.equal(reserveJson.outcome, "reservation_confirmed");
    const reservationId = reserveJson.reservation.id;

    // 5. Catalog snapshot exposes availability & authenticated guest's own reservation only
    const catalogRes = await catalogHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({ sessionToken: verifyJson.sessionToken }),
      })
    );
    assert.equal(catalogRes.status, 200);
    const catalogJson = await catalogRes.json();
    assert.equal(catalogJson.registryEnabled, true);
    assert.equal(catalogJson.items[0].remainingQuantity, 1);
    assert.equal(catalogJson.items[0].reservable, true);
    assert.equal(catalogJson.myReservations.length, 1);
    assert.equal(catalogJson.myReservations[0].id, reservationId);
    assert.equal("guestId" in catalogJson.myReservations[0], false);

    // 6. Cancel reservation restores remainingQuantity
    const cancelRes = await cancelHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/cancel", {
        method: "POST",
        headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
        body: JSON.stringify({
          sessionToken: verifyJson.sessionToken,
          reservationId,
        }),
      })
    );
    assert.equal(cancelRes.status, 200);
    const catalogAfterCancel = await (
      await catalogHandler(
        new Request("http://localhost:3000/api/v1/edition/gifts/aylla/catalog", {
          method: "POST",
          headers: { "content-type": "application/json", "x-haxr-edition-proxy": TEST_SECRET },
          body: JSON.stringify({}),
        })
      )
    ).json();
    assert.equal(catalogAfterCancel.items[0].remainingQuantity, 2);
    assert.equal(catalogAfterCancel.myReservations.length, 0);
  });

  it("maps store unavailability and session expiry errors accurately instead of 503", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const guest = makeGuest();
    const store = createInMemoryAyllaGiftStore({
      guests: [guest],
      inventory: [makeInventoryItem({ itemId: "dream-cot-sheets", approvedQuantity: 1 })],
    });
    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      tokenGenerator: () => "123456",
    });

    const req = await service.requestVerification(guest.contact, "127.0.0.1");
    assert.equal(req.outcome, "verification_pending");
    if (req.outcome !== "verification_pending") throw new Error("Expected pending");
    const ver = await service.verifyChallenge(req.challengeId, "123456", "127.0.0.1");
    if (ver.outcome !== "verified") throw new Error("Expected verified");

    const ok1 = await service.reserveGift({
      sessionToken: ver.sessionToken,
      itemId: "dream-cot-sheets",
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    assert.equal(ok1.outcome, "reservation_confirmed");

    const depleted = await service.reserveGift({
      sessionToken: ver.sessionToken,
      itemId: "dream-cot-sheets",
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    assert.equal(depleted.outcome, "item_unavailable");
  });

  it("configures bounded PostgreSQL pool timeouts and echoes x-request-id across Core gift routes", async () => {
    assert.ok(AYLLA_GIFT_POOL_CONFIG.connectionTimeoutMillis > 0 && AYLLA_GIFT_POOL_CONFIG.connectionTimeoutMillis <= 15_000);
    assert.ok(AYLLA_GIFT_POOL_CONFIG.query_timeout > 0 && AYLLA_GIFT_POOL_CONFIG.query_timeout <= 20_000);
    assert.ok(AYLLA_GIFT_POOL_CONFIG.idleTimeoutMillis > 0);
    assert.equal(AYLLA_GIFT_POOL_CONFIG.keepAlive, true);

    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const guest = makeGuest();
    const store = createInMemoryAyllaGiftStore({
      guests: [guest],
      inventory: [makeInventoryItem({ itemId: "dream-cot-sheets", approvedQuantity: 1 })],
    });
    setCoreAyllaGiftStoreForTesting(store);

    const correlationId = "corr-gate-d-scenario-b-123";
    const sessionRes = await sessionHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-haxr-edition-proxy": TEST_SECRET,
          "x-request-id": correlationId,
        },
        body: JSON.stringify({ sessionToken: "00000000-0000-0000-0000-000000000000.invalid-secret" }),
      })
    );
    assert.equal(sessionRes.status, 401);
    assert.equal(sessionRes.headers.get("x-request-id"), correlationId);

    const catalogRes = await catalogHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/catalog", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-haxr-edition-proxy": TEST_SECRET,
          "x-request-id": correlationId,
        },
        body: JSON.stringify({}),
      })
    );
    assert.equal(catalogRes.status, 200);
    assert.equal(catalogRes.headers.get("x-request-id"), correlationId);
  });

  it("shares synthetic delivery barrier across separate module evaluations via globalThis and completes OTP challenge -> outbox -> verify", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const guest = makeGuest({ contact: "+258840000001" });
    const store = createInMemoryAyllaGiftStore({
      guests: [guest],
      inventory: [makeInventoryItem({ itemId: "dream-cot-sheets", approvedQuantity: 2 })],
    });
    setCoreAyllaGiftStoreForTesting(store);

    const separateModuleUrl = new URL(`../instance.ts?chunk=test-outbox-${Date.now()}`, import.meta.url).href;
    const separateInstance = (await import(separateModuleUrl)) as typeof import("../instance");

    const challengeReqId = "corr-gate-d-otp-challenge";
    const challengeRes = await challengeHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-haxr-edition-proxy": TEST_SECRET,
          "x-request-id": challengeReqId,
        },
        body: JSON.stringify({ contact: "  +258840000001  " }),
      })
    );
    assert.equal(challengeRes.status, 200);
    assert.equal(challengeRes.headers.get("x-request-id"), challengeReqId);
    const challengeBody = (await challengeRes.json()) as {
      outcome: string;
      challengeId?: string;
    };
    assert.equal(challengeBody.outcome, "verification_pending");
    assert.ok(challengeBody.challengeId);

    const separateOutbox = separateInstance.getAyllaSyntheticOutboxMessagesForTesting(guest.contact);
    assert.ok(Array.isArray(separateOutbox) && separateOutbox.length === 1);
    assert.match(separateOutbox[0].code, /^\d{6}$/);

    const outboxRes = await testOutboxHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/test-outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-haxr-edition-proxy": TEST_SECRET,
          "x-request-id": "corr-gate-d-test-outbox",
        },
        body: JSON.stringify({ contact: guest.contact }),
      })
    );
    assert.equal(outboxRes.status, 200);
    const outboxBody = (await outboxRes.json()) as {
      success: boolean;
      latestCode: string | null;
      count: number;
    };
    assert.equal(outboxBody.success, true);
    assert.equal(outboxBody.count, 1);
    assert.equal(outboxBody.latestCode, separateOutbox[0].code);

    const verifyRes = await verifyHandler(
      new Request("http://localhost:3000/api/v1/edition/gifts/aylla/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-haxr-edition-proxy": TEST_SECRET,
          "x-request-id": "corr-gate-d-otp-verify",
        },
        body: JSON.stringify({
          challengeId: challengeBody.challengeId,
          code: outboxBody.latestCode,
        }),
      })
    );
    assert.equal(verifyRes.status, 200);
    const verifyBody = (await verifyRes.json()) as {
      outcome: string;
      sessionToken?: string;
    };
    assert.equal(verifyBody.outcome, "verified");
    assert.ok(verifyBody.sessionToken && verifyBody.sessionToken.includes("."));
  });
});
