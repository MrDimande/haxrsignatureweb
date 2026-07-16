/**
 * Orquestração Admin: domínio + persistência Supabase.
 * Fail-closed no provider; modo manual operacional.
 */

import { randomUUID } from "node:crypto";
import {
  InvitationCampaignService,
  createEmptyCampaignStore,
} from "@/lib/campaigns/campaign-service";
import { buildPersonalizedInvitationUrl } from "@/lib/campaigns/invitation-url";
import {
  assertManualModeEnabled,
  buildCampaignExportRows,
  exportCampaignCsv,
  nextStatusAfterManualAction,
  toManualRecipientOps,
  type ManualAction,
} from "@/lib/campaigns/manual-ops";
import * as repo from "@/lib/campaigns/repositories/campaigns.repository";
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
  CreateCampaignInput,
  InvitationCampaign,
  ManualRecipientOps,
  SenderKind,
  SenderProfile,
} from "@/lib/campaigns/types";
import { EDITION_INVITE_CATALOG } from "@/lib/edition/invite-catalog";

export function listEditionInviteOptions() {
  const seen = new Set<string>();
  return Object.values(EDITION_INVITE_CATALOG)
    .filter((ref) => {
      if (seen.has(ref.registryKey)) return false;
      seen.add(ref.registryKey);
      return ref.status === "active";
    })
    .map((ref) => ({
      registryKey: ref.registryKey,
      label: ref.label,
      inviteSlug: ref.inviteSlug,
    }));
}

export function getCampaignSendModeStatus() {
  const mode = getWhatsappSendMode();
  const gate = gateAutomaticProvider({ mode });
  return {
    mode,
    manualAllowed: isManualOpsAllowed(mode),
    automaticBlocked: !gate.allowed,
    automaticBlockReason: gate.allowed
      ? "Twilio Sandbox pronto (requer HAXR_TWILIO_LIVE_SEND=true para API real)."
      : gate.reason,
    twilioSandboxReady: gate.allowed && mode === "twilio_sandbox",
  };
}

