/**
 * Persistência de campanhas — Supabase (service_role) com isolamento event_id.
 * Quando o schema 044 ainda não foi aplicado, o caller deve tratar schema-missing.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { asGenericRow, asGenericRows } from "@/lib/supabase/helpers";
import type {
  CampaignRecipient,
  CampaignStatus,
  DeliveryAttempt,
  HaxrWhatsappSendMode,
  InvitationCampaign,
  RecipientStatus,
  SenderKind,
  SenderProfile,
  SenderProvider,
  SenderStatus,
} from "@/lib/campaigns/types";

type SenderRow = {
  id: string;
  event_id: string;
  sender_kind: string;
  public_name: string;
  masked_number: string;
  provider: string;
  provider_phone_id: string | null;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type CampaignRow = {
  id: string;
  event_id: string;
  sender_profile_id: string | null;
  name: string;
  invitation_registry_key: string;
  recipients_selection: Record<string, unknown> | null;
  batch_key: string | null;
  message_template: string;
  status: string;
  scheduled_at: string | null;
  preview_limit: number | null;
  test_mode: boolean | null;
  rsvp_deadline: string;
  couple_names: string;
  event_name: string;
  event_date: string;
  event_location: string;
  idempotency_key: string | null;
  send_mode_snapshot: string;
  created_at: string;
  updated_at: string;
};

type RecipientRow = {
  id: string;
  campaign_id: string;
  event_id: string;
  guest_id: string | null;
  guest_name: string;
  phone_e164: string | null;
  phone_masked: string;
  invitation_url: string;
  rendered_message: string;
  status: string;
  batch_key: string;
  last_action_at: string | null;
  provider_message_sid: string | null;
  created_at: string;
  updated_at: string;
};

function mapSender(row: SenderRow): SenderProfile {
  return {
    id: row.id,
    eventId: row.event_id,
    senderKind: row.sender_kind as SenderKind,
    publicName: row.public_name,
    maskedNumber: row.masked_number,
    provider: row.provider as SenderProvider,
    providerPhoneId: row.provider_phone_id,
    status: row.status as SenderStatus,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaign(row: CampaignRow): InvitationCampaign {
  return {
    id: row.id,
    eventId: row.event_id,
    senderProfileId: row.sender_profile_id,
    name: row.name,
    invitationRegistryKey: row.invitation_registry_key,
    recipientsSelection: row.recipients_selection ?? {},
    batchKey: row.batch_key ?? "default",
    messageTemplate: row.message_template,
    status: row.status as CampaignStatus,
    scheduledAt: row.scheduled_at,
    previewLimit: row.preview_limit ?? 25,
    testMode: row.test_mode ?? true,
    rsvpDeadline: row.rsvp_deadline ?? "",
    coupleNames: row.couple_names ?? "",
    eventName: row.event_name ?? "",
    eventDate: row.event_date ?? "",
    eventLocation: row.event_location ?? "",
    idempotencyKey: row.idempotency_key,
    sendModeSnapshot: row.send_mode_snapshot as HaxrWhatsappSendMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecipient(row: RecipientRow): CampaignRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    eventId: row.event_id,
    guestId: row.guest_id,
    guestName: row.guest_name,
    phoneE164: row.phone_e164,
    phoneMasked: row.phone_masked,
    invitationUrl: row.invitation_url,
    renderedMessage: row.rendered_message,
    status: row.status as RecipientStatus,
    batchKey: row.batch_key,
    lastActionAt: row.last_action_at,
    providerMessageSid: row.provider_message_sid ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSenderProfiles(
  eventId: string
): Promise<SenderProfile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sender_profiles" as never)
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return asGenericRows<SenderRow>(data).map(mapSender);
}

export async function insertSenderProfile(
  profile: Omit<SenderProfile, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<SenderProfile> {
  const supabase = createAdminClient();
  if (profile.isDefault) {
    await supabase
      .from("sender_profiles" as never)
      .update({ is_default: false } as never)
      .eq("event_id", profile.eventId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("sender_profiles" as never)
    .insert({
      id: profile.id,
      event_id: profile.eventId,
      sender_kind: profile.senderKind,
      public_name: profile.publicName,
      masked_number: profile.maskedNumber,
      provider: profile.provider,
      provider_phone_id: profile.providerPhoneId,
      status: profile.status,
      is_default: profile.isDefault,
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asGenericRow<SenderRow>(data);
  if (!row) throw new Error("Falha ao criar sender profile.");
  return mapSender(row);
}

export async function listCampaignsByEvent(
  eventId: string
): Promise<InvitationCampaign[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitation_campaigns" as never)
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return asGenericRows<CampaignRow>(data).map(mapCampaign);
}

export async function getCampaignById(
  eventId: string,
  campaignId: string
): Promise<InvitationCampaign | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitation_campaigns" as never)
    .select("*")
    .eq("id", campaignId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asGenericRow<CampaignRow>(data);
  return row ? mapCampaign(row) : null;
}

export async function findCampaignByIdempotency(
  eventId: string,
  idempotencyKey: string
): Promise<InvitationCampaign | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitation_campaigns" as never)
    .select("*")
    .eq("event_id", eventId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asGenericRow<CampaignRow>(data);
  return row ? mapCampaign(row) : null;
}

export async function insertCampaign(
  campaign: InvitationCampaign
): Promise<InvitationCampaign> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitation_campaigns" as never)
    .insert({
      id: campaign.id,
      event_id: campaign.eventId,
      sender_profile_id: campaign.senderProfileId,
      name: campaign.name,
      invitation_registry_key: campaign.invitationRegistryKey,
      recipients_selection: campaign.recipientsSelection,
      batch_key: campaign.batchKey,
      message_template: campaign.messageTemplate,
      status: campaign.status,
      scheduled_at: campaign.scheduledAt,
      preview_limit: campaign.previewLimit,
      test_mode: campaign.testMode,
      rsvp_deadline: campaign.rsvpDeadline,
      couple_names: campaign.coupleNames,
      event_name: campaign.eventName,
      event_date: campaign.eventDate,
      event_location: campaign.eventLocation,
      idempotency_key: campaign.idempotencyKey,
      send_mode_snapshot: campaign.sendModeSnapshot,
    } as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = asGenericRow<CampaignRow>(data);
  if (!row) throw new Error("Falha ao criar campanha.");
  return mapCampaign(row);
}

export async function updateCampaign(
  eventId: string,
  campaignId: string,
  patch: Partial<{
    senderProfileId: string | null;
    messageTemplate: string;
    status: CampaignStatus;
    name: string;
  }>
): Promise<InvitationCampaign> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (patch.senderProfileId !== undefined) {
    payload.sender_profile_id = patch.senderProfileId;
  }
  if (patch.messageTemplate !== undefined) {
    payload.message_template = patch.messageTemplate;
  }
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.name !== undefined) payload.name = patch.name;

  const { data, error } = await supabase
    .from("invitation_campaigns" as never)
    .update(payload as never)
    .eq("id", campaignId)
    .eq("event_id", eventId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = asGenericRow<CampaignRow>(data);
  if (!row) throw new Error("Campanha não encontrada.");
  return mapCampaign(row);
}

export async function insertRecipients(
  recipients: CampaignRecipient[]
): Promise<void> {
  if (!recipients.length) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaign_recipients" as never).insert(
    recipients.map((r) => ({
      id: r.id,
      campaign_id: r.campaignId,
      event_id: r.eventId,
      guest_id: r.guestId,
      guest_name: r.guestName,
      phone_e164: r.phoneE164,
      phone_masked: r.phoneMasked,
      invitation_url: r.invitationUrl,
      rendered_message: r.renderedMessage,
      status: r.status,
      batch_key: r.batchKey,
      last_action_at: r.lastActionAt,
      provider_message_sid: r.providerMessageSid,
    })) as never
  );
  if (error) throw new Error(error.message);
}

export async function listRecipientsByCampaign(
  eventId: string,
  campaignId: string
): Promise<CampaignRecipient[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaign_recipients" as never)
    .select("*")
    .eq("event_id", eventId)
    .eq("campaign_id", campaignId)
    .order("guest_name");
  if (error) throw new Error(error.message);
  return asGenericRows<RecipientRow>(data).map(mapRecipient);
}

export async function updateRecipient(
  eventId: string,
  recipientId: string,
  patch: Partial<{
    status: RecipientStatus;
    renderedMessage: string;
    invitationUrl: string;
    lastActionAt: string | null;
    providerMessageSid: string | null;
  }>
): Promise<CampaignRecipient> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.renderedMessage !== undefined) {
    payload.rendered_message = patch.renderedMessage;
  }
  if (patch.invitationUrl !== undefined) {
    payload.invitation_url = patch.invitationUrl;
  }
  if (patch.lastActionAt !== undefined) {
    payload.last_action_at = patch.lastActionAt;
  }
  if (patch.providerMessageSid !== undefined) {
    payload.provider_message_sid = patch.providerMessageSid;
  }

  const { data, error } = await supabase
    .from("campaign_recipients" as never)
    .update(payload as never)
    .eq("id", recipientId)
    .eq("event_id", eventId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = asGenericRow<RecipientRow>(data);
  if (!row) throw new Error("Destinatário não encontrado.");
  return mapRecipient(row);
}

export async function bulkUpdateRecipientMessages(
  eventId: string,
  updates: Array<{
    id: string;
    renderedMessage: string;
    invitationUrl: string;
  }>
): Promise<void> {
  for (const update of updates) {
    await updateRecipient(eventId, update.id, {
      renderedMessage: update.renderedMessage,
      invitationUrl: update.invitationUrl,
    });
  }
}

export async function insertDeliveryAttempt(
  attempt: Omit<DeliveryAttempt, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("delivery_attempts" as never).insert({
    id: attempt.id,
    event_id: attempt.eventId,
    campaign_id: attempt.campaignId,
    recipient_id: attempt.recipientId,
    attempt_kind: attempt.attemptKind,
    outcome: attempt.outcome,
    detail: attempt.detail,
    provider_ref: attempt.providerRef,
    actor: attempt.actor,
  } as never);
  if (error) throw new Error(error.message);
}
