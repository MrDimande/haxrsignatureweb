import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { InvitationCampaignService } from "./campaign-service";
import { InMemoryIdempotencyStore } from "./provider/fail-closed";
import {
  computeTwilioSignature,
  validateTwilioRequestSignature,
} from "./provider/twilio-signature";
import {
  isSandboxRecipientAllowed,
  resolveTwilioWhatsappConfig,
} from "./provider/twilio-config";
import {
  mapTwilioMessageStatus,
  shouldApplyTwilioStatus,
} from "./provider/twilio-status";
import {
  getWhatsappSendMode,
  gateAutomaticProvider,
  parseWhatsappSendMode,
} from "./send-mode";
import {
  extractTemplateVariables,
  renderTemplate,
  validateTemplateVariables,
} from "./template";
import {
  assertAllowedSenderKind,
  buildHaxrManualSenderDefaults,
  maskPhoneNumber,
} from "./sender-profiles";
import { HAXR_MANUAL_WHATSAPP_SENDER } from "./haxr-manual-sender";
import { buildPersonalizedInvitationUrl } from "./invitation-url";
import {
  assertManualModeEnabled,
  exportCampaignCsv,
  buildCampaignExportRows,
} from "./manual-ops";

const EVENT_A = "11111111-1111-1111-1111-111111111111";
const EVENT_B = "22222222-2222-2222-2222-222222222222";

const BASE_TEMPLATE =
  "Olá {{guest_name}}! {{couple_names}} · {{event_name}} em {{event_date}} @ {{event_location}}. RSVP {{rsvp_deadline}}: {{invitation_url}} — {{sender_name}}";

const TWILIO_ENV = {
  TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  TWILIO_AUTH_TOKEN: "test_auth_token_secret",
  TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
  TWILIO_STATUS_CALLBACK_URL:
    "https://www.haxrsignature.com/api/webhooks/twilio/whatsapp-status",
  TWILIO_SANDBOX_ALLOWLIST: "258840000000,258840000001",
};

function makeGuests(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    guestId: `guest-${i + 1}`,
    guestName: `Convidado ${i + 1}`,
    phone: `258840000${String(i).padStart(3, "0")}`,
  }));
}

function applyTwilioEnv(): void {
  for (const [key, value] of Object.entries(TWILIO_ENV)) {
    process.env[key] = value;
  }
  delete process.env.HAXR_TWILIO_LIVE_SEND;
}