export async function createSenderForEvent(input: {
  eventId: string;
  senderKind: SenderKind;
  publicName: string;
  phone: string;
  providerPhoneId?: string | null;
  isDefault?: boolean;
}): Promise<SenderProfile> {
  const kind = assertAllowedSenderKind(input.senderKind);
  const profile: SenderProfile = {
    id: randomUUID(),
    eventId: input.eventId,
    senderKind: kind,
    publicName: input.publicName.trim(),
    maskedNumber: maskPhoneNumber(input.phone),
    provider: defaultProviderForKind(kind),
    providerPhoneId: input.providerPhoneId?.trim() || null,
    status: "active",
    isDefault: Boolean(input.isDefault),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return repo.insertSenderProfile(profile);
}

export async function listSendersForEvent(
  eventId: string
): Promise<SenderProfile[]> {
  return repo.listSenderProfiles(eventId);
}

export async function createCampaignForEvent(
  input: CreateCampaignInput
): Promise<InvitationCampaign> {
  const mode = getWhatsappSendMode();
  if (mode === "disabled") {
    // Criação de rascunho permitida; envio/manual bloqueados depois.
  }

  const validation = validateTemplateVariables(input.messageTemplate);
  if (!validation.ok) throw new Error(validation.message);

  const baseInvite = buildPersonalizedInvitationUrl({
    invitationRegistryKey: input.invitationRegistryKey,
  });
  if (!baseInvite.ok) throw new Error(baseInvite.reason);

  if (input.idempotencyKey?.trim()) {
    const existing = await repo.findCampaignByIdempotency(
      input.eventId,
      input.idempotencyKey.trim()
    );
    if (existing) return existing;
  }

  const senders = await repo.listSenderProfiles(input.eventId);
  let senderProfileId = input.senderProfileId ?? null;
  if (senderProfileId) {
    const sender = senders.find((s) => s.id === senderProfileId);
    if (!sender || sender.eventId !== input.eventId) {
      throw new Error("Sender profile inválido para este evento.");
    }
  } else {
    senderProfileId =
      senders.find((s) => s.isDefault && s.status === "active")?.id ?? null;
  }

  const sender = senders.find((s) => s.id === senderProfileId) ?? null;
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await repo.insertCampaign(campaign);
  const batchKey = campaign.batchKey;
  const recipients = input.guests.map((guest) => {
    const invite = buildPersonalizedInvitationUrl({
      invitationRegistryKey: input.invitationRegistryKey,
      guestName: guest.guestName,
    });
    if (!invite.ok) throw new Error(invite.reason);
    const context = {
      ...buildEmptyTemplateContext(),
      guest_name: guest.guestName,
      couple_names: campaign.coupleNames,
      event_name: campaign.eventName,
      event_date: campaign.eventDate,
      event_location: campaign.eventLocation,
      invitation_url: invite.url,
      rsvp_deadline: campaign.rsvpDeadline,
      sender_name: sender?.publicName ?? "HAXR Signature",
    };
    return {
      id: randomUUID(),
      campaignId: saved.id,
      eventId: saved.eventId,
      guestId: guest.guestId,
      guestName: guest.guestName,
      phoneE164: guest.phone?.replace(/\D/g, "") || null,
      phoneMasked: guest.phone ? maskPhoneNumber(guest.phone) : "",
      invitationUrl: invite.url,
      renderedMessage: renderTemplate(campaign.messageTemplate, context),
      status: "pending" as const,
      batchKey,
      lastActionAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  await repo.insertRecipients(recipients);
  return saved;
}

export async function updateCampaignMessage(
  eventId: string,
  campaignId: string,
  messageTemplate: string
): Promise<InvitationCampaign> {
  const validation = validateTemplateVariables(messageTemplate);
  if (!validation.ok) throw new Error(validation.message);

  const campaign = await repo.getCampaignById(eventId, campaignId);
  if (!campaign) throw new Error("Campanha não encontrada.");

  const updated = await repo.updateCampaign(eventId, campaignId, {
    messageTemplate,
  });
  await rerenderAndPersist(updated);
  return { ...updated, messageTemplate };
}

export async function changeCampaignSender(
  eventId: string,
  campaignId: string,
  senderProfileId: string
): Promise<InvitationCampaign> {
  const senders = await repo.listSenderProfiles(eventId);
  const sender = senders.find((s) => s.id === senderProfileId);
  if (!sender) throw new Error("Sender profile não encontrado.");

  const updated = await repo.updateCampaign(eventId, campaignId, {
    senderProfileId,
  });
  await rerenderAndPersist({ ...updated, senderProfileId });
  return { ...updated, senderProfileId };
}

async function rerenderAndPersist(campaign: InvitationCampaign): Promise<void> {
  const senders = await repo.listSenderProfiles(campaign.eventId);
  const sender = senders.find((s) => s.id === campaign.senderProfileId) ?? null;
  const recipients = await repo.listRecipientsByCampaign(
    campaign.eventId,
    campaign.id
  );

  const updates = recipients.map((recipient) => {
    const invite = buildPersonalizedInvitationUrl({
      invitationRegistryKey: campaign.invitationRegistryKey,
      guestName: recipient.guestName,
    });
    if (!invite.ok) {
      return {
        id: recipient.id,
        renderedMessage: recipient.renderedMessage,
        invitationUrl: recipient.invitationUrl,
      };
    }
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
    return {
      id: recipient.id,
      renderedMessage: renderTemplate(campaign.messageTemplate, context),
      invitationUrl: invite.url,
    };
  });

  await repo.bulkUpdateRecipientMessages(campaign.eventId, updates);
}

export async function previewCampaign(
  eventId: string,
  campaignId: string,
  limit?: number
): Promise<ManualRecipientOps[]> {
  const recipients = await repo.listRecipientsByCampaign(eventId, campaignId);
  const sliced =
    typeof limit === "number" ? recipients.slice(0, limit) : recipients;

  for (const recipient of sliced) {
    const status =
      recipient.status === "pending" ? "previewed" : recipient.status;
    await repo.updateRecipient(eventId, recipient.id, {
      status,
      lastActionAt: new Date().toISOString(),
    });
    await repo.insertDeliveryAttempt({
      eventId,
      campaignId,
      recipientId: recipient.id,
      attemptKind: "preview",
      outcome: "success",
      detail: "Preview personalizado",
      providerRef: null,
      actor: "admin",
    });
  }

  return sliced.map((r) =>
    toManualRecipientOps({
      ...r,
      status: r.status === "pending" ? "previewed" : r.status,
    })
  );
}

export async function listCampaignManualOps(
  eventId: string,
  campaignId: string
): Promise<ManualRecipientOps[]> {
  const recipients = await repo.listRecipientsByCampaign(eventId, campaignId);
  return recipients.map(toManualRecipientOps);
}

export async function runManualRecipientAction(
  eventId: string,
  campaignId: string,
  recipientId: string,
  action: ManualAction
) {
  assertManualModeEnabled(getWhatsappSendMode());
  const campaign = await repo.getCampaignById(eventId, campaignId);
  if (!campaign) throw new Error("Campanha não encontrada.");

  const recipients = await repo.listRecipientsByCampaign(eventId, campaignId);
  const recipient = recipients.find((r) => r.id === recipientId);
  if (!recipient) throw new Error("Destinatário não encontrado.");

  const nextStatus = nextStatusAfterManualAction(recipient.status, action);
  const updated = await repo.updateRecipient(eventId, recipientId, {
    status: nextStatus,
    lastActionAt: new Date().toISOString(),
  });

  const kind =
    action === "copy"
      ? "manual_copy"
      : action === "open"
        ? "manual_open"
        : "manual_marked_sent";

  await repo.insertDeliveryAttempt({
    eventId,
    campaignId,
    recipientId,
    attemptKind: kind,
    outcome: "success",
    detail: `Acção manual: ${action}`,
    providerRef: null,
    actor: "admin",
  });

  if (campaign.status === "draft" || campaign.status === "ready") {
    await repo.updateCampaign(eventId, campaignId, {
      status: "sending_manual",
    });
  }

  return toManualRecipientOps(updated);
}

export async function exportCampaignForEvent(
  eventId: string,
  campaignId: string
): Promise<string> {
  const recipients = await repo.listRecipientsByCampaign(eventId, campaignId);
  if (recipients[0]) {
    await repo.insertDeliveryAttempt({
      eventId,
      campaignId,
      recipientId: recipients[0].id,
      attemptKind: "export",
      outcome: "success",
      detail: `Export CSV (${recipients.length})`,
      providerRef: null,
      actor: "admin",
    });
  }
  return exportCampaignCsv(buildCampaignExportRows(recipients));
}

/** Utilitário de teste / validação local sem DB. */
export function createInMemoryCampaignHarness() {
  return new InvitationCampaignService(createEmptyCampaignStore());
}
