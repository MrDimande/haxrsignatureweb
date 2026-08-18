"use server";

import { runAction } from "@/lib/admin/actions/auth";
import {
  changeCampaignSender,
  createCampaignForEvent,
  createSenderForEvent,
  exportCampaignForEvent,
  getCampaignSendModeStatus,
  listCampaignManualOps,
  listEditionInviteOptions,
  listSendersForEvent,
  previewCampaign,
  runManualRecipientAction,
  updateCampaignMessage,
} from "@/lib/campaigns/admin-campaigns.service";
import * as repo from "@/lib/campaigns/repositories/campaigns.repository";
import type { CreateCampaignInput, SenderKind } from "@/lib/campaigns/types";
import type { ManualAction } from "@/lib/campaigns/manual-ops";

export async function getCampaignSendModeAction() {
  return runAction(async () => getCampaignSendModeStatus());
}

export async function listEditionInvitesAction() {
  return runAction(async () => listEditionInviteOptions());
}

export async function listCampaignsAction(eventId: string) {
  return runAction(async () => repo.listCampaignsByEvent(eventId));
}

export async function listSendersAction(eventId: string) {
  return runAction(async () => listSendersForEvent(eventId));
}

export async function createSenderAction(input: {
  eventId: string;
  senderKind: SenderKind;
  publicName: string;
  phone: string;
  providerPhoneId?: string | null;
  isDefault?: boolean;
}) {
  return runAction(async () => createSenderForEvent(input));
}

export async function createCampaignAction(input: CreateCampaignInput) {
  return runAction(async () => createCampaignForEvent(input));
}

export async function updateCampaignMessageAction(input: {
  eventId: string;
  campaignId: string;
  messageTemplate: string;
}) {
  return runAction(async () =>
    updateCampaignMessage(
      input.eventId,
      input.campaignId,
      input.messageTemplate
    )
  );
}

export async function changeCampaignSenderAction(input: {
  eventId: string;
  campaignId: string;
  senderProfileId: string;
}) {
  return runAction(async () =>
    changeCampaignSender(
      input.eventId,
      input.campaignId,
      input.senderProfileId
    )
  );
}

export async function previewCampaignAction(input: {
  eventId: string;
  campaignId: string;
  limit?: number;
}) {
  return runAction(async () =>
    previewCampaign(input.eventId, input.campaignId, input.limit)
  );
}

export async function listManualOpsAction(input: {
  eventId: string;
  campaignId: string;
}) {
  return runAction(async () =>
    listCampaignManualOps(input.eventId, input.campaignId)
  );
}

export async function manualRecipientAction(input: {
  eventId: string;
  campaignId: string;
  recipientId: string;
  action: ManualAction;
}) {
  return runAction(async () =>
    runManualRecipientAction(
      input.eventId,
      input.campaignId,
      input.recipientId,
      input.action
    )
  );
}

export async function exportCampaignAction(input: {
  eventId: string;
  campaignId: string;
}) {
  return runAction(async () =>
    exportCampaignForEvent(input.eventId, input.campaignId)
  );
}

export async function getCampaignDetailAction(input: {
  eventId: string;
  campaignId: string;
}) {
  return runAction(async () => {
    const campaign = await repo.getCampaignById(
      input.eventId,
      input.campaignId
    );
    if (!campaign) throw new Error("Campanha não encontrada.");
    const recipients = await listCampaignManualOps(
      input.eventId,
      input.campaignId
    );
    const senders = await listSendersForEvent(input.eventId);
    const sendMode = getCampaignSendModeStatus();
    return { campaign, recipients, senders, sendMode };
  });
}
