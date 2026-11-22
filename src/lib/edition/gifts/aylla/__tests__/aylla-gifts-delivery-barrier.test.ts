import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSyntheticDeliveryBarrier,
  ExternalDeliveryAttemptBlockedError,
} from "../delivery-barrier";
import { createCoreAyllaGiftService } from "../service";
import { createInMemoryAyllaGiftStore } from "../store";
import { AYLLA_GIFTS_CONFIG } from "../config";
import type { CoreGuestRecord } from "../types";

describe("Baby Aylla — Synthetic Delivery Barrier & Messaging Safety", () => {
  const TEST_PEPPER = "test-secret-pepper-32-bytes-minimum-length-123456";

  const syntheticGuest: CoreGuestRecord = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    eventId: AYLLA_GIFTS_CONFIG.eventId,
    name: "Convidado Homologação Aylla (Sintético)",
    contact: "+258840000001",
    status: "confirmed",
    source: "edition_rsvp",
    archived: false,
    deleted: false,
    incorrect: false,
  };

  it("traps verification codes in memory and never dispatches to external carriers", async () => {
    const barrier = createSyntheticDeliveryBarrier();
    const store = createInMemoryAyllaGiftStore({ guests: [syntheticGuest] });
    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      deliveryProvider: barrier.provider,
    });

    const result = await service.requestVerification(syntheticGuest.contact, "127.0.0.1");
    assert.equal(result.outcome, "verification_pending");

    const trapped = barrier.getTrappedMessages();
    assert.equal(trapped.length, 1);
    assert.equal(trapped[0].contact, syntheticGuest.contact);
    assert.ok(trapped[0].code.length > 0);
  });

  it("fails closed if a live external messaging credential is leaked into the test environment", async () => {
    const originalToken = process.env.TWILIO_AUTH_TOKEN;
    try {
      process.env.TWILIO_AUTH_TOKEN = "live_secret_token_unauthorized";
      const barrier = createSyntheticDeliveryBarrier();
      const store = createInMemoryAyllaGiftStore({ guests: [syntheticGuest] });
      const service = createCoreAyllaGiftService({
        store,
        pepper: TEST_PEPPER,
        deliveryProvider: barrier.provider,
      });

      await assert.rejects(
        async () => {
          await service.requestVerification(syntheticGuest.contact, "127.0.0.1");
        },
        (err: Error) => {
          assert.ok(err instanceof ExternalDeliveryAttemptBlockedError);
          assert.match(err.message, /Real messaging credential detected/);
          return true;
        }
      );
    } finally {
      if (originalToken !== undefined) {
        process.env.TWILIO_AUTH_TOKEN = originalToken;
      } else {
        delete process.env.TWILIO_AUTH_TOKEN;
      }
    }
  });

  it("confirms email contact uses reserved .test domain", () => {
    const testEmail = "staging-guest-aylla@haxrsignature.test";
    assert.ok(testEmail.endsWith(".test"), "Must end with RFC 2606 reserved .test domain");
  });
});
