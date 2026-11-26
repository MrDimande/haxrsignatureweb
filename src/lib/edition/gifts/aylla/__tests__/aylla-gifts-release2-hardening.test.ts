import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";
import { CANONICAL_BABY_AYLLA_EVENT_ID } from "../config";
import { ExternalDeliveryAttemptBlockedError } from "../delivery-barrier";
import {
  createProductionAyllaOtpDeliveryProvider,
  getAyllaOtpDeliveryReadiness,
  isAyllaBrevoOtpEnabled,
} from "../otp-delivery";
import {
  getAyllaSyntheticOutboxMessagesForTesting,
  setCoreAyllaGiftStoreForTesting,
} from "../instance";
import {
  isAyllaGiftRegistryOperational,
  isAyllaRealDeliveryStagingEnabled,
} from "../test-activation";
import { createCoreAyllaGiftService } from "../service";
import { createInMemoryAyllaGiftStore } from "../store";
import type { CoreGuestRecord } from "../types";

const TEST_PEPPER = "release2-hardening-pepper-minimum-32-characters";

function makeGuest(overrides: Partial<CoreGuestRecord> = {}): CoreGuestRecord {
  return {
    id: randomUUID(),
    eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
    name: "Convidada Sintética",
    contact: "sintetico@haxrsignature.test",
    status: "confirmed",
    source: "edition_rsvp",
    archived: false,
    deleted: false,
    incorrect: false,
    ...overrides,
  };
}

afterEach(() => {
  const env = process.env as Record<string, string | undefined>;
  delete env.RESEND_API_KEY;
  delete env.BREVO_API_KEY;
  delete env.EMAIL_SEND_MODE;
  delete env.HAXR_AYLLA_OTP_BREVO_ENABLED;
  delete env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION;
  delete env.HAXR_AYLLA_GIFT_STAGING_REAL_DELIVERY;
  delete env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY;
  delete env.VERCEL_ENV;
  delete env.VERCEL_TARGET_ENV;
  setCoreAyllaGiftStoreForTesting(null);
});

