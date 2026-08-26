import { neonQuery } from "@/lib/neon/server-db";
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

type JsonRow<T> = { row: T };

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

export async function listSenderProfiles(eventId: string): Promise<SenderProfile[]> {
  const result = await neonQuery<JsonRow<SenderRow>>(
    `SELECT to_jsonb(s) AS row FROM public.sender_profiles s WHERE s.event_id=$1::uuid ORDER BY s.created_at`,
    [eventId],
  );
  return result.rows.map(({ row }) => mapSender(row));
}

export async function insertSenderProfile(
  profile: Omit<SenderProfile, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<SenderProfile> {
  const result = await neonQuery<JsonRow<SenderRow>>(
    `
      WITH cleared AS (
        UPDATE public.sender_profiles
        SET is_default=false
        WHERE $9::boolean
          AND event_id=$2::uuid
          AND is_default=true
        RETURNING id
      ), saved AS (
        INSERT INTO public.sender_profiles (
          id,event_id,sender_kind,public_name,masked_number,provider,
          provider_phone_id,status,is_default
        ) VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      profile.id,
      profile.eventId,
      profile.senderKind,
      profile.publicName,
      profile.maskedNumber,
      profile.provider,
      profile.providerPhoneId,
      profile.status,
      profile.isDefault,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar sender profile.");
  return mapSender(row);
}

export async function listCampaignsByEvent(eventId: string): Promise<InvitationCampaign[]> {
  const result = await neonQuery<JsonRow<CampaignRow>>(
    `SELECT to_jsonb(c) AS row FROM public.invitation_campaigns c WHERE c.event_id=$1::uuid ORDER BY c.created_at DESC`,
    [eventId],
  );
  return result.rows.map(({ row }) => mapCampaign(row));
}

export async function getCampaignById(
  eventId: string,
  campaignId: string,
): Promise<InvitationCampaign | null> {
  const result = await neonQuery<JsonRow<CampaignRow>>(
    `SELECT to_jsonb(c) AS row FROM public.invitation_campaigns c WHERE c.id=$2::uuid AND c.event_id=$1::uuid LIMIT 1`,
    [eventId, campaignId],
  );
  const row = result.rows[0]?.row;
  return row ? mapCampaign(row) : null;
}

export async function findCampaignByIdempotency(
  eventId: string,
  idempotencyKey: string,
): Promise<InvitationCampaign | null> {
  const result = await neonQuery<JsonRow<CampaignRow>>(
    `SELECT to_jsonb(c) AS row FROM public.invitation_campaigns c WHERE c.event_id=$1::uuid AND c.idempotency_key=$2 LIMIT 1`,
    [eventId, idempotencyKey],
  );
  const row = result.rows[0]?.row;
  return row ? mapCampaign(row) : null;
}

export async function insertCampaign(
  campaign: InvitationCampaign,
): Promise<InvitationCampaign> {
  const result = await neonQuery<JsonRow<CampaignRow>>(
    `
      WITH saved AS (
        INSERT INTO public.invitation_campaigns (
          id,event_id,sender_profile_id,name,invitation_registry_key,
          recipients_selection,batch_key,message_template,status,scheduled_at,
          preview_limit,test_mode,rsvp_deadline,couple_names,event_name,event_date,
          event_location,idempotency_key,send_mode_snapshot
        ) VALUES (
          $1::uuid,$2::uuid,$3::uuid,$4,$5,$6::jsonb,$7,$8,$9,$10::timestamptz,
          $11,$12,$13,$14,$15,$16,$17,$18,$19
        )
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      campaign.id,
      campaign.eventId,
      campaign.senderProfileId,
      campaign.name,
      campaign.invitationRegistryKey,
      JSON.stringify(campaign.recipientsSelection),
      campaign.batchKey,
      campaign.messageTemplate,
      campaign.status,
      campaign.scheduledAt,
      campaign.previewLimit,
      campaign.testMode,
      campaign.rsvpDeadline,
      campaign.coupleNames,
      campaign.eventName,
      campaign.eventDate,
      campaign.eventLocation,
      campaign.idempotencyKey,
      campaign.sendModeSnapshot,
    ],
  );
  const row = result.rows[0]?.row;
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
  }>,
): Promise<InvitationCampaign> {
  const result = await neonQuery<JsonRow<CampaignRow>>(
    `
      WITH saved AS (
        UPDATE public.invitation_campaigns
        SET
          sender_profile_id=CASE WHEN $3::boolean THEN $4::uuid ELSE sender_profile_id END,
          message_template=CASE WHEN $5::boolean THEN $6::text ELSE message_template END,
          status=CASE WHEN $7::boolean THEN $8::text ELSE status END,
          name=CASE WHEN $9::boolean THEN $10::text ELSE name END
        WHERE id=$2::uuid AND event_id=$1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      eventId,
      campaignId,
      patch.senderProfileId !== undefined,
      patch.senderProfileId ?? null,
      patch.messageTemplate !== undefined,
      patch.messageTemplate ?? null,
      patch.status !== undefined,
      patch.status ?? null,
      patch.name !== undefined,
      patch.name ?? null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Campanha não encontrada.");
  return mapCampaign(row);
}

export async function insertRecipients(recipients: CampaignRecipient[]): Promise<void> {
  if (!recipients.length) return;
  const payload = recipients.map((r) => ({
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
  }));
  await neonQuery(
    `
      INSERT INTO public.campaign_recipients (
        id,campaign_id,event_id,guest_id,guest_name,phone_e164,phone_masked,
        invitation_url,rendered_message,status,batch_key,last_action_at,provider_message_sid
      )
      SELECT x.id,x.campaign_id,x.event_id,x.guest_id,x.guest_name,x.phone_e164,
             x.phone_masked,x.invitation_url,x.rendered_message,x.status,x.batch_key,
             x.last_action_at,x.provider_message_sid
      FROM jsonb_to_recordset($1::jsonb) AS x(
        id uuid,campaign_id uuid,event_id uuid,guest_id uuid,guest_name text,
        phone_e164 text,phone_masked text,invitation_url text,rendered_message text,
        status text,batch_key text,last_action_at timestamptz,provider_message_sid text
      )
    `,
    [JSON.stringify(payload)],
  );
}

export async function listRecipientsByCampaign(
  eventId: string,
  campaignId: string,
): Promise<CampaignRecipient[]> {
  const result = await neonQuery<JsonRow<RecipientRow>>(
    `SELECT to_jsonb(r) AS row FROM public.campaign_recipients r WHERE r.event_id=$1::uuid AND r.campaign_id=$2::uuid ORDER BY r.guest_name`,
    [eventId, campaignId],
  );
  return result.rows.map(({ row }) => mapRecipient(row));
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
  }>,
): Promise<CampaignRecipient> {
  const result = await neonQuery<JsonRow<RecipientRow>>(
    `
      WITH saved AS (
        UPDATE public.campaign_recipients
        SET
          status=CASE WHEN $3::boolean THEN $4::text ELSE status END,
          rendered_message=CASE WHEN $5::boolean THEN $6::text ELSE rendered_message END,
          invitation_url=CASE WHEN $7::boolean THEN $8::text ELSE invitation_url END,
          last_action_at=CASE WHEN $9::boolean THEN $10::timestamptz ELSE last_action_at END,
          provider_message_sid=CASE WHEN $11::boolean THEN $12::text ELSE provider_message_sid END
        WHERE id=$2::uuid AND event_id=$1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      eventId,
      recipientId,
      patch.status !== undefined,
      patch.status ?? null,
      patch.renderedMessage !== undefined,
      patch.renderedMessage ?? null,
      patch.invitationUrl !== undefined,
      patch.invitationUrl ?? null,
      patch.lastActionAt !== undefined,
      patch.lastActionAt ?? null,
      patch.providerMessageSid !== undefined,
      patch.providerMessageSid ?? null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Destinatário não encontrado.");
  return mapRecipient(row);
}

export async function bulkUpdateRecipientMessages(
  eventId: string,
  updates: Array<{ id: string; renderedMessage: string; invitationUrl: string }>,
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
  },
): Promise<void> {
  await neonQuery(
    `
      INSERT INTO public.delivery_attempts (
        id,event_id,campaign_id,recipient_id,attempt_kind,outcome,detail,provider_ref,actor
      ) VALUES (
        COALESCE($1::uuid,gen_random_uuid()),$2::uuid,$3::uuid,$4::uuid,$5,$6,$7,$8,$9
      )
    `,
    [
      attempt.id ?? null,
      attempt.eventId,
      attempt.campaignId,
      attempt.recipientId,
      attempt.attemptKind,
      attempt.outcome,
      attempt.detail,
      attempt.providerRef,
      attempt.actor,
    ],
  );
}
