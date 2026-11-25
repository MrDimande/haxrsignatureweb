import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as challengeHandler } from "@/app/api/v1/edition/gifts/aylla/challenge/route";
import { POST as sessionHandler, DELETE as sessionRevokeHandler } from "@/app/api/v1/edition/gifts/aylla/session/route";
import { POST as reserveHandler } from "@/app/api/v1/edition/gifts/aylla/reserve/route";
import { setCoreAyllaGiftStoreForTesting } from "@/lib/edition/gifts/aylla/instance";
import { createInMemoryAyllaGiftStore } from "@/lib/edition/gifts/aylla/store";
import { AYLLA_GIFTS_CONFIG } from "@/lib/edition/gifts/aylla/config";
import type { CoreGuestRecord } from "@/lib/edition/gifts/aylla/types";

const TEST_SECRET = "production-super-secret-key-42";
const TEST_PEPPER = "test-pepper-synthetic-c3-32-chars-long";
const TEST_EVENT_ID = AYLLA_GIFTS_CONFIG.eventId;

function makeGuest(): CoreGuestRecord {
  return {
    id: "guest-http-1",
    eventId: TEST_EVENT_ID,
    name: "Tia Rosa",
    contact: "+258841234567",
    status: "confirmed",
    source: "edition_rsvp",
    archived: false,
    deleted: false,
    incorrect: false,
  };
}

describe("HAXR Core — Baby Aylla Gift Registry HTTP Routes (Phase C.3.1.1)", () => {
  beforeEach(() => {
    process.env.HAXR_EDITION_PROXY_SECRET = TEST_SECRET;
    process.env.HAXR_AYLLA_GIFT_PEPPER = TEST_PEPPER;
    const store = createInMemoryAyllaGiftStore({
      guests: [makeGuest()],
    });
    setCoreAyllaGiftStoreForTesting(store);
  });

  afterEach(() => {
    delete (process.env as Record<string, string | undefined>).HAXR_EDITION_PROXY_SECRET;
    delete (process.env as Record<string, string | undefined>).HAXR_AYLLA_GIFT_PEPPER;
    delete (process.env as Record<string, string | undefined>).HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION;
    delete (process.env as Record<string, string | undefined>).HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY;
    delete (process.env as Record<string, string | undefined>).VERCEL_ENV;
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    setCoreAyllaGiftStoreForTesting(null);
  });

  it("strictly rejects requests when HAXR_EDITION_PROXY_SECRET is missing from server config", async () => {
    delete process.env.HAXR_EDITION_PROXY_SECRET;

    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "Não autorizado.");
  });

  it("strictly rejects requests when presented secret is empty or whitespace", async () => {
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": "   ",
      },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 401);
  });

  it("strictly rejects requests when presented secret is incorrect", async () => {
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": "wrong-bogus-secret",
      },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it("strictly rejects unauthenticated requests even in VERCEL_ENV=preview and NODE_ENV=development (No Bypass)", async () => {
    (process.env as Record<string, string | undefined>).VERCEL_ENV = "preview";
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 401);
  });

  it("challenge route fails closed with 403 registry_closed when catalog is disabled", async () => {
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ contact: "+258849999999" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.outcome, "registry_closed");
  });

  it("accepts valid proxy secret via x-haxr-edition-proxy header and executes challenge", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ contact: "+258849999999" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.outcome, "verification_pending");
  });

  it("accepts valid proxy secret via Authorization Bearer header", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/challenge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({ contact: "+258849999999" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.outcome, "verification_pending");
  });

  it("reserve route enforces fail-closed catalog lockdown even with valid proxy secret", async () => {
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/reserve", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({
        sessionToken: "dummy-session-id.dummy-secret",
        itemId: "dior-dress-silk-rose",
        quantity: 1,
        idempotencyKey: "test-idem-key",
      }),
    });

    const res = await reserveHandler(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.outcome, "registry_closed");
  });

  it("session route resolves active guest and can revoke", async () => {
    const guest = makeGuest();
    const fixedTime = new Date("2027-01-20T12:00:00Z");
    const secret = "session-secret-999";
    const secretHash = (await import("node:crypto")).createHmac("sha256", TEST_PEPPER).update(secret).digest("base64url");
    const sessionId = "session-valid-http";

    const store = createInMemoryAyllaGiftStore({
      guests: [guest],
      sessions: [
        {
          id: sessionId,
          eventId: guest.eventId,
          guestId: guest.id,
          secretHash,
          expiresAt: new Date(fixedTime.getTime() + 20 * 60 * 1000),
          revokedAt: null,
          createdAt: fixedTime,
        },
      ],
    });
    setCoreAyllaGiftStoreForTesting(store);

    const token = `${sessionId}.${secret}`;

    // Test POST /session
    const req = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ sessionToken: token }),
    });

    const res = await sessionHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.guest.name, "Tia Rosa");

    // Test DELETE /session
    const delReq = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/session", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ sessionToken: token }),
    });

    const delRes = await sessionRevokeHandler(delReq);
    assert.equal(delRes.status, 200);
    const delJson = await delRes.json();
    assert.equal(delJson.success, true);
    assert.equal(delJson.revoked, true);

    // Verify session is now revoked with fresh request
    const postRevokeReq = new Request("http://localhost:3000/api/v1/edition/gifts/aylla/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-haxr-edition-proxy": TEST_SECRET,
      },
      body: JSON.stringify({ sessionToken: token }),
    });

    const postRevokeRes = await sessionHandler(postRevokeReq);
    assert.equal(postRevokeRes.status, 401);
    const postRevokeJson = await postRevokeRes.json();
    assert.equal(postRevokeJson.success, false);
    assert.equal(postRevokeJson.reason, "session_expired");
  });
});