describe("Baby Aylla Release 2 Hardening — Duplicate Contacts, Archived Isolation & OTP Consistency", () => {
  it("fails closed when multiple eligible guests share the same email or phone contact", async () => {
    const firstActive = makeGuest({ name: "Convidada 1", contact: "partilhado@haxrsignature.test" });
    const secondActive = makeGuest({ name: "Convidada 2", contact: "PARTILHADO@HAXRSIGNATURE.TEST" });
    const phoneDupA = makeGuest({ name: "Tio A", contact: "+258841234567" });
    const phoneDupB = makeGuest({ name: "Tio B", contact: "84 123 4567" });

    const baseStore = createInMemoryAyllaGiftStore({
      guests: [firstActive, secondActive, phoneDupA, phoneDupB],
    });

    assert.equal(
      await baseStore.findGuestByContact(CANONICAL_BABY_AYLLA_EVENT_ID, "partilhado@haxrsignature.test"),
      null
    );
    assert.equal(
      await baseStore.findGuestByContact(CANONICAL_BABY_AYLLA_EVENT_ID, "0841234567"),
      null
    );

    let challengeCount = 0;
    let emailSentCount = 0;
    const service = createCoreAyllaGiftService({
      store: {
        ...baseStore,
        async createChallenge(input) {
          challengeCount += 1;
          return baseStore.createChallenge(input);
        },
      },
      pepper: TEST_PEPPER,
      supportedChannels: { email: true, phone: false },
      deliveryProvider: createProductionAyllaOtpDeliveryProvider({
        env: { RESEND_API_KEY: "re_test_key" },
        sendEmailFn: async () => {
          emailSentCount += 1;
          return { ok: true };
        },
      }),
    });

    const req = await service.requestVerification("partilhado@haxrsignature.test", "10.10.0.1");
    assert.equal(req.outcome, "verification_pending");
    assert.equal(challengeCount, 0);
    assert.equal(emailSentCount, 0);
  });

  it("ignores archived, deleted, and incorrect records while strictly locking down archived guests across all flows", async () => {
    const activeUnique = makeGuest({ name: "Clara Activa", contact: "clara@haxrsignature.test" });
    const archivedSameEmail = makeGuest({
      name: "Clara Antiga Arquivada",
      contact: "clara@haxrsignature.test",
      archived: true,
    });
    const deletedSameEmail = makeGuest({
      name: "Clara Apagada",
      contact: "clara@haxrsignature.test",
      deleted: true,
    });
    const archivedOnly = makeGuest({
      name: "Arquivo Exclusivo",
      contact: "arquivada@haxrsignature.test",
      archived: true,
    });

    const store = createInMemoryAyllaGiftStore({
      guests: [activeUnique, archivedSameEmail, deletedSameEmail, archivedOnly],
    });

    // Only 1 active eligible record for clara@ -> resolves cleanly
    const resolvedUnique = await store.findGuestByContact(
      CANONICAL_BABY_AYLLA_EVENT_ID,
      "clara@haxrsignature.test"
    );
    assert.equal(resolvedUnique?.id, activeUnique.id);

    // Archived-only record -> resolves null & cannot trigger email or challenge
    assert.equal(
      await store.findGuestByContact(CANONICAL_BABY_AYLLA_EVENT_ID, "arquivada@haxrsignature.test"),
      null
    );

    let sentCode = "";
    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      supportedChannels: { email: true, phone: false },
      tokenGenerator: () => "654321",
      deliveryProvider: createProductionAyllaOtpDeliveryProvider({
        env: { RESEND_API_KEY: "re_test_key" },
        sendEmailFn: async (msg) => {
          sentCode = msg.text ?? "";
          return { ok: true };
        },
      }),
    });

    const blockedReq = await service.requestVerification("arquivada@haxrsignature.test", "10.10.0.2");
    assert.equal(blockedReq.outcome, "verification_pending");
    assert.equal(sentCode, "");

    // Guest is active at challenge issuance, then archived before verification
    let victimArchived = false;
    const victim = makeGuest({ id: randomUUID(), contact: "vitima@haxrsignature.test" });
    const mutableGuests = [victim];
    const mutableStore = createInMemoryAyllaGiftStore({
      guests: mutableGuests,
      inventory: [
        {
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          registryKey: "baby-aylla-couture",
          itemId: "dream-cot-sheets",
          familyApproved: true,
          enabled: true,
          approvedQuantity: 2,
          specificationsComplete: true,
          childSafetyValidated: true,
        },
      ],
    });
    let deliveredOtp = "";
    const mutableService = createCoreAyllaGiftService({
      store: {
        ...mutableStore,
        async getGuestById(eventId, guestId) {
          if (victimArchived) return null;
          return mutableStore.getGuestById(eventId, guestId);
        },
      },
      pepper: TEST_PEPPER,
      supportedChannels: { email: true, phone: false },
      deliveryProvider: createProductionAyllaOtpDeliveryProvider({
        env: { RESEND_API_KEY: "re_test_key" },
        sendEmailFn: async (msg) => {
          const match = (msg.text ?? "").match(/\b(\d{6})\b/);
          deliveredOtp = match?.[1] ?? "";
          return { ok: true };
        },
      }),
    });

    const issued = await mutableService.requestVerification("vitima@haxrsignature.test", "10.10.0.3");
    if (issued.outcome !== "verification_pending") throw new Error("Expected verification_pending");
    assert.ok(deliveredOtp.length === 6);

    // Archive mid-flight: session creation / guest resolution must fail closed
    victimArchived = true;
    const verifyAfterArchive = await mutableService.verifyChallenge(
      issued.challengeId,
      deliveredOtp,
      "10.10.0.3"
    );
    assert.equal(verifyAfterArchive.outcome, "verification_required");

    // Archived guest also fails cancelVerified directly in store
    const archivedWithSession = makeGuest({
      id: "guest-archived-cancel-block",
      contact: "cancelblock@haxrsignature.test",
      archived: true,
    });
    const sessionSecretHash = createHmac("sha256", TEST_PEPPER).update("proof").digest("base64url");
    const seededResId = randomUUID();
    const seededSessionId = randomUUID();
    const seededCancelSessionId = randomUUID();
    const cancelStore = createInMemoryAyllaGiftStore({
      guests: [archivedWithSession],
      sessions: [
        {
          id: seededSessionId,
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          guestId: archivedWithSession.id,
          secretHash: sessionSecretHash,
          expiresAt: new Date(Date.now() + 600_000),
          revokedAt: null,
          createdAt: new Date(),
        },
        {
          id: seededCancelSessionId,
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          guestId: archivedWithSession.id,
          secretHash: sessionSecretHash,
          expiresAt: new Date(Date.now() + 600_000),
          revokedAt: null,
          createdAt: new Date(),
        },
      ],
      reservations: [
        {
          id: seededResId,
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          giftId: "dream-cot-sheets",
          guestId: archivedWithSession.id,
          quantity: 1,
          status: "reserved",
          idempotencyKey: randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    assert.equal(
      await cancelStore.resolveSessionVerified!({
        sessionId: seededSessionId,
        secretProof: sessionSecretHash,
      }),
      null
    );
    assert.ok((await cancelStore.getSession(seededSessionId))?.revokedAt instanceof Date);
    await assert.rejects(
      () =>
        cancelStore.cancelVerified({
          sessionId: seededCancelSessionId,
          secretHash: sessionSecretHash,
          reservationId: seededResId,
        }),
      /guest is not eligible/
    );
  });

  it("enforces persist-before-send, compensates failed/blocked deliveries, and preserves single-use & expiration", async () => {
    const guest = makeGuest({ contact: "consistencia@haxrsignature.test" });
    const baseStore = createInMemoryAyllaGiftStore({ guests: [guest] });

    // 1. If DB persistence throws during createChallenge, ZERO emails leave Resend
    let emailDispatchCount = 0;
    const dbFailureService = createCoreAyllaGiftService({
      store: {
        ...baseStore,
        async createChallenge() {
          throw new Error("DB_CONNECTION_TIMEOUT");
        },
      },
      pepper: TEST_PEPPER,
      supportedChannels: { email: true, phone: false },
      deliveryProvider: {
        async sendVerificationCode() {
          emailDispatchCount += 1;
          return true;
        },
      },
    });

    await assert.rejects(
      () => dbFailureService.requestVerification(guest.contact, "10.10.0.10"),
      /DB_CONNECTION_TIMEOUT/
    );
    assert.equal(emailDispatchCount, 0);

    // 2. ExternalDeliveryAttemptBlockedError triggers compensation BEFORE rethrowing
    let compensatedBlocked = false;
    const blockedService = createCoreAyllaGiftService({
      store: {
        ...baseStore,
        async compensateFailedChallenge(id, nowDate) {
          compensatedBlocked = true;
          return baseStore.compensateFailedChallenge!(id, nowDate);
        },
      },
      pepper: TEST_PEPPER,
      supportedChannels: { email: true, phone: false },
      deliveryProvider: {
        async sendVerificationCode() {
          throw new ExternalDeliveryAttemptBlockedError("Real credential leak blocked");
        },
      },
    });

    await assert.rejects(
      () => blockedService.requestVerification(guest.contact, "10.10.0.11"),
      ExternalDeliveryAttemptBlockedError
    );
    assert.equal(compensatedBlocked, true);

    // 3. Single-use & expiration enforcement with delivered challenge + multi-instance rate limiting
    let currentTime = new Date("2027-01-10T10:00:00Z");
    const singleUseService = createCoreAyllaGiftService({
      store: baseStore,
      pepper: TEST_PEPPER,
      rateLimiter: {
        async check(key, limit, windowMs) {
          const allowed = await baseStore.checkRateLimit!(key, limit, windowMs);
          return { allowed, remaining: allowed ? 1 : 0 };
        },
      },
      supportedChannels: { email: true, phone: false },
      now: () => currentTime,
      tokenGenerator: () => "482910",
      deliveryProvider: createProductionAyllaOtpDeliveryProvider({
        env: { RESEND_API_KEY: "re_test_key" },
        sendEmailFn: async () => ({ ok: true }),
      }),
    });

    const okReq = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    if (okReq.outcome !== "verification_pending") throw new Error("Expected okReq verification_pending");
    const okStored = await baseStore.getChallenge(okReq.challengeId);
    assert.equal(okStored?.deliveryStatus, "delivered");
    assert.ok(okStored?.deliveredAt instanceof Date);

    // Expired after 10 minutes
    const expReq = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    if (expReq.outcome !== "verification_pending") throw new Error("Expected expReq verification_pending");
    currentTime = new Date("2027-01-10T10:11:00Z");
    const expiredVerify = await singleUseService.verifyChallenge(expReq.challengeId, "482910", "10.10.0.12");
    assert.equal(expiredVerify.outcome, "verification_required");

    // Fresh challenge works ONCE, then fails on replay (single-use)
    const freshReq = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    if (freshReq.outcome !== "verification_pending") throw new Error("Expected freshReq verification_pending");
    const firstVerify = await singleUseService.verifyChallenge(freshReq.challengeId, "482910", "10.10.0.12");
    assert.equal(firstVerify.outcome, "verified");
    const replayVerify = await singleUseService.verifyChallenge(freshReq.challengeId, "482910", "10.10.0.12");
    assert.equal(replayVerify.outcome, "verification_required");

    // Requests 4 & 5 still succeed while 6th request in 5 minutes triggers rate_limited
    const req4 = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    assert.equal(req4.outcome, "verification_pending");
    const req5 = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    assert.equal(req5.outcome, "verification_pending");
    const rateLimitedReq = await singleUseService.requestVerification(guest.contact, "10.10.0.12");
    assert.equal(rateLimitedReq.outcome, "rate_limited");
  });

  it("verifies Release 2 SQL migration hardening & least-privilege grants", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "database/migrations/20261126090000_baby_aylla_gift_registry_release2_hardening.sql"
      ),
      "utf8"
    );

    const resolveContactMatch = sql.match(
      /CREATE OR REPLACE FUNCTION public\.resolve_baby_aylla_guest_by_contact\([\s\S]*?\$\$;/
    );
    assert.ok(resolveContactMatch, "resolve_baby_aylla_guest_by_contact missing");
    assert.doesNotMatch(resolveContactMatch[0], /\bLIMIT\s+1\b/i);
    assert.match(resolveContactMatch[0], /v_eligible_count\s*<>\s*1/);
    assert.match(resolveContactMatch[0], /archived_at IS NULL/);

    assert.match(sql, /FUNCTION public\.mark_baby_aylla_challenge_delivered\(uuid|FUNCTION public\.mark_baby_aylla_challenge_delivered\(\s*p_challenge_id uuid/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.mark_baby_aylla_challenge_delivered\(uuid\) TO haxr_aylla_gift_issuer;/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.compensate_baby_aylla_failed_challenge\(uuid\) TO haxr_aylla_gift_issuer;/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.mark_baby_aylla_challenge_delivered\(uuid\) FROM PUBLIC, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.compensate_baby_aylla_failed_challenge\(uuid\) FROM PUBLIC, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.cancel_baby_aylla_gift_verified[\s\S]*archived_at IS NULL[\s\S]*deleted_at IS NULL[\s\S]*is_incorrect = false/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.resolve_baby_aylla_guest_session[\s\S]*UPDATE public\.edition_guest_sessions AS s[\s\S]*SET revoked_at = v_now/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.verify_and_consume_baby_aylla_challenge[\s\S]*IF v_ambiguous THEN/);
    assert.match(sql, /CREATE TRIGGER trg_revoke_baby_aylla_sessions_on_guest_ineligibility[\s\S]*WHEN \(OLD\.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid\)/);
  });

  it("permanently revokes session on eligibility loss (never reactivating after restore) and blocks pre-conflict ambiguous challenges", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const guestA = makeGuest({ name: "Convidada Elegível A", contact: "elegivel-a@haxrsignature.test" });
    const guestB = makeGuest({ name: "Convidada B", contact: "elegivel-b@haxrsignature.test" });
    const foreignGuest = {
      ...makeGuest({ name: "Convidado Outro Evento", contact: "foreign@haxrsignature.test" }),
      eventId: "11111111-1111-4111-8111-111111111111",
    };
    const mutableGuests = [guestA, guestB, foreignGuest];
    const store = createInMemoryAyllaGiftStore({
      guests: mutableGuests,
      inventory: [
        {
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          registryKey: "baby-aylla-couture",
          itemId: "dream-cot-sheets",
          familyApproved: true,
          enabled: true,
          approvedQuantity: 5,
          specificationsComplete: true,
          childSafetyValidated: true,
        },
      ],
    });
    const service = createCoreAyllaGiftService({
      store,
      pepper: TEST_PEPPER,
      tokenGenerator: () => "135790",
      supportedChannels: { email: true, phone: false },
      deliveryProvider: createProductionAyllaOtpDeliveryProvider({
        env: { RESEND_API_KEY: "re_test_key" },
        sendEmailFn: async () => ({ ok: true }),
      }),
    });

    // 1. Challenge emitted BEFORE duplicate contact appears cannot authenticate ambiguously
    const preChal = await service.requestVerification("elegivel-a@haxrsignature.test", "10.20.0.1");
    if (preChal.outcome !== "verification_pending") throw new Error("Expected pending");
    const dupA = makeGuest({ name: "Duplicada Posterior", contact: "ELEGIVEL-A@HAXRSIGNATURE.TEST" });
    mutableGuests.push(dupA);
    const verifyAfterDup = await service.verifyChallenge(preChal.challengeId, "135790", "10.20.0.1");
    assert.equal(verifyAfterDup.outcome, "verification_required");

    // Archive duplicate -> issue fresh session for guestB -> check logout + third-party revocation lockout
    mutableGuests.pop();
    const reqB1 = await service.requestVerification("elegivel-b@haxrsignature.test", "10.20.0.2");
    if (reqB1.outcome !== "verification_pending") throw new Error("Expected pending B1");
    const verB1 = await service.verifyChallenge(reqB1.challengeId, "135790", "10.20.0.2");
    if (verB1.outcome !== "verified") throw new Error("Expected verified B1");
    const sessB1Id = verB1.sessionToken.split(".")[0];

    // Forged secret proof cannot revoke guest B's session
    assert.equal(await service.revokeSession(`${sessB1Id}.wrong-proof-for-third-party-session`), false);
    assert.equal((await store.getSession(sessB1Id))?.revokedAt, null);

    // Legitimate logout marks revokedAt and blocks replay
    assert.equal(await service.revokeSession(verB1.sessionToken), true);
    assert.ok((await store.getSession(sessB1Id))?.revokedAt instanceof Date);
    assert.equal((await service.resolveSession(verB1.sessionToken)).valid, false);

    // 2. Archive mid-session permanently revokes DB session; restoring guest does NOT reactivate old session
    const reqA2 = await service.requestVerification("elegivel-a@haxrsignature.test", "10.20.0.3");
    if (reqA2.outcome !== "verification_pending") throw new Error("Expected pending A2");
    const verA2 = await service.verifyChallenge(reqA2.challengeId, "135790", "10.20.0.3");
    if (verA2.outcome !== "verified") throw new Error("Expected verified A2");
    const sessA2Id = verA2.sessionToken.split(".")[0];

    const resA = await service.reserveGift({
      sessionToken: verA2.sessionToken,
      itemId: "dream-cot-sheets",
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    if (resA.outcome !== "reservation_confirmed") throw new Error("Expected reserve confirmed");

    // Archive mid-session -> reserve blocked & session permanently revoked
    (guestA as { archived: boolean }).archived = true;
    const blockedWhileArchived = await service.reserveGift({
      sessionToken: verA2.sessionToken,
      itemId: "dream-cot-sheets",
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    assert.equal(blockedWhileArchived.outcome, "session_expired");
    assert.ok((await store.getSession(sessA2Id))?.revokedAt instanceof Date);

    // Restore guest -> old token REMAINS permanently revoked
    (guestA as { archived: boolean }).archived = false;
    const afterRestoreResolve = await service.resolveSession(verA2.sessionToken);
    assert.equal(afterRestoreResolve.valid, false);
    const afterRestoreReserve = await service.reserveGift({
      sessionToken: verA2.sessionToken,
      itemId: "dream-cot-sheets",
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    assert.equal(afterRestoreReserve.outcome, "session_expired");

    // 3. Cross-guest & cross-event isolation
    const reqB2 = await service.requestVerification("elegivel-b@haxrsignature.test", "10.20.0.4");
    if (reqB2.outcome !== "verification_pending") throw new Error("Expected pending B2");
    const verB2 = await service.verifyChallenge(reqB2.challengeId, "135790", "10.20.0.4");
    if (verB2.outcome !== "verified") throw new Error("Expected verified B2");
    const crossGuestCancel = await service.cancelReservation({
      sessionToken: verB2.sessionToken,
      reservationId: resA.reservation.id,
    });
    assert.equal(crossGuestCancel.outcome, "access_denied");
  });

  it("disables Brevo fallback exclusively for Aylla OTP even when shared Brevo credentials exist", async () => {
    const sharedBrevoEnv = {
      RESEND_API_KEY: "re_test_key",
      BREVO_API_KEY: "xkeysib_shared_production_service_key",
      EMAIL_SEND_MODE: "production",
    };

    assert.equal(isAyllaBrevoOtpEnabled(sharedBrevoEnv), false);
    assert.equal(
      isAyllaBrevoOtpEnabled({ ...sharedBrevoEnv, HAXR_AYLLA_OTP_BREVO_ENABLED: "false" }),
      false
    );
    assert.equal(
      getAyllaOtpDeliveryReadiness({
        BREVO_API_KEY: "xkeysib_shared_production_service_key",
        EMAIL_SEND_MODE: "production",
        HAXR_AYLLA_OTP_BREVO_ENABLED: "false",
      }).emailReady,
      false
    );

    let brevoCalled = false;
    const provider = createProductionAyllaOtpDeliveryProvider({
      env: { ...sharedBrevoEnv, HAXR_AYLLA_OTP_BREVO_ENABLED: "false" },
      sendEmailFn: async () => ({ ok: false, error: "resend_failed" }),
      sendBrevoEmailFn: async () => {
        brevoCalled = true;
        return { ok: true };
      },
    });
    const delivered = await provider.sendVerificationCode(
      "aylla.test@haxrsignature.test",
      "654321",
      new Date(Date.now() + 60_000)
    );
    assert.equal(delivered, false);
    assert.equal(brevoCalled, false);
  });

  it("supports isolated real-delivery staging gate outside Production without synthetic flags", () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_STAGING_REAL_DELIVERY = "true";

    assert.equal(isAyllaRealDeliveryStagingEnabled(), true);
    assert.equal(isAyllaGiftRegistryOperational(), true);
    assert.equal(getAyllaSyntheticOutboxMessagesForTesting(), null);

    process.env.VERCEL_ENV = "production";
    assert.equal(isAyllaRealDeliveryStagingEnabled(), false);
    assert.equal(isAyllaGiftRegistryOperational(), false);
  });

  it("enforces archived, deleted, and incorrect exclusion in RSVP SQL migration and Neon repository", () => {
    const rsvpMigrationSql = readFileSync(
      resolve(
        process.cwd(),
        "database/migrations/20261126093000_edition_rsvp_active_guest_isolation.sql"
      ),
      "utf8"
    );
    assert.match(rsvpMigrationSql, /CREATE OR REPLACE FUNCTION public\.submit_edition_rsvp/);
    assert.match(rsvpMigrationSql, /archived_at IS NULL[\s\S]*deleted_at IS NULL[\s\S]*is_incorrect = false/);

    const repoSource = readFileSync(
      resolve(process.cwd(), "src/lib/edition/rsvp/persist.neon.repository.ts"),
      "utf8"
    );
    assert.match(repoSource, /FROM public\.guests[\s\S]*archived_at IS NULL[\s\S]*deleted_at IS NULL[\s\S]*is_incorrect = false/);
  });
});
