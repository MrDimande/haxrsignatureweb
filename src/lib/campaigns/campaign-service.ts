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
import { createTwilioMessagesClient } from "@/lib/campaigns/provider/twilio-client";
import { resolveTwilioWhatsappConfig } from "@/lib/campaigns/provider/twilio-config";
import {
  AllowAllThrottler,
  TwilioSandboxSendQueue,
} from "@/lib/campaigns/provider/twilio-queue";
import { sanitizeAuditDetail } from "@/lib/campaigns/provider/twilio-sanitize";
import {
  handleTwilioWhatsappStatusCallback,
  twilioReplayKey,
} from "@/lib/campaigns/provider/twilio-webhook";
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
  isTwilioSandboxMode,
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
  DeliveryAttemptKind,
  HaxrWhatsappSendMode,
  InvitationCampaign,
  ManualRecipientOps,
  RecipientStatus,
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
  /** Replay protection: MessageSid:MessageStatus já processados. */
  private readonly webhookReplays = new Set<string>();

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
      provider: defaultProviderForKind(kind, {
        twilioSandbox: isTwilioSandboxMode(this.modeReader()),
      }),
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
        (s) =>
          s.eventId === input.eventId && s.isDefault && s.status === "active"
      );
      senderProfileId = defaultSender?.id ?? null;
    }

    const now = nowIso();
    const batchKey = input.batchKey?.trim() || "default";
    const campaign: InvitationCampaign = {
      id: randomUUID(),
      eventId: input.eventId,
      senderProfileId,
      name: input.name.trim(),
      invitationRegistryKey: input.invitationRegistryKey,
      recipientsSelection: input.recipientsSelection ?? {
        mode: "selected_guests",
      },
      batchKey,
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
      createdAt: now,
      updatedAt: now,
    };

    this.store.campaigns.push(campaign);
    for (const guest of input.guests) {
      this.addRecipient(campaign, input, guest, batchKey);
    }
    return campaign;
  }

  getCampaign(eventId: string, campaignId: string): InvitationCampaign | null {
    const campaign = this.store.campaigns.find((c) => c.id === campaignId);
    if (!campaign) return null;
    if (campaign.eventId !== eventId) return null;
    return campaign;
  }

  listCampaigns(eventId: string): InvitationCampaign[] {
    return this.store.campaigns.filter((c) => c.eventId === eventId);
  }

  listRecipients(eventId: string, campaignId: string): CampaignRecipient[] {
    this.requireCampaign(eventId, campaignId);
    return this.store.recipients.filter(
      (r) => r.eventId === eventId && r.campaignId === campaignId
    );
  }

  listManualOps(eventId: string, campaignId: string): ManualRecipientOps[] {
    return this.listRecipients(eventId, campaignId).map(toManualRecipientOps);
  }

  editCampaignMessage(
    eventId: string,
    campaignId: string,
    messageTemplate: string
  ): InvitationCampaign {
    const validation = validateTemplateVariables(messageTemplate);
    if (!validation.ok) throw new Error(validation.message);
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
    const cap = Math.min(limit ?? campaign.previewLimit, campaign.previewLimit);
    const ops = this.listManualOps(eventId, campaignId).slice(0, cap);
    for (const op of ops) {
      const recipient = this.store.recipients.find(
        (r) => r.id === op.recipientId
      );
      if (recipient && recipient.status === "pending") {
        recipient.status = "previewed";
        recipient.updatedAt = nowIso();
      }
    }
    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId: ops[0]?.recipientId ?? randomUUID(),
      attemptKind: "preview",
      outcome: "success",
      detail: `Preview ${ops.length} destinatário(s)`,
      providerRef: null,
      actor: "admin",
      createdAt: nowIso(),
    });
    return ops;
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

    const previous = recipient.status;
    recipient.status = nextStatusAfterManualAction(recipient.status, action);
    recipient.lastActionAt = nowIso();
    recipient.updatedAt = nowIso();

    const kind = manualAttemptKind(action);

    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId,
      attemptKind: kind,
      outcome: "success",
      detail: sanitizeAuditDetail(
        `Acção manual: ${action} (${previous} → ${recipient.status})`
      ),
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

  /** Marca RSVP recebido — não é delivered Twilio. */
  markRsvpReceived(
    eventId: string,
    campaignId: string,
    recipientId: string
  ): CampaignRecipient {
    const campaign = this.requireCampaign(eventId, campaignId);
    const recipient = this.store.recipients.find((r) => r.id === recipientId);
    if (!recipient) throw new Error("Destinatário não encontrado.");
    assertEventIsolation(recipient.eventId, eventId, "recipient");
    if (recipient.campaignId !== campaign.id) {
      throw new Error("Destinatário não pertence à campanha.");
    }
    recipient.status = "rsvp_received";
    recipient.lastActionAt = nowIso();
    recipient.updatedAt = nowIso();
    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId,
      attemptKind: "manual_rsvp_received",
      outcome: "success",
      detail: "RSVP recebido (não implica delivered Twilio)",
      providerRef: null,
      actor: "system",
      createdAt: nowIso(),
    });
    return recipient;
  }

  /**
   * Remove SIDs DRYRUN_* e repõe destinatários dry-run em pending.
   * Cleanup exacto — sem chamar Twilio.
   */
  cleanupTwilioDryRun(
    eventId: string,
    campaignId: string
  ): { cleaned: number } {
    this.requireCampaign(eventId, campaignId);
    let cleaned = 0;
    for (const recipient of this.listRecipients(eventId, campaignId)) {
      if (!recipient.providerMessageSid?.startsWith("DRYRUN_")) continue;
      recipient.providerMessageSid = null;
      if (
        recipient.status === "queued" ||
        recipient.status === "sent" ||
        recipient.status === "delivered" ||
        recipient.status === "read" ||
        recipient.status === "failed" ||
        recipient.status === "undelivered"
      ) {
        recipient.status = "pending";
      }
      recipient.updatedAt = nowIso();
      cleaned += 1;
      this.store.attempts.push({
        id: randomUUID(),
        eventId,
        campaignId,
        recipientId: recipient.id,
        attemptKind: "twilio_dryrun_cleanup",
        outcome: "success",
        detail: "Cleanup dry-run DRYRUN_*",
        providerRef: null,
        actor: "system",
        createdAt: nowIso(),
      });
    }
    return { cleaned };
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

  /**
   * Enfileira destinatários allowlisted no Twilio Sandbox.
   * Sem HAXR_TWILIO_LIVE_SEND=true → dry-run (sem chamada API).
   */
  async enqueueTwilioSandbox(
    eventId: string,
    campaignId: string
  ): Promise<{
    blocked: boolean;
    reason?: string;
    enqueued: number;
    skipped: number;
    dryRun: boolean;
  }> {
    const mode = this.modeReader();
    const campaign = this.requireCampaign(eventId, campaignId);
    const gate = gateAutomaticProvider({ mode });
    if (!gate.allowed) {
      this.recordProviderBlocked(eventId, campaignId, gate.reason);
      return {
        blocked: true,
        reason: gate.reason,
        enqueued: 0,
        skipped: 0,
        dryRun: true,
      };
    }

    const resolved = resolveTwilioWhatsappConfig(process.env, mode);
    if (!resolved.ok) {
      this.recordProviderBlocked(eventId, campaignId, resolved.reason);
      return {
        blocked: true,
        reason: resolved.reason,
        enqueued: 0,
        skipped: 0,
        dryRun: true,
      };
    }

    const client = createTwilioMessagesClient(resolved.config);
    const queue = new TwilioSandboxSendQueue(
      mode,
      resolved.config,
      client,
      async (job) => {
        const recipient = this.store.recipients.find(
          (r) => r.id === job.recipientId
        );
        if (!recipient) return null;
        return {
          phoneE164: recipient.phoneE164,
          body: recipient.renderedMessage,
        };
      },
      this.idempotency,
      new AllowAllThrottler()
    );

    let enqueued = 0;
    let skipped = 0;
    let dryRun = !resolved.config.liveSendEnabled;

    for (const recipient of this.listRecipients(eventId, campaignId)) {
      const idempotencyKey = `twilio:${campaignId}:${recipient.id}`;
      const result = await queue.enqueue({
        campaignId,
        eventId,
        recipientId: recipient.id,
        idempotencyKey,
      });

      if (!result.enqueued) {
        skipped += 1;
        recipient.status = "skipped";
        recipient.updatedAt = nowIso();
        this.store.attempts.push({
          id: randomUUID(),
          eventId,
          campaignId,
          recipientId: recipient.id,
          attemptKind: "twilio_enqueue",
          outcome: "blocked",
          detail: result.reason,
          providerRef: null,
          actor: "system",
          createdAt: nowIso(),
        });
        continue;
      }

      const sendResult = queue.getResult(idempotencyKey);
      enqueued += 1;
      dryRun = dryRun || Boolean(sendResult?.dryRun);
      recipient.status = "queued";
      recipient.providerMessageSid = sendResult?.sid ?? result.jobId;
      recipient.lastActionAt = nowIso();
      recipient.updatedAt = nowIso();
      this.store.attempts.push({
        id: randomUUID(),
        eventId,
        campaignId,
        recipientId: recipient.id,
        attemptKind: "twilio_enqueue",
        outcome: "success",
        detail: sendResult?.dryRun
          ? `Dry-run enqueued (${sendResult.sid})`
          : `Enqueued (${sendResult?.sid ?? result.jobId})`,
        providerRef: sendResult?.sid ?? result.jobId,
        actor: "system",
        createdAt: nowIso(),
      });
    }

    if (enqueued > 0) {
      campaign.status = "sending_twilio";
      campaign.updatedAt = nowIso();
    }

    return { blocked: false, enqueued, skipped, dryRun };
  }

  applyTwilioStatusWebhook(input: {
    signatureHeader: string | null | undefined;
    callbackUrl: string;
    params: Record<string, string>;
    /** Opcional: restringir actualização a este event_id (cross-event isolation). */
    expectedEventId?: string;
  }): {
    accepted: boolean;
    reason?: string;
    recipientId?: string;
    status?: RecipientStatus;
    replay?: boolean;
  } {
    const mode = this.modeReader();
    const resolved = resolveTwilioWhatsappConfig(process.env, mode);
    if (!resolved.ok) {
      return { accepted: false, reason: resolved.reason };
    }

    const messageSid = input.params.MessageSid || input.params.SmsSid || "";
    const messageStatus = input.params.MessageStatus || "";
    const replayKey = twilioReplayKey(messageSid, messageStatus);
    const alreadyProcessed = this.webhookReplays.has(replayKey);

    const recipient = messageSid
      ? this.store.recipients.find((r) => r.providerMessageSid === messageSid)
      : undefined;

    const handled = handleTwilioWhatsappStatusCallback({
      authToken: resolved.config.authToken,
      expectedAccountSid: resolved.config.accountSid,
      signatureHeader: input.signatureHeader,
      callbackUrl: input.callbackUrl,
      params: input.params,
      currentRecipientStatus: recipient?.status,
      alreadyProcessed,
    });

    if (!handled.accepted) {
      this.store.attempts.push({
        id: randomUUID(),
        eventId: recipient?.eventId ?? "00000000-0000-0000-0000-000000000000",
        campaignId:
          recipient?.campaignId ?? "00000000-0000-0000-0000-000000000000",
        recipientId: recipient?.id ?? randomUUID(),
        attemptKind: "webhook_ignored",
        outcome: "blocked",
        detail: sanitizeAuditDetail(handled.reason),
        providerRef: messageSid || null,
        actor: "twilio_webhook",
        createdAt: nowIso(),
      });
      return { accepted: false, reason: handled.reason };
    }

    // Rejeitar SID desconhecido — nunca aplicar estado fantasma.
    if (!recipient) {
      this.store.attempts.push({
        id: randomUUID(),
        eventId: "00000000-0000-0000-0000-000000000000",
        campaignId: "00000000-0000-0000-0000-000000000000",
        recipientId: randomUUID(),
        attemptKind: "webhook_ignored",
        outcome: "blocked",
        detail: sanitizeAuditDetail(
          `SID desconhecido rejeitado: ${messageSid}`
        ),
        providerRef: messageSid || null,
        actor: "twilio_webhook",
        createdAt: nowIso(),
      });
      return {
        accepted: false,
        reason: "Callback de mensagem inexistente (SID desconhecido).",
      };
    }

    if (
      input.expectedEventId &&
      recipient.eventId !== input.expectedEventId
    ) {
      return {
        accepted: false,
        reason: "Isolamento de evento: callback cross-event rejeitado.",
      };
    }

    if (handled.replay) {
      return {
        accepted: true,
        reason: "Replay ignorado (já processado).",
        recipientId: recipient.id,
        status: recipient.status,
        replay: true,
      };
    }

    this.webhookReplays.add(replayKey);

    if (handled.applied) {
      recipient.status = handled.status;
      recipient.updatedAt = nowIso();
      recipient.lastActionAt = nowIso();
    }

    this.store.attempts.push({
      id: randomUUID(),
      eventId: recipient.eventId,
      campaignId: recipient.campaignId,
      recipientId: recipient.id,
      attemptKind: "twilio_status",
      outcome: handled.applied ? "success" : "noop",
      detail: sanitizeAuditDetail(
        `Status ${handled.status}${
          handled.applied ? "" : " (não aplicado — regressão/inválido)"
        }`
      ),
      providerRef: handled.messageSid,
      actor: "twilio_webhook",
      createdAt: nowIso(),
    });

    return {
      accepted: true,
      recipientId: recipient.id,
      status: recipient.status,
      replay: false,
    };
  }

  async attemptAutomaticSend(
    eventId: string,
    campaignId: string
  ): Promise<{ blocked: boolean; reason: string }> {
    const mode = this.modeReader();
    if (isTwilioSandboxMode(mode)) {
      const result = await this.enqueueTwilioSandbox(eventId, campaignId);
      if (result.blocked) {
        return { blocked: true, reason: result.reason ?? "blocked" };
      }
      return {
        blocked: false,
        reason: result.dryRun
          ? `Sandbox dry-run: ${result.enqueued} enfileirado(s), ${result.skipped} ignorado(s).`
          : `Sandbox: ${result.enqueued} enfileirado(s), ${result.skipped} ignorado(s).`,
      };
    }

    this.requireCampaign(eventId, campaignId);
    const stack = createFailClosedProviderStack(mode);
    const gate = gateAutomaticProvider({ mode });
    void stack.queue.enqueue({
      campaignId,
      eventId,
      recipientId: "n/a",
      idempotencyKey: `auto:${campaignId}`,
    });
    const reason = gate.allowed
      ? "Provider automático não activado."
      : gate.reason;
    this.recordProviderBlocked(eventId, campaignId, reason);
    return { blocked: true, reason };
  }

  assertManualModeOrThrow(): void {
    const mode = this.modeReader();
    if (mode === "disabled") {
      throw new Error("Envio desactivado (HAXR_WHATSAPP_SEND_MODE=disabled).");
    }
    if (!isManualOpsAllowed(mode)) {
      throw new Error(
        `Modo ${mode} não permite operações manuais wa.me. Use HAXR_WHATSAPP_SEND_MODE=manual.`
      );
    }
  }

  private recordProviderBlocked(
    eventId: string,
    campaignId: string,
    reason: string
  ): void {
    this.store.attempts.push({
      id: randomUUID(),
      eventId,
      campaignId,
      recipientId:
        this.store.recipients.find((r) => r.campaignId === campaignId)?.id ??
        randomUUID(),
      attemptKind: "provider_blocked",
      outcome: "blocked",
      detail: reason,
      providerRef: null,
      actor: "system",
      createdAt: nowIso(),
    });
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

    const phoneDigits = guest.phone?.replace(/\D/g, "") || null;
    const phoneValid = Boolean(phoneDigits && phoneDigits.length >= 8);

    const recipient: CampaignRecipient = {
      id: randomUUID(),
      campaignId: campaign.id,
      eventId: campaign.eventId,
      guestId: guest.guestId,
      guestName: guest.guestName,
      phoneE164: phoneValid ? phoneDigits : phoneDigits,
      phoneMasked: guest.phone ? maskPhoneNumber(guest.phone) : "",
      invitationUrl: invite.url,
      renderedMessage: renderTemplate(campaign.messageTemplate, context),
      status: phoneValid ? "pending" : "invalid_phone",
      batchKey,
      lastActionAt: null,
      providerMessageSid: null,
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

function manualAttemptKind(action: ManualAction): DeliveryAttemptKind {
  switch (action) {
    case "copy":
      return "manual_copy";
    case "open":
      return "manual_open";
    case "mark_sent":
      return "manual_marked_sent";
    case "undo":
      return "manual_undo";
    case "skip":
      return "manual_skip";
    case "invalid_phone":
      return "manual_invalid_phone";
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
