import { randomUUID } from "node:crypto";
import { buildPersonalizedInvitationUrl } from "@/lib/campaigns/invitation-url";
import {
  assertManualModeEnabled,
  buildCampaignExportRows,
  exportCampaignCsv,
  nextStatusAfterManualAction,
  toManualRecipientOps,
  type ManualAction,
} from "@/lib/campaigns/manual-ops";
import {
  createFailClosedProviderStack,
  type CampaignIdempotencyStore,
  InMemoryIdempotencyStore,
} from "@/lib/campaigns/provider/fail-closed";
import {
  assertAllowedSenderKind,
  defaultProviderForKind,
  maskPhoneNumber,
} from "@/lib/campaigns/sender-profiles";
import {
  getWhatsappSendMode,
  gateAutomaticProvider,
  isManualOpsAllowed,
} from "@/lib/campaigns/send-mode";
import {
  buildEmptyTemplateContext,
  renderTemplate,
  validateTemplateVariables,
} from "@/lib/campaigns/template";
import type {
  CampaignRecipient,
  CreateCampaignInput,
  DeliveryAttempt,
  HaxrWhatsappSendMode,
  InvitationCampaign,
  ManualRecipientOps,
  SenderKind,
  SenderProfile,
} from "@/lib/campaigns/types";

export type CampaignStore = {
  senders: SenderProfile[];
  campaigns: InvitationCampaign[];
  recipients: CampaignRecipient[];
  attempts: DeliveryAttempt[];
};

