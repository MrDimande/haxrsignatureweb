import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { computeTwilioSignature } from "@/lib/messaging/sms/signature";
import {
  buildInvitationSmsMessage,
  buildSmsIdempotencyKey,
  confirmWhatsappToSmsFallback,
  countSmsCharacters,
  createFailClosedSmsPreviewProvider,
  createSmsStubStack,
  detectSmsEncoding,
  estimateSmsSegments,
  fingerprintSmsBody,
  gateSmsSend,
  getSmsSendMode,
  handleTwilioSmsStatusCallback,
  hasTwilioSmsCredentials,
  isHaxrManualWhatsappAsSmsFrom,
  mapTwilioSmsMessageStatus,
  MockMessagingProvider,
  parseSmsSendMode,
  planWhatsappToSmsFallback,
  resolveTwilioSmsConfig,
  shouldApplySmsStatus,
  SMS_FALLBACK_CONFIRM_ACTION,
  TwilioSmsMessagingProvider,
} from "@/lib/messaging/index";
import {
  createMockTwilioSmsClient,
  createTwilioSmsClient,
} from "@/lib/messaging/sms/client";

const SMS_ENV = {
  TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  TWILIO_AUTH_TOKEN: "test_sms_auth_token_secret",
  TWILIO_SMS_FROM: "+15551234567",
  TWILIO_STATUS_CALLBACK_URL:
    "https://www.haxrsignature.com/api/webhooks/twilio/sms-status",
  TWILIO_SMS_SANDBOX_ALLOWLIST: "258840000000,258840000001",
};

function applySmsEnv(): void {
  for (const [key, value] of Object.entries(SMS_ENV)) {
    process.env[key] = value;
  }
  delete process.env.HAXR_TWILIO_SMS_LIVE_SEND;
  process.env.HAXR_SMS_SEND_MODE = "sms_sandbox_or_test";
}

