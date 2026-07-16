import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { InvitationCampaignService } from "./campaign-service";
import { InMemoryIdempotencyStore } from "./provider/fail-closed";
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
import { assertAllowedSenderKind, maskPhoneNumber } from "./sender-profiles";
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

function makeGuests(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    guestId: `guest-${i + 1}`,
    guestName: `Convidado ${i + 1}`,
    phone: `258840000${String(i).padStart(3, "0")}`,
  }));
}

describe("invitation campaigns domain", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.HAXR_WHATSAPP_SEND_MODE;
    delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
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

  it("manual mode blocks automatic provider", () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    assert.equal(getWhatsappSendMode(), "manual");
    const gate = gateAutomaticProvider({
      mode: "manual",
      hasConfiguredProvider: false,
      hasProviderCredentials: false,
    });
    assert.equal(gate.allowed, false);
    assert.match(gate.reason, /manual/i);
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
      senderKind: "client_verified_business",
      publicName: "Empresa Cliente",
      phone: "+258849998877",
    });

    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Lote A",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: BASE_TEMPLATE,
      coupleNames: "Jessica & Samuel",
      rsvpDeadline: "20 Ago",
      eventName: "Casamento Tradicional",
      eventDate: "30 Ago 2026",
      eventLocation: "Maputo",
      guests: makeGuests(3),
    });

    assert.equal(campaign.senderProfileId, senderA.id);
    assert.equal(service.listRecipients(EVENT_A, campaign.id).length, 3);

    service.setCampaignSender(EVENT_A, campaign.id, senderB.id);
    const afterSender = service.listRecipients(EVENT_A, campaign.id);
    assert.ok(afterSender.every((r) => r.renderedMessage.includes("Empresa Cliente")));

    service.updateMessageTemplate(
      EVENT_A,
      campaign.id,
      "Olá {{guest_name}} — {{sender_name}} · {{invitation_url}}"
    );
    const afterMsg = service.listRecipients(EVENT_A, campaign.id);
    assert.ok(afterMsg.every((r) => r.renderedMessage.startsWith("Olá Convidado")));
    assert.ok(
      afterMsg.every((r) =>
        r.invitationUrl.includes("jessicaesamueltraditionalwedding")
      )
    );
    assert.ok(afterMsg.every((r) => !r.invitationUrl.includes(r.guestId ?? "___")));
  });

  it("generates 100 personalized previews", async () => {
    process.env.HAXR_WHATSAPP_SEND_MODE = "manual";
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "manual_authenticated_whatsapp",
      publicName: "Ops Manual",
      phone: "258840001111",
      isDefault: true,
    });

    const campaign = await service.createCampaign({
      eventId: EVENT_A,
      name: "Lote 100",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}! Link: {{invitation_url}}",
      eventName: "Evento",
      eventDate: "1 Set",
      eventLocation: "Maputo",
      guests: makeGuests(100),
    });

    const previews = service.previewRecipients(EVENT_A, campaign.id, 100);
    assert.equal(previews.length, 100);
    const uniqueMessages = new Set(previews.map((p) => p.renderedMessage));
    assert.equal(uniqueMessages.size, 100);
    assert.ok(previews.every((p) => p.renderedMessage.includes("Convidado")));
    assert.ok(
      previews.every((p) => p.invitationUrl.includes("guest=Convidado"))
    );
  });

  it("enforces idempotency on create", async () => {
    const idem = new InMemoryIdempotencyStore();
    const service = new InvitationCampaignService(
      undefined,
      () => "manual",
      idem
    );
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "HAXR",
      phone: "258840000001",
      isDefault: true,
    });

    const first = await service.createCampaign({
      eventId: EVENT_A,
      name: "Idem",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      idempotencyKey: "lote-1",
      guests: makeGuests(2),
    });
    const second = await service.createCampaign({
      eventId: EVENT_A,
      name: "Idem outra",
      invitationRegistryKey: "traditional-wedding",
      messageTemplate: "Olá {{guest_name}}",
      eventName: "E",
      eventDate: "1",
      eventLocation: "M",
      idempotencyKey: "lote-1",
      guests: makeGuests(2),
    });
    assert.equal(first.id, second.id);
    assert.equal(service.listCampaigns(EVENT_A).length, 1);
  });

  it("isolates campaigns by event_id", async () => {
    const service = new InvitationCampaignService();
    service.createSenderProfile({
      eventId: EVENT_A,
      senderKind: "haxr_official",
      publicName: "A",
      phone: "258840000001",
      isDefault: true,
    });
    service.createSenderProfile({
      eventId: EVENT_B,
      senderKind: "haxr_official",
      publicName: "B",
      phone: "258840000002",
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
      publicName: "Ops",
      phone: "258840000001",
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

    const blocked = service.attemptAutomaticSend(EVENT_A, campaign.id);
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

  it("preview_test and production remain fail-closed without credentials", () => {
    for (const mode of ["preview_test", "production"] as const) {
      const gate = gateAutomaticProvider({
        mode,
        hasConfiguredProvider: false,
        hasProviderCredentials: false,
      });
      assert.equal(gate.allowed, false);
    }
    const stillBlocked = gateAutomaticProvider({
      mode: "production",
      hasConfiguredProvider: true,
      hasProviderCredentials: true,
    });
    assert.equal(stillBlocked.allowed, false);
  });
});
