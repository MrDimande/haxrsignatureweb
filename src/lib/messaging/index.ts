/**
 * Messaging abstraction — WhatsApp + SMS.
 * Entry point público do módulo.
 */

export type {
  MessagingChannel,
  MessagingMessage,
  MessagingProvider,
  MessagingRecipient,
  MessagingResult,
  MessagingSendInput,
  MessagingStatus,
  MessagingWebhookEvent,
} from "@/lib/messaging/types";

export { MESSAGING_CHANNELS, MESSAGING_STATUSES } from "@/lib/messaging/types";

export {
  isProductionChannel,
  isSmsChannel,
  isWhatsappChannel,
} from "@/lib/messaging/channels";

export {
  getSmsSendMode,
  gateSmsSend,
  parseSmsSendMode,
  HAXR_SMS_SEND_MODES,
} from "@/lib/messaging/sms/send-mode";
export type { HaxrSmsSendMode, SmsGateResult } from "@/lib/messaging/sms/send-mode";

export {
  resolveTwilioSmsConfig,
  hasTwilioSmsCredentials,
  isHaxrManualWhatsappAsSmsFrom,
  HAXR_MANUAL_WHATSAPP_DIGITS,
  TWILIO_SMS_ENV_KEYS,
} from "@/lib/messaging/sms/config";

export {
  detectSmsEncoding,
  countSmsCharacters,
  estimateSmsSegments,
} from "@/lib/messaging/sms/encoding";

export { buildInvitationSmsMessage } from "@/lib/messaging/sms/message-builder";
export {
  buildSmsIdempotencyKey,
  fingerprintSmsBody,
} from "@/lib/messaging/sms/idempotency";

export {
  TwilioSmsMessagingProvider,
  createFailClosedSmsPreviewProvider,
} from "@/lib/messaging/sms/provider";

export { MockMessagingProvider } from "@/lib/messaging/sms/mock";

export {
  handleTwilioSmsStatusCallback,
  mapTwilioSmsMessageStatus,
  shouldApplySmsStatus,
} from "@/lib/messaging/sms/webhook";

export {
  computeTwilioSignature,
  validateTwilioRequestSignature,
} from "@/lib/messaging/sms/signature";

export {
  planWhatsappToSmsFallback,
  confirmWhatsappToSmsFallback,
  SMS_FALLBACK_CONFIRM_ACTION,
} from "@/lib/messaging/sms/fallback";

export {
  createSmsStubStack,
  FailClosedSmsSendQueue,
  InMemorySmsIdempotencyStore,
  InMemorySmsAuditTrail,
  InMemorySmsOptOutStore,
} from "@/lib/messaging/sms/stubs";