describe("invitation campaigns domain", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.HAXR_WHATSAPP_SEND_MODE;
    delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
    for (const key of Object.keys(TWILIO_ENV)) {
      delete process.env[key];
    }
    delete process.env.HAXR_TWILIO_LIVE_SEND;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults send mode to disabled (fail-closed)", () => {
    assert.equal(parseWhatsappSendMode(undefined), "disabled");
    assert.equal(getWhatsappSendMode(process.env), "disabled");
    const gate = gateAutomaticProvider({
      mode: "disabled",
      hasConfiguredProvider: true,
      hasProviderCredentials: true,
    });
    assert.equal(gate.allowed, false);
  });

  it("manual mode blocks automatic provider and expects HAXR Signature sender", () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    assert.equal(getWhatsappSendMode(), "manual");
    const gate = gateAutomaticProvider({ mode: "manual" });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /manual/i);
    const defaults = buildHaxrManualSenderDefaults(EVENT_A);
    assert.equal(defaults.publicName, "HAXR Signature");
    assert.equal(defaults.phone, HAXR_MANUAL_WHATSAPP_SENDER.phoneE164);
  });

  it("rejects unknown template variables", () => {
    const result = validateTemplateVariables("Hi {{guest_name}} {{evil_var}}");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.unknownVariables, ["evil_var"]);
    }
  });

  it("accepts only the exact allowed variable set", () => {
    const vars = extractTemplateVariables(BASE_TEMPLATE);
    assert.deepEqual(
      [...vars].sort(),
      [
        "couple_names",
        "event_date",
        "event_location",
        "event_name",
        "guest_name",
        "invitation_url",
        "rsvp_deadline",
        "sender_name",
      ]
    );
    const rendered = renderTemplate(BASE_TEMPLATE, {
      guest_name: "Maria",
      couple_names: "Ana & João",
      event_name: "Casamento",
      event_date: "10 Ago",
      event_location: "Maputo",
      invitation_url: "https://edition.haxrsignature.com/demo",
      rsvp_deadline: "1 Ago",
      sender_name: "HAXR",
    });
    assert.match(rendered, /Maria/);
    assert.match(rendered, /HAXR/);
  });

  it("creates campaign, changes sender, edits message", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const service = new InvitationCampaignService();
    const senderA = service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "HAXR oficial",
      phone: "+258841112233",
      isDefault: true,
    });
    const senderB = service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "manual_authenticated_whatsapp",
      publicName: HAXR_MANUAL_WHATSAPP_SENDER.publicName,
      phone: HAXR_MANUAL_WHATSAPP_SENDER.phoneE164,
    });
    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Convites piloto",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: BASE_TEMPLATE,
      eventName: "Casamento",
      eventDate: "15 Ago",
      eventLocation: "Maputo",
      coupleNames: "Jessica & Samuel",
      rsvpDeadline: "1 Ago",
      guests: makeGuests(2),
      senderProfileId: senderA.id,
    });
    service.setCampaignSender(EVENT_A, campaign.id, senderB.id);
    service.editCampaignMessage(
      EVENT_A,
      campaign.id,
      "Oi {{guest_name}} — {{sender_name}}"
    );
    const recipients = service.listRecipients(EVENT_A, campaign.id);
    assert.equal(recipients.length, 2);
    assert.match(recipients[0].renderedMessage, /HAXR Signature/);
  });

  it("generates 100 personalized previews without duplication", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "manual_authenticated_whatsapp",
      publicName: "HAXR Signature",
      phone: "+258870883428",
      isDefault: true,
    });
    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Lote 100",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}} {{invitation_url}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(100),
      previewLimit: 100,
    });
    const previews = service.previewRecipients(EVENT_A, campaign.id, 100);
    assert.equal(previews.length, 100);
    const urls = new Set(previews.map((p) => p.invitationUrl));
    assert.equal(urls.size, 100);
  });

  it("idempotent campaign create by key", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const store = new InMemoryIdempotencyStore();
    const service = new InvitationCampaignService(
      undefined,
      () => "manual",
      store
    );
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "HAXR",
      phone: "258841112233",
      isDefault: true,
    });
    const first = await service.createCampaign({
      eventId: EVENT_A,
      name: "A",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(1),
      idempotencyKey: "camp-1",
    });
    const second = await service.createCampaign({
      eventId: EVENT_A,
      name: "A",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(1),
      idempotencyKey: "camp-1",
    });
    assert.equal(first.id, second.id);
  });

  it("never crosses event_id boundaries", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "A",
      phone: "258841112233",
      isDefault: true,
    });
    service.createSenderProfile({
      eventId: EVENT_B,
      senderKind: "haxr_official",
      publicName: "B",
      phone: "258841112244",
      isDefault: true,
    });
    const campaignA = await service.createCampaign({
      eventId: EVENT_A,
      name: "A",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "A",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(1),
    });
    assert.throws(
      () => service.listRecipients(EVENT_B, campaignA.id),
      /isolamento/i
    );
    assert.equal(service.getCampaign(EVENT_B, campaignA.id), null);
    assert.equal(service.listCampaigns(EVENT_B).length, 0);
  });

  it("blocks manual ops when send mode is disabled", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "disabled";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "manual_authenticated_whatsapp",
      publicName: "Manual",
      phone: "258840000001",
      isDefault: true,
    });
    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "X",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(1),
    });
    const recipient = service.listRecipients(EVENT_A, campaign.id)[0];
    assert.throws(
      () =>
        service.performManualAction(
          EVENT_A,
          campaign.id,
          recipient.id,
          "mark_sent"
        ),
      /desactivad/i
    );
    assert.throws(() => assertManualModeEnabled("disabled"), /desactivad/i);
  });

  it("supports manual mark sent + export without provider calls", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "manual_authenticated_whatsapp",
      publicName: "HAXR Signature",
      phone: "+258870883428",
      isDefault: true,
    });
    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Manual",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}} {{invitation_url}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      guests: makeGuests(2),
    });
    const [first] = service.listRecipients(EVENT_A, campaign.id);
    const updated = service.performManualAction(
      EVENT_A,
      campaign.id,
      first.id,
      "mark_sent"
    );
    assert.equal(updated.status, "marked_sent");

    const blocked = await service.attemptAutomaticSend(EVENT_A, campaign.id);
    assert.equal(blocked.blocked, true);

    const csv = service.exportCampaign(EVENT_A, campaign.id);
    assert.match(csv, /guest_name/);
    assert.match(csv, /Convidado 1/);
    const rows = buildCampaignExportRows(
      service.listRecipients(EVENT_A, campaign.id)
    );
    assert.equal(exportCampaignCsv(rows).split("\n").length, 3);
  });

  it("rejects arbitrary free sender kinds", () => {
    assert.throws(
      () => assertAllowedSenderKind("random_whatsapp_number"),
      /não permitido/i
    );
    assert.equal(maskPhoneNumber("258841112233"), "258*****2233");
  });

  it("builds personalized invitation url without internal ids", () => {
    const result = buildPersonalizedInvitationUrl({
      invitationRegistryKey: "traditional-wedding",
      guestName: "Maria Silva",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(
        result.url,
        /^https:\/\/edition\.haxrsignature\.com\/jessicaesamueltraditionalwedding/
      );
      assert.match(result.url, /guest=Maria/);
      assert.doesNotMatch(result.url, /guestId|campaignId|[0-9a-f-]{36}/i);
    }
  });

  it("twilio_production remains fail-closed even with credentials", () => {
    applyTwilioEnv();
    process.env.HAXR_WHATSAPP_SEND_MODE = "twilio_production";
    const gate = gateAutomaticProvider({ mode: "twilio_production" });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /não está activado/i);
  });

  it("twilio_sandbox fails closed without config or allowlist", () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "twilio_sandbox";
    const gate = gateAutomaticProvider({ mode: "twilio_sandbox" });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /incompleta|Allowlist|fail-closed/i);
  });

  it("twilio_sandbox allows gate when config + allowlist present", () => {
    applyTwilioEnv();
    process.env.HAXR_WHATSAPP_SEND_MODE = "twilio_sandbox";
    const resolved = resolveTwilioWhatsappConfig(process.env, "twilio_sandbox");
    assert.equal(resolved.ok, true);
    const gate = gateAutomaticProvider({ mode: "twilio_sandbox" });
    assert.equal(gate.allowed, true);
  });

  it("rejects TWILIO_WHATSAPP_FROM equal to manual HAXR number", () => {
    applyTwilioEnv();
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+258870883428";
    const resolved = resolveTwilioWhatsappConfig(process.env, "twilio_sandbox");
    assert.equal(resolved.ok, false);
    if (!resolved.ok) {
      assert.match(resolved.reason, /não pode ser/i);
    }
  });

  it("sandbox allowlist blocks non-listed recipients", () => {
    assert.equal(
      isSandboxRecipientAllowed("258840000000", ["258840000000"]),
      true
    );
    assert.equal(
      isSandboxRecipientAllowed("258849999999", ["258840000000"]),
      false
    );
  });

  it("validates Twilio webhook signatures and maps statuses", () => {
    const url = TWILIO_ENV.TWILIO_STATUS_CALLBACK_URL;
    const params = {
      MessageSid: "SMxxxxxxxx",
      MessageStatus: "delivered",
      To: "whatsapp:+258840000000",
    };
    const signature = computeTwilioSignature(
      TWILIO_ENV.TWILIO_AUTH_TOKEN,
      url,
      params
    );
    const ok = validateTwilioRequestSignature({
      authToken: TWILIO_ENV.TWILIO_AUTH_TOKEN,
      signatureHeader: signature,
      url,
      params,
    });
    assert.equal(ok.ok, true);

    const bad = validateTwilioRequestSignature({
      authToken: TWILIO_ENV.TWILIO_AUTH_TOKEN,
      signatureHeader: "invalid",
      url,
      params,
    });
    assert.equal(bad.ok, false);

    assert.equal(mapTwilioMessageStatus("delivered"), "delivered");
    assert.equal(mapTwilioMessageStatus("undelivered"), "failed");
    assert.equal(shouldApplyTwilioStatus("sent", "delivered"), true);
    assert.equal(shouldApplyTwilioStatus("delivered", "sent"), false);
  });

  it("enqueues sandbox dry-run only for allowlisted numbers without live send", async () => {
    applyTwilioEnv();
    process.env.HAXR_WHATSAPP_SEND_MODE = "twilio_sandbox";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "Twilio Sandbox",
      phone: "+14155238886",
      isDefault: true,
    });
    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Sandbox canary",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Teste {{guest_name}} {{invitation_url}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      testMode: true,
      guests: [
        {
          guestId: "g1",
          guestName: "Allowlisted",
          phone: "258840000000",
        },
        {
          guestId: "g2",
          guestName: "Real guest blocked",
          phone: "258849999999",
        },
      ],
    });

    const result = await service.enqueueTwilioSandbox(EVENT_A, campaign.id);
    assert.equal(result.blocked, false);
    assert.equal(result.dryRun, true);
    assert.equal(result.enqueued, 1);
    assert.equal(result.skipped, 1);

    const recipients = service.listRecipients(EVENT_A, campaign.id);
    const queued = recipients.find((r) => r.guestName === "Allowlisted");
    const skipped = recipients.find((r) => r.guestName === "Real guest blocked");
    assert.equal(queued?.status, "queued");
    assert.ok(queued?.providerMessageSid?.startsWith("DRYRUN_"));
    assert.equal(skipped?.status, "skipped");

    // Status callback with valid signature
    const sid = queued!.providerMessageSid!;
    const params = {
      MessageSid: sid,
      MessageStatus: "delivered",
    };
    const signature = computeTwilioSignature(
      TWILIO_ENV.TWILIO_AUTH_TOKEN,
      TWILIO_ENV.TWILIO_STATUS_CALLBACK_URL,
      params
    );
    const applied = service.applyTwilioStatusWebhook({
      signatureHeader: signature,
      callbackUrl: TWILIO_ENV.TWILIO_STATUS_CALLBACK_URL,
      params,
    });
    assert.equal(applied.accepted, true);
    assert.equal(applied.status, "delivered");
  });

  it("rejects status webhook without valid signature", async () => {
    applyTwilioEnv();
    process.env.HAXR_WHATSAPP_SEND_MODE = "twilio_sandbox";
    const service = new InvitationCampaignService();
    const rejected = service.applyTwilioStatusWebhook({
      signatureHeader: "nope",
      callbackUrl: TWILIO_ENV.TWILIO_STATUS_CALLBACK_URL,
      params: { MessageSid: "SM1", MessageStatus: "sent" },
    });
    assert.equal(rejected.accepted, false);
  });
});