describe("messaging SMS abstraction", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.HAXR_SMS_SEND_MODE;
    delete process.env.HAXR_TWILIO_SMS_LIVE_SEND;
    for (const key of Object.keys(SMS_ENV)) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults SMS mode to disabled (fail-closed)", () => {
    assert.equal(parseSmsSendMode(undefined), "disabled");
    assert.equal(getSmsSendMode(process.env), "disabled");
    const gate = gateSmsSend({ mode: "disabled", configOk: true });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /fail-closed|disabled/i);
  });

  it("blocks sms_production by default (fail-closed)", () => {
    const gate = gateSmsSend({ mode: "sms_production", configOk: true });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /sms_production|fail-closed/i);
  });

  it("rejects HAXR manual WhatsApp number as TWILIO_SMS_FROM", () => {
    assert.equal(isHaxrManualWhatsappAsSmsFrom("+258870883428"), true);
    assert.equal(isHaxrManualWhatsappAsSmsFrom("+258 87 088 3428"), true);
    process.env.TWILIO_ACCOUNT_SID = SMS_ENV.TWILIO_ACCOUNT_SID;
    process.env.TWILIO_AUTH_TOKEN = SMS_ENV.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_SMS_FROM = "+258870883428";
    process.env.TWILIO_STATUS_CALLBACK_URL = SMS_ENV.TWILIO_STATUS_CALLBACK_URL;
    const resolved = resolveTwilioSmsConfig(process.env);
    assert.equal(resolved.ok, false);
    if (!resolved.ok) {
      assert.match(resolved.reason, /258 87 088 3428|manual WhatsApp/i);
      assert.ok(resolved.missing.includes("TWILIO_SMS_FROM"));
    }
  });

  it("fail-closed when SMS credentials missing", () => {
    assert.equal(hasTwilioSmsCredentials(process.env), false);
    const resolved = resolveTwilioSmsConfig(process.env);
    assert.equal(resolved.ok, false);
    if (!resolved.ok) {
      assert.ok(resolved.missing.includes("TWILIO_SMS_FROM"));
      assert.ok(resolved.missing.includes("TWILIO_ACCOUNT_SID"));
    }
  });

  it("Preview without credentials blocks send (fail-closed proof)", async () => {
    const provider = createFailClosedSmsPreviewProvider(process.env);
    const result = await provider.send({
      channel: "sms_sandbox_or_test",
      recipient: {
        id: "r1",
        phoneE164: "+258840000000",
      },
      message: {
        body: "Ola! Convite: https://example.com/i/abc",
        idempotencyKey: "sms:test:r1",
        invitationUrl: "https://example.com/i/abc",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.dryRun, true);
    assert.equal(result.status, "blocked");
    assert.ok(result.error);
  });

  it("sms_production channel always blocked even with config", async () => {
    applySmsEnv();
    const config = resolveTwilioSmsConfig(process.env);
    assert.equal(config.ok, true);
    if (!config.ok) return;
    const provider = new TwilioSmsMessagingProvider({
      config: config.config,
      client: createMockTwilioSmsClient(),
      env: process.env,
    });
    const result = await provider.send({
      channel: "sms_production",
      recipient: { id: "r1", phoneE164: "+258840000000" },
      message: {
        body: "test",
        idempotencyKey: "sms:prod:r1",
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, "blocked");
    assert.match(result.error ?? "", /fail-closed/i);
  });

  it("sandbox dry-run succeeds with allowlist and never live-sends by default", async () => {
    applySmsEnv();
    const resolved = resolveTwilioSmsConfig(process.env);
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.config.liveSendEnabled, false);

    const provider = new TwilioSmsMessagingProvider({
      config: resolved.config,
      client: createTwilioSmsClient(resolved.config),
      env: process.env,
      eventId: "evt-1",
    });

    const result = await provider.send({
      channel: "sms_sandbox_or_test",
      recipient: { id: "r1", phoneE164: "+258840000000" },
      message: {
        body: "Ola! https://haxr.example/i/1",
        idempotencyKey: "sms:evt-1:r1:v1",
        invitationUrl: "https://haxr.example/i/1",
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.dryRun, true);
    assert.ok(result.providerMessageId?.startsWith("DRYRUN_SMS_"));
  });

  it("blocks recipient outside SMS sandbox allowlist", async () => {
    applySmsEnv();
    const resolved = resolveTwilioSmsConfig(process.env);
    assert.ok(resolved.ok);
    if (!resolved.ok) return;
    const provider = new TwilioSmsMessagingProvider({
      config: resolved.config,
      client: createMockTwilioSmsClient(),
      env: process.env,
    });
    const result = await provider.send({
      channel: "sms_sandbox_or_test",
      recipient: { id: "guest-real", phoneE164: "+258849999999" },
      message: { body: "x", idempotencyKey: "sms:allow:1" },
    });
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /allowlist/i);
  });

  it("never duplicates SMS when WhatsApp already delivered", async () => {
    applySmsEnv();
    const resolved = resolveTwilioSmsConfig(process.env);
    assert.ok(resolved.ok);
    if (!resolved.ok) return;
    const provider = new TwilioSmsMessagingProvider({
      config: resolved.config,
      client: createMockTwilioSmsClient(),
      env: process.env,
    });
    const result = await provider.send({
      channel: "sms_sandbox_or_test",
      recipient: {
        id: "r1",
        phoneE164: "+258840000000",
        whatsappDelivered: true,
      },
      message: { body: "x", idempotencyKey: "sms:dup:1" },
    });
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /duplic/i);
  });

  it("builds short invitation SMS with URL", () => {
    const built = buildInvitationSmsMessage({
      guestName: "Ana",
      coupleNames: "J&S",
      invitationUrl: "https://haxr.example/i/ana",
    });
    assert.match(built.body, /Ana/);
    assert.match(built.body, /https:\/\/haxr\.example\/i\/ana/);
    assert.equal(built.invitationUrl, "https://haxr.example/i/ana");
  });

  it("detects GSM-7 vs Unicode and estimates segments with cost warning", () => {
    assert.equal(detectSmsEncoding("Ola Ana! RSVP https://x.test/a"), "gsm7");
    assert.equal(detectSmsEncoding("Olá Ana — 🎉"), "ucs2");
    assert.equal(countSmsCharacters("abc"), 3);

    const short = estimateSmsSegments("Ola! https://x.test/a");
    assert.equal(short.segmentCount, 1);
    assert.equal(short.costWarning, null);

    const longGsm = estimateSmsSegments("A".repeat(200));
    assert.ok(longGsm.segmentCount >= 2);
    assert.ok(longGsm.costWarning);

    const unicode = estimateSmsSegments("🎉".repeat(40));
    assert.equal(unicode.encoding, "ucs2");
    assert.ok(unicode.segmentCount >= 1);
  });

  it("builds stable idempotency keys", () => {
    const key = buildSmsIdempotencyKey({
      eventId: "e1",
      campaignId: "c1",
      recipientId: "r1",
      channel: "sms_sandbox_or_test",
      bodyFingerprint: fingerprintSmsBody("hello"),
    });
    assert.ok(key.length <= 64);
    assert.match(key, /^sms/);
  });

  it("maps Twilio SMS statuses including undelivered", () => {
    assert.equal(mapTwilioSmsMessageStatus("delivered"), "delivered");
    assert.equal(mapTwilioSmsMessageStatus("failed"), "failed");
    assert.equal(mapTwilioSmsMessageStatus("undelivered"), "undelivered");
    assert.equal(shouldApplySmsStatus("sent", "delivered"), true);
    assert.equal(shouldApplySmsStatus("delivered", "sent"), false);
    assert.equal(shouldApplySmsStatus("failed", "delivered"), false);
  });

  it("validates SMS webhook signature and accepts delivered status", () => {
    const authToken = "test_sms_auth_token_secret";
    const url =
      "https://www.haxrsignature.com/api/webhooks/twilio/sms-status";
    const params = {
      MessageSid: "SMxxxxxxxx",
      MessageStatus: "delivered",
      To: "+258840000000",
      From: "+15551234567",
    };
    const signature = computeTwilioSignature(authToken, url, params);
    const result = handleTwilioSmsStatusCallback({
      authToken,
      signatureHeader: signature,
      callbackUrl: url,
      params,
    });
    assert.equal(result.accepted, true);
    if (result.accepted) {
      assert.equal(result.event.status, "delivered");
      assert.equal(result.applied, true);
    }
  });

  it("rejects SMS webhook without signature", () => {
    const result = handleTwilioSmsStatusCallback({
      authToken: "token",
      signatureHeader: null,
      callbackUrl: "https://example.com/cb",
      params: { MessageSid: "SM1", MessageStatus: "failed" },
    });
    assert.equal(result.accepted, false);
  });

  it("WhatsApp→SMS fallback is not automatic and requires human action", () => {
    const plan = planWhatsappToSmsFallback([
      {
        recipient: { id: "a", phoneE164: "+258840000000", whatsappDelivered: true },
        whatsappStatus: "delivered",
      },
      {
        recipient: { id: "b", phoneE164: "+258840000001" },
        whatsappStatus: "failed",
      },
    ]);
    assert.equal(plan.automatic, false);
    assert.equal(plan.requiresHumanConfirmation, true);
    assert.equal(plan.confirmActionLabel, SMS_FALLBACK_CONFIRM_ACTION);
    assert.equal(plan.eligibleCount, 1);
    assert.equal(plan.skippedDeliveredWhatsapp, 1);

    const denied = confirmWhatsappToSmsFallback({
      plan,
      confirmedAction: "enviar automatico",
      confirmedBy: "ops",
    });
    assert.equal(denied.ok, false);

    const ok = confirmWhatsappToSmsFallback({
      plan,
      confirmedAction: SMS_FALLBACK_CONFIRM_ACTION,
      confirmedBy: "ops@haxr",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.deepEqual(
        ok.recipients.map((r) => r.id),
        ["b"]
      );
    }
  });

  it("stubs expose fail-closed queue and opt-out / audit", async () => {
    const stack = createSmsStubStack();
    const enqueue = await stack.queue.enqueue({
      eventId: "e",
      recipientId: "r",
      idempotencyKey: "k",
      phoneE164: "+258840000000",
      body: "x",
    });
    assert.equal(enqueue.enqueued, false);
    if (!enqueue.enqueued) {
      assert.equal(enqueue.blocked, true);
    }

    await stack.optOut.recordOptOut("+258840000000");
    assert.equal(await stack.optOut.isOptedOut("+258840000000"), true);

    await stack.audit.record({
      at: new Date().toISOString(),
      action: "test",
      detail: "no_secrets",
    });
    assert.equal((await stack.audit.list()).length, 1);
  });

  it("MockMessagingProvider never hits network", async () => {
    const mock = new MockMessagingProvider(undefined, "blocked");
    const result = await mock.send({
      channel: "sms_sandbox_or_test",
      recipient: { id: "r", phoneE164: "+258840000000" },
      message: { body: "hi", idempotencyKey: "m1" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.dryRun, true);
  });
});