export function createEmptyCampaignStore(): CampaignStore {
  return {
    senders: [],
    campaigns: [],
    recipients: [],
    attempts: [],
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function assertEventIsolation(
  entityEventId: string,
  requestedEventId: string,
  label: string
): void {
  if (entityEventId !== requestedEventId) {
    throw new Error(
      `Isolamento de evento violado em ${label}: ${entityEventId} ≠ ${requestedEventId}.`
    );
  }
}

export class InvitationCampaignService {
  private readonly idempotency: CampaignIdempotencyStore;

  constructor(
    private readonly store: CampaignStore = createEmptyCampaignStore(),
    private readonly modeReader: () => HaxrWhatsappSendMode = getWhatsappSendMode,
    idempotency?: CampaignIdempotencyStore
  ) {
    this.idempotency = idempotency ?? new InMemoryIdempotencyStore();
  }

  getStore(): CampaignStore {
    return this.store;
  }

  getSendMode(): HaxrWhatsappSendMode {
    return this.modeReader();
  }

  createSenderProfile(input: {
    eventId: string;
    senderKind: SenderKind;
    publicName: string;
    phone: string;
    providerPhoneId?: string | null;
    isDefault?: boolean;
  }): SenderProfile {
    const kind = assertAllowedSenderKind(input.senderKind);
    const publicName = input.publicName.trim();
    if (!publicName) throw new Error("Nome público do sender é obrigatório.");

    if (input.isDefault) {
      for (const sender of this.store.senders) {
        if (sender.eventId === input.eventId && sender.isDefault) {
          sender.isDefault = false;
          sender.updatedAt = nowIso();
        }
      }
    }

    const profile: SenderProfile = {
      id: randomUUID(),
      eventId: input.eventId,
      senderKind: kind,
      publicName,
      maskedNumber: maskPhoneNumber(input.phone),
      provider: defaultProviderForKind(kind),
      providerPhoneId: input.providerPhoneId?.trim() || null,
      status: "active",
      isDefault: Boolean(input.isDefault),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.store.senders.push(profile);
    return profile;
  }

  listSenders(eventId: string): SenderProfile[] {
    return this.store.senders.filter((s) => s.eventId === eventId);
  }

  setCampaignSender(
    eventId: string,
    campaignId: string,
    senderProfileId: string
  ): InvitationCampaign {
    const campaign = this.requireCampaign(eventId, campaignId);
    const sender = this.store.senders.find((s) => s.id === senderProfileId);
    if (!sender) throw new Error("Sender profile não encontrado.");
    assertEventIsolation(sender.eventId, eventId, "sender_profile");
    campaign.senderProfileId = sender.id;
    campaign.updatedAt = nowIso();
    this.rerenderRecipients(campaign);
    return campaign;
  }

  async createCampaign(
    input: CreateCampaignInput
  ): Promise<InvitationCampaign> {
    const mode = this.modeReader();
    const validation = validateTemplateVariables(input.messageTemplate);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    if (!input.eventId.trim()) {
      throw new Error("event_id é obrigatório.");
    }

    const invite = buildPersonalizedInvitationUrl({
      invitationRegistryKey: input.invitationRegistryKey,
    });
    if (!invite.ok) {
      throw new Error(invite.reason);
    }

    if (input.idempotencyKey?.trim()) {
      const key = input.idempotencyKey.trim();
      const reserved = await this.idempotency.reserve(input.eventId, key);
      if (!reserved.reserved && reserved.existingRef) {
        const existing = this.store.campaigns.find(
          (c) => c.eventId === input.eventId && c.idempotencyKey === key
        );
        if (existing) return existing;
        throw new Error(
          `Idempotência: campanha já criada (${reserved.existingRef}).`
        );
      }
    }

    let senderProfileId = input.senderProfileId ?? null;
    if (senderProfileId) {
      const sender = this.store.senders.find((s) => s.id === senderProfileId);
      if (!sender) throw new Error("Sender profile inválido.");
      assertEventIsolation(sender.eventId, input.eventId, "sender_profile");
    } else {
      const defaultSender = this.store.senders.find(
        (s) => s.eventId === input.eventId && s.isDefault && s.status === "active"
      );
      senderProfileId = defaultSender?.id ?? null;
    }

    const campaign: InvitationCampaign = {
      id: randomUUID(),
      eventId: input.eventId,
      senderProfileId,
      name: input.name.trim() || "Campanha de convites",
      invitationRegistryKey: input.invitationRegistryKey.trim(),
      recipientsSelection: input.recipientsSelection ?? {
        mode: "selected_guests",
        count: input.guests.length,
      },
      batchKey: input.batchKey?.trim() || "default",
      messageTemplate: input.messageTemplate,
      status: "draft",
      scheduledAt: input.scheduledAt ?? null,
      previewLimit: input.previewLimit ?? 25,
      testMode: input.testMode ?? true,
      rsvpDeadline: input.rsvpDeadline?.trim() ?? "",
      coupleNames: input.coupleNames?.trim() ?? "",
      eventName: input.eventName,
      eventDate: input.eventDate,
      eventLocation: input.eventLocation,
      idempotencyKey: input.idempotencyKey?.trim() || null,
      sendModeSnapshot: mode,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    this.store.campaigns.push(campaign);

    const batchKey = campaign.batchKey;
    for (const guest of input.guests) {
      this.addRecipient(campaign, input, guest, batchKey);
    }

    return campaign;
  }

  updateMessageTemplate(
    eventId: string,
    campaignId: string,
    messageTemplate: string
  ): InvitationCampaign {
    const validation = validateTemplateVariables(messageTemplate);
    if (!validation.ok) {
      throw new Error(validation.message);
    }
    const campaign = this.requireCampaign(eventId, campaignId);
    campaign.messageTemplate = messageTemplate;
    campaign.updatedAt = nowIso();
    this.rerenderRecipients(campaign);
    return campaign;
  }

  previewRecipients(
    eventId: string,
    campaignId: string,
    limit?: number
  ): ManualRecipientOps[] {
    const campaign = this.requireCampaign(eventId, campaignId);
    const recipients = this.store.recipients.filter(
      (r) => r.campaignId === campaign.id && r.eventId === eventId
    );
    const sliced = typeof limit === "number" ? recipients.slice(0, limit) : recipients;

    for (const recipient of sliced) {
      recipient.status =
        recipient.status === "pending" ? "previewed" : recipient.status;
      recipient.lastActionAt = nowIso();
      this.store.attempts.push({
        id: randomUUID(),
        eventId,
        campaignId,
        recipientId: recipient.id,
        attemptKind: "preview",
        outcome: "success",
        detail: "Preview personalizado",
        providerRef: null,
        actor: "admin",
        createdAt: nowIso(),
      });
    }

    return sliced.map(toManualRecipientOps);
  }

  listCampaigns(eventId: string): InvitationCampaign[] {
    return this.store.campaigns.filter((c) => c.eventId === eventId);
  }

  getCampaign(
    eventId: string,
    campaignId: string
  ): InvitationCampaign | null {
    return (
      this.store.campaigns.find(
        (c) => c.id === campaignId && c.eventId === eventId
      ) ?? null
    );
  }

  listRecipients(eventId: string, campaignId: string): CampaignRecipient[] {
    this.requireCampaign(eventId, campaignId);
    return this.store.recipients.filter(
      (r) => r.campaignId === campaignId && r.eventId === eventId
    );
  }

  performManualAction(
    eventId: string,
    campaignId: string,
    recipientId: string,
    action: ManualAction
  ): CampaignRecipient {
    assertManualModeEnabled(this.modeReader());
    const campaign = this.requireCampaign(eventId, campaignId);
    const recipient = this.store.recipients.find((r) => r.id === recipientId);
    if (!recipient) throw new Error("Destinatário não encontrado.");
    assertEventIsolation(recipient.eventId, eventId, "recipient");
    if (recipient.campaignId !== campaign.id) {
      throw new Error("Destinatário não pertence à campanha.");
    }

    recipient.status = nextStatusAfterManualAction(recipient.status, action);
    recipient.lastActionAt = nowIso();
    recipient.updatedAt = nowIso();

    const kind =
      action === "copy"
        ? "manual_copy"
        : action === "open"
          ? "manual_open"
          : "manual_marked_sent";

    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId,
      attemptKind: kind,
      outcome: "success",
      detail: `Acção manual: ${action}`,
      providerRef: null,
      actor: "admin",
      createdAt: nowIso(),
    });

    if (campaign.status === "draft" || campaign.status === "ready") {
      campaign.status = "sending_manual";
      campaign.updatedAt = nowIso();
    }

    return recipient;
  }

  exportCampaign(eventId: string, campaignId: string): string {
    const recipients = this.listRecipients(eventId, campaignId);
    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId: recipients[0]?.id ?? randomUUID(),
      attemptKind: "export",
      outcome: "success",
      detail: `Export CSV (${recipients.length} destinatários)`,
      providerRef: null,
      actor: "admin",
      createdAt: nowIso(),
    });
    return exportCampaignCsv(buildCampaignExportRows(recipients));
  }

  /** Qualquer tentativa de envio automático — sempre bloqueada neste MVP. */
  attemptAutomaticSend(
    eventId: string,
    campaignId: string
  ): { blocked: true; reason: string } {
    this.requireCampaign(eventId, campaignId);
    const mode = this.modeReader();
    const stack = createFailClosedProviderStack(mode);
    const gate = gateAutomaticProvider({
      mode,
      hasConfiguredProvider: false,
      hasProviderCredentials: false,
    });

    void stack.queue.enqueue({
      campaignId,
      eventId,
      recipientId: "n/a",
      idempotencyKey: `auto:${campaignId}`,
    });

    const reason = gate.allowed
      ? "Provider automático não activado."
      : gate.reason;

    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId: this.store.recipients.find((r) => r.campaignId === campaignId)
        ?.id ?? randomUUID(),
      attemptKind: "provider_blocked",
      outcome: "blocked",
      detail: reason,
      providerRef: null,
      actor: "system",
      createdAt: nowIso(),
    });

    return { blocked: true, reason };
  }

  assertManualModeOrThrow(): void {
    const mode = this.modeReader();
    if (!isManualOpsAllowed(mode) && mode !== "disabled") {
      // preview_test/production sem provider também não liberam auto; manual precisa de manual.
    }
    if (mode === "disabled") {
      throw new Error("Envio desactivado (HAXR_WHATSAPP_SEND_MODE=disabled).");
    }
  }

  private requireCampaign(
    eventId: string,
    campaignId: string
  ): InvitationCampaign {
    const campaign = this.store.campaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campanha não encontrada.");
    assertEventIsolation(campaign.eventId, eventId, "campaign");
    return campaign;
  }

  private addRecipient(
    campaign: InvitationCampaign,
    input: CreateCampaignInput,
    guest: CreateCampaignInput["guests"][number],
    batchKey: string
  ): CampaignRecipient {
    const invite = buildPersonalizedInvitationUrl({
      invitationRegistryKey: input.invitationRegistryKey,
      guestName: guest.guestName,
    });
    if (!invite.ok) {
      throw new Error(invite.reason);
    }

    const sender = campaign.senderProfileId
      ? this.store.senders.find((s) => s.id === campaign.senderProfileId)
      : null;

    const context = {
      ...buildEmptyTemplateContext(),
      guest_name: guest.guestName,
      couple_names: input.coupleNames?.trim() ?? "",
      event_name: input.eventName,
      event_date: input.eventDate,
      event_location: input.eventLocation,
      invitation_url: invite.url,
      rsvp_deadline: input.rsvpDeadline?.trim() ?? "",
      sender_name: sender?.publicName ?? "HAXR Signature",
    };

    const recipient: CampaignRecipient = {
      id: randomUUID(),
      campaignId: campaign.id,
      eventId: campaign.eventId,
      guestId: guest.guestId,
      guestName: guest.guestName,
      phoneE164: guest.phone?.replace(/\D/g, "") || null,
      phoneMasked: guest.phone ? maskPhoneNumber(guest.phone) : "",
      invitationUrl: invite.url,
      renderedMessage: renderTemplate(campaign.messageTemplate, context),
      status: "pending",
      batchKey,
      lastActionAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.store.recipients.push(recipient);
    return recipient;
  }

  private rerenderRecipients(campaign: InvitationCampaign): void {
    const sender = campaign.senderProfileId
      ? this.store.senders.find((s) => s.id === campaign.senderProfileId)
      : null;

    for (const recipient of this.store.recipients) {
      if (recipient.campaignId !== campaign.id) continue;
      const invite = buildPersonalizedInvitationUrl({
        invitationRegistryKey: campaign.invitationRegistryKey,
        guestName: recipient.guestName,
      });
      if (!invite.ok) continue;

      const context = {
        ...buildEmptyTemplateContext(),
        guest_name: recipient.guestName,
        couple_names: campaign.coupleNames,
        event_name: campaign.eventName,
        event_date: campaign.eventDate,
        event_location: campaign.eventLocation,
        invitation_url: invite.url,
        rsvp_deadline: campaign.rsvpDeadline,
        sender_name: sender?.publicName ?? "HAXR Signature",
      };

      recipient.invitationUrl = invite.url;
      recipient.renderedMessage = renderTemplate(
        campaign.messageTemplate,
        context
      );
      recipient.updatedAt = nowIso();
    }
  }
}
