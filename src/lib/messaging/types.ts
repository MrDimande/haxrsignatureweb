/**
 * Abstracção de messaging omnicanal (WhatsApp + SMS).
 * Server-only — nunca NEXT_PUBLIC_*.
 */

export const MESSAGING_CHANNELS = [
  "manual_whatsapp",
  "whatsapp_sandbox",
  "whatsapp_production",
  "sms_sandbox_or_test",
  "sms_production",
] as const;

export type MessagingChannel = (typeof MESSAGING_CHANNELS)[number];

export const MESSAGING_STATUSES = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "failed",
  "undelivered",
  "opted_out",
  "blocked",
  "dry_run",
] as const;

export type MessagingStatus = (typeof MESSAGING_STATUSES)[number];

export type MessagingRecipient = {
  id: string;
  phoneE164: string;
  displayName?: string;
  /** Se WhatsApp já entregou — nunca duplicar SMS automático. */
  whatsappDelivered?: boolean;
  optedOut?: boolean;
};

export type MessagingMessage = {
  body: string;
  /** URL do convite incluída no corpo (quando aplicável). */
  invitationUrl?: string;
  /** Chave de idempotência (max ~64 chars para header Twilio). */
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type MessagingResult = {
  ok: boolean;
  channel: MessagingChannel;
  status: MessagingStatus;
  providerMessageId?: string;
  dryRun: boolean;
  error?: string;
  /** Aviso informativo de custo/segmentos — nunca bloqueia sozinho. */
  costWarning?: string;
  segmentEstimate?: number;
};

export type MessagingWebhookEvent = {
  provider: "twilio";
  channel: MessagingChannel;
  messageSid: string;
  status: MessagingStatus;
  rawStatus: string;
  to?: string;
  from?: string;
  errorCode?: string;
  receivedAt: string;
};

export type MessagingSendInput = {
  channel: MessagingChannel;
  recipient: MessagingRecipient;
  message: MessagingMessage;
};

/**
 * Contrato do provider. Implementações devem ser fail-closed por defeito.
 */
export interface MessagingProvider {
  readonly id: string;
  supports(channel: MessagingChannel): boolean;
  send(input: MessagingSendInput): Promise<MessagingResult>;
}
