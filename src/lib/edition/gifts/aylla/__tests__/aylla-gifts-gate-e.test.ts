import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  AYLLA_GIFT_ADMIN_ROLE,
  validateAyllaGiftAdminEnvironment,
} from "@/lib/neon/aylla-gift-config";
import {
  AYLLA_CANONICAL_CATALOG_ITEMS,
  AYLLA_GIFT_CATEGORIES,
  reconcileAyllaCatalogInventory,
} from "../catalog-items";
import {
  AYLLA_GIFTS_CONFIG,
  CANONICAL_BABY_AYLLA_EVENT_ID,
  resolveAyllaGiftEventId,
} from "../config";
import {
  buildAyllaOtpEmailHtml,
  buildAyllaOtpEmailText,
  classifyAyllaContactChannel,
  createProductionAyllaOtpDeliveryProvider,
  getAyllaOtpDeliveryReadiness,
  getAyllaOtpSupportedChannels,
  normalizeAyllaContactForLookup,
} from "../otp-delivery";
import {
  getCoreAyllaGiftService,
  setCoreAyllaGiftStoreForTesting,
} from "../instance";
import { createInMemoryAyllaGiftStore } from "../store";

const trackedEnv = [
  "EDITION_EVENT_BABY_AYLLA_BIRTHDAY_ID",
  "EDITION_EVENT_AYLLA_ID",
  "HAXR_AYLLA_GIFT_EVENT_ID",
  "HAXR_AYLLA_GIFT_PEPPER",
  "HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL",
  "HAXR_AYLLA_GIFT_DATABASE_URL",
  "HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL",
  "HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION",
  "HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY",
  "HAXR_AYLLA_OTP_WHATSAPP_ENABLED",
  "HAXR_AYLLA_OTP_SMS_ENABLED",
  "HAXR_AYLLA_OTP_PHONE_CHANNELS",
  "EMAIL_SEND_MODE",
  "BREVO_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_SMS_FROM",
  "TWILIO_AYLLA_OTP_CONTENT_SID",
  "RESEND_API_KEY",
  "VERCEL_ENV",
] as const;

afterEach(() => {
  for (const key of trackedEnv) {
    delete (process.env as Record<string, string | undefined>)[key];
  }
  setCoreAyllaGiftStoreForTesting(null);
});

