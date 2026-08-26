import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type {
  CampaignRecipient,
  CampaignStatus,
  DeliveryAttempt,
  InvitationCampaign,
  RecipientStatus,
  SenderProfile,
} from "@/lib/campaigns/types";
import * as neon from "@/lib/campaigns/repositories/campaigns.neon.repository";
import * as supabase from "@/lib/campaigns/repositories/campaigns.supabase.repository";

function repository() {
  return shouldUseNeonServerDatabase() ? neon : supabase;
}

export function listSenderProfiles(eventId: string): Promise<SenderProfile[]> {
  return repository().listSenderProfiles(eventId);
}

export function insertSenderProfile(
  profile: Omit<SenderProfile, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<SenderProfile> {
  return repository().insertSenderProfile(profile);
}

export function listCampaignsByEvent(eventId: string): Promise<InvitationCampaign[]> {
  return repository().listCampaignsByEvent(eventId);
}

export function getCampaignById(
  eventId: string,
  campaignId: string,
): Promise<InvitationCampaign | null> {
  return repository().getCampaignById(eventId, campaignId);
}

export function findCampaignByIdempotency(
  eventId: string,
  idempotencyKey: string,
): Promise<InvitationCampaign | null> {
  return repository().findCampaignByIdempotency(eventId, idempotencyKey);
}

export function insertCampaign(campaign: InvitationCampaign): Promise<InvitationCampaign> {
  return repository().insertCampaign(campaign);
}

export function updateCampaign(
  eventId: string,
  campaignId: string,
  patch: Partial<{
    senderProfileId: string | null;
    messageTemplate: string;
    status: CampaignStatus;
    name: string;
  }>,
): Promise<InvitationCampaign> {
  return repository().updateCampaign(eventId, campaignId, patch);
}

export function insertRecipients(recipients: CampaignRecipient[]): Promise<void> {
  return repository().insertRecipients(recipients);
}

export function listRecipientsByCampaign(
  eventId: string,
  campaignId: string,
): Promise<CampaignRecipient[]> {
  return repository().listRecipientsByCampaign(eventId, campaignId);
}

export function updateRecipient(
  eventId: string,
  recipientId: string,
  patch: Partial<{
    status: RecipientStatus;
    renderedMessage: string;
    invitationUrl: string;
    lastActionAt: string | null;
    providerMessageSid: string | null;
  }>,
): Promise<CampaignRecipient> {
  return repository().updateRecipient(eventId, recipientId, patch);
}

export function bulkUpdateRecipientMessages(
  eventId: string,
  updates: Array<{ id: string; renderedMessage: string; invitationUrl: string }>,
): Promise<void> {
  return repository().bulkUpdateRecipientMessages(eventId, updates);
}

export function insertDeliveryAttempt(
  attempt: Omit<DeliveryAttempt, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): Promise<void> {
  return repository().insertDeliveryAttempt(attempt);
}
