/**
 * Domínio de campanhas de convites WhatsApp — tipos canónicos.
 * Sem tokens plaintext; isolamento obrigatório por event_id.
 */

export const HAXR_WHATSAPP_SEND_MODES = [
  "disabled",
  "manual",
  "preview_test",
  "production",
] as const;

export type HaxrWhatsappSendMode = (typeof HAXR_WHATSAPP_SEND_MODES)[number];

export const ALLOWED_TEMPLATE_VARIABLES = [
  "guest_name",
  "couple_names",
  "event_name",
  "event_date",
  "event_location",
  "invitation_url",
  "rsvp_deadline",
  "sender_name",
] as const;

export type AllowedTemplateVariable =
  (typeof ALLOWED_TEMPLATE_VARIABLES)[number];

export const SENDER_KINDS = [
  "haxr_official",
  "client_verified_business",
  "manual_authenticated_whatsapp",
] as const;

export type SenderKind = (typeof SENDER_KINDS)[number];

export const SENDER_PROVIDERS = [
  "none",
  "meta_cloud_api",
  "manual_wa_me",
] as const;

export type SenderProvider = (typeof SENDER_PROVIDERS)[number];

export const SENDER_STATUSES = [
  "active",
  "inactive",
  "pending_verification",
  "revoked",
] as const;

export type SenderStatus = (typeof SENDER_STATUSES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "ready",
  "scheduled",
  "sending_manual",
  "paused",
  "completed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const RECIPIENT_STATUSES = [
  "pending",
  "previewed",
  "copied",
  "opened",
  "marked_sent",
  "failed",
  "cancelled",
  "skipped",
] as const;

export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

export const DELIVERY_ATTEMPT_KINDS = [
  "manual_copy",
  "manual_open",
  "manual_marked_sent",
  "preview",
  "provider_blocked",
  "webhook_ignored",
  "export",
] as const;

export type DeliveryAttemptKind = (typeof DELIVERY_ATTEMPT_KINDS)[number];

export type SenderProfile = {
  id: string;
  eventId: string;
  senderKind: SenderKind;
  publicName: string;
  maskedNumber: string;
  provider: SenderProvider;
  providerPhoneId: string | null;
  status: SenderStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvitationCampaign = {
  id: string;
  eventId: string;
  senderProfileId: string | null;
  name: string;
  invitationRegistryKey: string;
  recipientsSelection: Record<string, unknown>;
  batchKey: string;
  messageTemplate: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  previewLimit: number;
  testMode: boolean;
  rsvpDeadline: string;
  coupleNames: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  idempotencyKey: string | null;
  sendModeSnapshot: HaxrWhatsappSendMode;
  createdAt: string;
  updatedAt: string;
};

export type CampaignRecipient = {
  id: string;
  campaignId: string;
  eventId: string;
  guestId: string | null;
  guestName: string;
  phoneE164: string | null;
  phoneMasked: string;
  invitationUrl: string;
  renderedMessage: string;
  status: RecipientStatus;
  batchKey: string;
  lastActionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryAttempt = {
  id: string;
  eventId: string;
  campaignId: string;
  recipientId: string;
  attemptKind: DeliveryAttemptKind;
  outcome: "success" | "blocked" | "failed" | "noop";
  detail: string;
  providerRef: string | null;
  actor: string;
  createdAt: string;
};

export type TemplateContext = Record<AllowedTemplateVariable, string>;

export type CampaignGuestInput = {
  guestId: string;
  guestName: string;
  phone?: string | null;
};

export type CreateCampaignInput = {
  eventId: string;
  name: string;
  invitationRegistryKey: string;
  messageTemplate: string;
  senderProfileId?: string | null;
  scheduledAt?: string | null;
  rsvpDeadline?: string;
  coupleNames?: string;
  idempotencyKey?: string | null;
  guests: CampaignGuestInput[];
  eventName: string;
  eventDate: string;
  eventLocation: string;
  batchKey?: string;
  recipientsSelection?: Record<string, unknown>;
  previewLimit?: number;
  testMode?: boolean;
};

export type ManualRecipientOps = {
  recipientId: string;
  guestName: string;
  phoneMasked: string;
  renderedMessage: string;
  waMeUrl: string | null;
  status: RecipientStatus;
  invitationUrl: string;
};