describe("Baby Aylla Gate E — Production Readiness, Real OTP & 52-Item Catalog", () => {
  it("resolves canonical production event UUID safely and rejects canary/malformed overrides", () => {
    assert.equal(resolveAyllaGiftEventId({}), CANONICAL_BABY_AYLLA_EVENT_ID);
    assert.equal(AYLLA_GIFTS_CONFIG.eventId, CANONICAL_BABY_AYLLA_EVENT_ID);

    const customUuid = "11111111-2222-4333-8444-555555555555";
    assert.equal(
      resolveAyllaGiftEventId({ EDITION_EVENT_AYLLA_ID: customUuid }),
      customUuid
    );

    assert.throws(
      () =>
        resolveAyllaGiftEventId({
          EDITION_EVENT_AYLLA_ID: "cc608a8d-3cb9-47f0-955d-8d1be3f30faf",
        }),
      /canary/i
    );

    assert.throws(
      () => resolveAyllaGiftEventId({ EDITION_EVENT_AYLLA_ID: "not-a-uuid" }),
      /valid UUID/i
    );
  });

  it("reconciles all 52 canonical catalog articles across 7 categories identically to SQL pending seed", () => {
    assert.equal(AYLLA_GIFT_CATEGORIES.length, 7);
    assert.equal(AYLLA_CANONICAL_CATALOG_ITEMS.length, 52);

    const seedSql = readFileSync(
      resolve(
        process.cwd(),
        "database/migrations/20261125120200_baby_aylla_gift_registry_catalog_seed_pending.sql"
      ),
      "utf8"
    );

    const valuesBlock = seedSql.slice(seedSql.indexOf("FROM (\n  VALUES") >= 0 ? seedSql.indexOf("VALUES") : 0);
    assert.doesNotMatch(valuesBlock, /synthetic/i);
    assert.equal((valuesBlock.match(/\('[a-z0-9-]+'\)/g) ?? []).length, 52);
    for (const entry of AYLLA_CANONICAL_CATALOG_ITEMS) {
      assert.ok(seedSql.includes(`'${entry.id}'`), `SQL seed missing canonical article ${entry.id}`);
    }

    const emptyReconciled = reconcileAyllaCatalogInventory([], new Map());
    assert.equal(emptyReconciled.length, 52);
    assert.ok(emptyReconciled.every((item) => item.editorialCurated && !item.reservable && !item.enabled));

    const partialAndReady = reconcileAyllaCatalogInventory(
      [
        {
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          registryKey: "baby-aylla-couture",
          itemId: "dream-cot-sheets",
          familyApproved: true,
          enabled: false,
          approvedQuantity: 2,
          specificationsComplete: true,
          childSafetyValidated: false,
        },
        {
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          registryKey: "baby-aylla-couture",
          itemId: "dream-blankets",
          familyApproved: true,
          enabled: true,
          approvedQuantity: 3,
          specificationsComplete: true,
          childSafetyValidated: true,
        },
      ],
      new Map([["dream-blankets", 1]])
    );

    const sheets = partialAndReady.find((i) => i.definition.id === "dream-cot-sheets");
    assert.ok(sheets && !sheets.reservable);
    assert.ok(sheets.pendingRequirements.includes("Validação de segurança infantil"));

    const blankets = partialAndReady.find((i) => i.definition.id === "dream-blankets");
    assert.ok(blankets && blankets.reservable && blankets.remainingQuantity === 2);
  });

  it("normalizes Mozambican phone numbers and email contacts consistently", () => {
    assert.equal(normalizeAyllaContactForLookup("84 123 4567"), "+258841234567");
    assert.equal(normalizeAyllaContactForLookup("0841234567"), "+258841234567");
    assert.equal(normalizeAyllaContactForLookup("00258 87 000 1122"), "+258870001122");
    assert.equal(normalizeAyllaContactForLookup("+258 82-555-6677"), "+258825556677");
    assert.equal(normalizeAyllaContactForLookup("  Convidada@Exemplo.COM "), "convidada@exemplo.com");

    assert.equal(classifyAyllaContactChannel("84 123 4567"), "phone");
    assert.equal(classifyAyllaContactChannel("ana@example.com"), "email");
  });

  it("delivers real OTP via email, Twilio WhatsApp (with ContentSid in production), and Twilio SMS fallback without manual HAXR number", async () => {
    const emailCalls: Array<{ to: string; subject: string; html: string }> = [];
    const emailProvider = createProductionAyllaOtpDeliveryProvider({
      env: { RESEND_API_KEY: "re_test_key" },
      sendEmailFn: async (input) => {
        emailCalls.push({
          to: Array.isArray(input.to) ? input.to.join(",") : input.to,
          subject: input.subject,
          html: input.html,
        });
        return { ok: true };
      },
    });

    const emailSent = await emailProvider.sendVerificationCode(
      "Tia.Rosa@Example.MZ",
      "482910",
      new Date()
    );
    assert.equal(emailSent, true);
    assert.equal(emailCalls.length, 1);
    assert.equal(emailCalls[0].to, "tia.rosa@example.mz");
    assert.match(emailCalls[0].html, /482910/);

    const twilioRequests: Array<{ url: string; body: string }> = [];
    const waAndSmsFallbackProvider = createProductionAyllaOtpDeliveryProvider({
      env: {
        VERCEL_ENV: "production",
        HAXR_AYLLA_OTP_WHATSAPP_ENABLED: "true",
        HAXR_AYLLA_OTP_SMS_ENABLED: "true",
        TWILIO_ACCOUNT_SID: "AC_TEST_SID",
        TWILIO_AUTH_TOKEN: "test_token",
        TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
        TWILIO_AYLLA_OTP_CONTENT_SID: "HX_APPROVED_OTP_TEMPLATE",
        TWILIO_SMS_FROM: "+15005550006",
      },
      fetchFn: (async (url: string | URL, init?: RequestInit) => {
        const body = String(init?.body ?? "");
        twilioRequests.push({ url: String(url), body });
        if (twilioRequests.length === 1) {
          return new Response(JSON.stringify({ code: 63016 }), { status: 400 });
        }
        return new Response(JSON.stringify({ sid: "SM_SMS_OK" }), { status: 201 });
      }) as typeof fetch,
    });

    const phoneSent = await waAndSmsFallbackProvider.sendVerificationCode(
      "84 123 4567",
      "739201",
      new Date()
    );
    assert.equal(phoneSent, true);
    assert.equal(twilioRequests.length, 2);
    assert.match(decodeURIComponent(twilioRequests[0].body), /whatsapp:\+258841234567/);
    assert.match(decodeURIComponent(twilioRequests[0].body), /HX_APPROVED_OTP_TEMPLATE/);
    assert.match(decodeURIComponent(twilioRequests[1].body), /To=\+258841234567/);

    const manualBlockedReadiness = getAyllaOtpDeliveryReadiness({
      VERCEL_ENV: "production",
      HAXR_AYLLA_OTP_WHATSAPP_ENABLED: "true",
      HAXR_AYLLA_OTP_SMS_ENABLED: "true",
      TWILIO_ACCOUNT_SID: "AC_TEST_SID",
      TWILIO_AUTH_TOKEN: "test_token",
      TWILIO_WHATSAPP_FROM: "whatsapp:+258870883428",
      TWILIO_SMS_FROM: "+258870883428",
    });
    assert.equal(manualBlockedReadiness.whatsappReady, false);
    assert.equal(manualBlockedReadiness.smsReady, false);
  });

  it("validates isolated admin DB credentials and Gate E production hardening SQL security invariants", () => {
    process.env.HAXR_AYLLA_GIFT_DATABASE_URL = "postgresql://haxr_aylla_gift_runtime:p1@db.example.com/neondb";
    process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL = "postgresql://haxr_aylla_gift_issuer:p2@db.example.com/neondb";

    const missingAdmin = validateAyllaGiftAdminEnvironment();
    assert.equal(missingAdmin.ok, false);

    process.env.HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL = `postgresql://${AYLLA_GIFT_ADMIN_ROLE}:p3@db.example.com/neondb`;
    const okAdmin = validateAyllaGiftAdminEnvironment();
    assert.equal(okAdmin.ok, true);

    const gateESql = readFileSync(
      resolve(
        process.cwd(),
        "database/migrations/20261125120100_baby_aylla_gift_registry_gate_e_prod_hardening.sql"
      ),
      "utf8"
    );
    assert.match(gateESql, /GRANT EXECUTE ON FUNCTION public\.upsert_baby_aylla_gift_inventory_admin[^\n]+ TO haxr_aylla_gift_admin;/);
    assert.match(gateESql, /GRANT EXECUTE ON FUNCTION public\.list_baby_aylla_gift_admin_reservations[^\n]+ TO haxr_aylla_gift_admin;/);
    assert.doesNotMatch(gateESql, /GRANT SELECT ON public\.guests/);
    assert.match(gateESql, /REVOKE ALL ON FUNCTION public\.upsert_baby_aylla_gift_inventory_admin[^\n]+ FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime;/);
    assert.match(gateESql, /ALTER TABLE public\.edition_gift_rate_limits FORCE ROW LEVEL SECURITY;/);
    assert.match(gateESql, /FUNCTION public\.consume_baby_aylla_rate_limit\(/);
    assert.match(gateESql, /GRANT EXECUTE ON FUNCTION public\.consume_baby_aylla_rate_limit\([^\n]+\)\s+TO haxr_aylla_gift_issuer;/);
    assert.match(gateESql, /GRANT EXECUTE ON FUNCTION public\.consume_baby_aylla_rate_limit\([^\n]+\)\s+TO haxr_aylla_gift_runtime;/);
    assert.match(gateESql, /FROM public\.admin_users AS a\s+WHERE a\.id = p_admin_id\s+AND a\.status = 'active'/);

    const migrationFiles = readdirSync(resolve(process.cwd(), "database/migrations")).filter((f) =>
      f.includes("20261125")
    );
    assert.deepEqual(migrationFiles.sort(), [
      "20261125120100_baby_aylla_gift_registry_gate_e_prod_hardening.sql",
      "20261125120200_baby_aylla_gift_registry_catalog_seed_pending.sql",
    ]);

    const safeRollbackSql = readFileSync(
      resolve(process.cwd(), "database/runbooks/baby_aylla_gift_registry_safe_rollback.sql"),
      "utf8"
    );
    assert.doesNotMatch(safeRollbackSql, /^\s*DROP\s+TABLE\b/im);
    assert.match(safeRollbackSql, /SET enabled = false/);

    const emptyDropSql = readFileSync(
      resolve(process.cwd(), "database/runbooks/baby_aylla_gift_registry_empty_env_drop.sql"),
      "utf8"
    );
    assert.match(emptyDropSql, /ROLLBACK_ABORTED_OPERATIONAL_DATA_PRESENT/);
  });

  it("enforces OTP contact rate limiting across separate service instances sharing persistent store state", async () => {
    process.env.HAXR_AYLLA_GIFT_PEPPER = "gate-e-rate-limit-pepper-32-chars-minimum";
    const sharedStore = createInMemoryAyllaGiftStore();

    // Two separate serverless worker instances backing onto the same shared store
    for (let attempt = 1; attempt <= 5; attempt++) {
      const workerService = getCoreAyllaGiftService(sharedStore);
      const res = await workerService.requestVerification("84 123 4567", `10.0.0.${attempt}`);
      assert.equal(res.outcome, "verification_pending");
    }

    const overflowWorker = getCoreAyllaGiftService(sharedStore);
    const blocked = await overflowWorker.requestVerification("+258 841234567", "10.0.0.99");
    assert.equal(blocked.outcome, "rate_limited");
  });

  it("enforces email-only OTP launch without Twilio creds, prevents unusable challenges, and preserves future phone channels", async () => {
    process.env.HAXR_AYLLA_GIFT_PEPPER = "gate-e-email-only-pepper-32-chars-minimum";
    process.env.RESEND_API_KEY = "re_test_mock_key";
    process.env.HAXR_AYLLA_OTP_WHATSAPP_ENABLED = "false";
    process.env.HAXR_AYLLA_OTP_SMS_ENABLED = "false";
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;

    const supported = getAyllaOtpSupportedChannels();
    assert.deepEqual(supported, { email: true, phone: false });

    const html = buildAyllaOtpEmailHtml("482910");
    const text = buildAyllaOtpEmailText("482910");
    assert.match(html, /#FBF8F5/);
    assert.match(html, /#C87A6E/);
    assert.match(html, /#D8C39D/);
    assert.match(html, /482910/);
    assert.match(html, /10 minutos/);
    assert.match(html, /hello@haxrsignature\.com/);
    assert.match(text, /482910/);
    assert.match(text, /10 minutos/);

    // Future WhatsApp/SMS infrastructure remains intact when explicitly re-enabled
    const reenabled = getAyllaOtpSupportedChannels({
      RESEND_API_KEY: "re_test_mock_key",
      HAXR_AYLLA_OTP_WHATSAPP_ENABLED: "true",
      HAXR_AYLLA_OTP_SMS_ENABLED: "false",
      TWILIO_ACCOUNT_SID: "AC_FUTURE",
      TWILIO_AUTH_TOKEN: "tok_future",
      TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
    });
    assert.deepEqual(reenabled, { email: true, phone: true });

    let createChallengeCalls = 0;
    const confirmedEmailGuest = {
      id: "guest-email-only-1",
      eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
      name: "Tia Helena",
      contact: "helena@haxr-test.local",
      status: "confirmed" as const,
      source: "edition_rsvp" as const,
      archived: false,
      deleted: false,
      incorrect: false,
    };
    const phoneOnlyConfirmedGuest = {
      id: "guest-phone-only-1",
      eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
      name: "Tio Artur",
      contact: "+258841112233",
      status: "confirmed" as const,
      source: "edition_rsvp" as const,
      archived: false,
      deleted: false,
      incorrect: false,
    };

    const baseStore = createInMemoryAyllaGiftStore({
      guests: [confirmedEmailGuest, phoneOnlyConfirmedGuest],
    });
    const instrumentedStore = {
      ...baseStore,
      async createChallenge(input: Parameters<typeof baseStore.createChallenge>[0]) {
        createChallengeCalls += 1;
        return baseStore.createChallenge(input);
      },
    };

    // 1. Phone contact must NOT create a challenge when phone channels are disabled
    const prodService = getCoreAyllaGiftService(instrumentedStore);
    const phoneAttempt = await prodService.requestVerification("+258841112233", "10.0.1.1");
    assert.equal(phoneAttempt.outcome, "verification_pending");
    assert.equal(createChallengeCalls, 0);

    // 2. Phone-only confirmed guest cannot verify using an arbitrary unlinked email
    const arbitraryEmailAttempt = await prodService.requestVerification("artur.novo@haxr-test.local", "10.0.1.2");
    assert.equal(arbitraryEmailAttempt.outcome, "verification_pending");
    assert.equal(createChallengeCalls, 0);

    // 3. Duplicate email lookup prioritizes active confirmed edition_rsvp guest over archived/pending duplicate
    const dupStore = createInMemoryAyllaGiftStore({
      guests: [
        {
          id: "guest-dup-eligible",
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          name: "Convidada Activa",
          contact: "dup@haxr-test.local",
          status: "confirmed",
          source: "edition_rsvp",
          archived: false,
          deleted: false,
          incorrect: false,
        },
        {
          id: "guest-dup-archived",
          eventId: CANONICAL_BABY_AYLLA_EVENT_ID,
          name: "Convidada Arquivada",
          contact: "dup@haxr-test.local",
          status: "pending",
          source: "edition_rsvp",
          archived: true,
          deleted: false,
          incorrect: false,
        },
      ],
    });
    const resolvedDup = await dupStore.findGuestByContact(CANONICAL_BABY_AYLLA_EVENT_ID, "DUP@HAXR-TEST.LOCAL");
    assert.equal(resolvedDup?.id, "guest-dup-eligible");

    // 4. Resend delivery failure / rate limit + disabled Brevo fallback must NOT persist an unusable challenge
    let failedChallengeCount = 0;
    const failDeliveryStore = createInMemoryAyllaGiftStore({ guests: [confirmedEmailGuest] });
    const failingEmailProvider = createProductionAyllaOtpDeliveryProvider({
      env: {
        RESEND_API_KEY: "re_test_mock_key",
        EMAIL_SEND_MODE: "disabled",
        BREVO_API_KEY: "xkeysib_unused_when_disabled",
      },
      sendEmailFn: async () => ({ ok: false, error: "rate_limit_exceeded" }),
      sendBrevoEmailFn: async () => {
        throw new Error("Brevo must not run when EMAIL_SEND_MODE is disabled");
      },
    });
    const { createCoreAyllaGiftService } = await import("../service");
    const serviceWithFailedResend = createCoreAyllaGiftService({
      store: {
        ...failDeliveryStore,
        async createChallenge(input) {
          failedChallengeCount += 1;
          return failDeliveryStore.createChallenge(input);
        },
      },
      pepper: "gate-e-email-only-pepper-32-chars-minimum",
      supportedChannels: { email: true, phone: false },
      deliveryProvider: failingEmailProvider,
    });
    const failedRes = await serviceWithFailedResend.requestVerification("helena@haxr-test.local", "10.0.1.3");
    assert.equal(failedRes.outcome, "verification_pending");
    assert.equal(failedChallengeCount, 0);
    const verifyFailedRes = await serviceWithFailedResend.verifyChallenge(failedRes.challengeId, "123456", "10.0.1.3");
    assert.equal(verifyFailedRes.outcome, "verification_required");

    // 5. Throwing delivery provider also leaves zero usable challenges in DB
    const serviceWithThrowingProvider = createCoreAyllaGiftService({
      store: {
        ...failDeliveryStore,
        async createChallenge(input) {
          failedChallengeCount += 1;
          return failDeliveryStore.createChallenge(input);
        },
      },
      pepper: "gate-e-email-only-pepper-32-chars-minimum",
      supportedChannels: { email: true, phone: false },
      deliveryProvider: {
        async sendVerificationCode() {
          throw new Error("NETWORK_ABORTED");
        },
      },
    });
    const thrownRes = await serviceWithThrowingProvider.requestVerification("helena@haxr-test.local", "10.0.1.4");
    assert.equal(thrownRes.outcome, "verification_pending");
    assert.equal(failedChallengeCount, 0);

    // 6. Successful Resend email OTP creates challenge, verifies, issues session, and exposes email-only otpChannels
    let capturedEmailText = "";
    const okProvider = createProductionAyllaOtpDeliveryProvider({
      env: { RESEND_API_KEY: "re_test_mock_key" },
      sendEmailFn: async (msg) => {
        capturedEmailText = msg.text ?? "";
        return { ok: true };
      },
    });
    const serviceOk = createCoreAyllaGiftService({
      store: failDeliveryStore,
      pepper: "gate-e-email-only-pepper-32-chars-minimum",
      supportedChannels: { email: true, phone: false },
      deliveryProvider: okProvider,
    });
    const snapshot = await serviceOk.getCatalogAvailability(null);
    assert.deepEqual(snapshot.otpChannels, { email: true, phone: false });

    const reqOk = await serviceOk.requestVerification("Helena@Haxr-Test.local", "10.0.1.5");
    assert.equal(reqOk.outcome, "verification_pending");
    const otpMatch = capturedEmailText.match(/\b(\d{6})\b/);
    assert.ok(otpMatch, "Plain text OTP fallback should contain the 6-digit code");
    const verifyOk = await serviceOk.verifyChallenge(reqOk.challengeId, otpMatch[1], "10.0.1.5");
    assert.equal(verifyOk.outcome, "verified");
    if (verifyOk.outcome !== "verified") throw new Error("Expected verified");
    const resolvedSession = await serviceOk.resolveSession(verifyOk.sessionToken);
    assert.equal(resolvedSession.valid, true);
  });
});
