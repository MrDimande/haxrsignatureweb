import { validateTwilioRequestSignature } from "@/lib/messaging/sms/signature";
import type { MessagingStatus, MessagingWebhookEvent } from "@/lib/messaging/types";

/**
 * StatusCallback SMS — reutiliza validação de assinatura Twilio existente.
 * Mapeia delivered / failed / undelivered (e estados intermédios).
 */

const SMS_STATUS_MAP: Record<string, MessagingStatus> = {
  queued: "queued",
  accepted: "queued",
  sending: "sending",
  sent: "sent",
  delivered: "delivered",
  failed: "failed",
  undelivered: "undelivered",
  canceled: "failed",
  cancelled: "failed",
};

export function mapTwilioSmsMessageStatus(
  raw: string | null | undefined
): MessagingStatus | null {
  if (!raw?.trim()) return null;
  return SMS_STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

const STATUS_RANK: Partial<Record<MessagingStatus, number>> = {
  queued: 1,
  sending: 2,
  sent: 3,
  delivered: 4,
  failed: 5,
  undelivered: 5,
};

export function shouldApplySmsStatus(
  current: string,
  next: MessagingStatus
): boolean {
  if (
    (current === "failed" || current === "undelivered") &&
    next !== "failed" &&
    next !== "undelivered"
  ) {
    return false;
  }
  const currentRank = STATUS_RANK[current as MessagingStatus];
  const nextRank = STATUS_RANK[next];
  if (currentRank === undefined || nextRank === undefined) return true;
  if (next === "failed" || next === "undelivered") {
    return currentRank < 5;
  }
  return nextRank >= currentRank;
}

export type SmsWebhookApplyResult =
  | {
      accepted: true;
      event: MessagingWebhookEvent;
      applied: boolean;
    }
  | { accepted: false; reason: string };

/**
 * Processa StatusCallback Twilio SMS após validar X-Twilio-Signature.
 */
export function handleTwilioSmsStatusCallback(input: {
  authToken: string;
  signatureHeader: string | null | undefined;
  callbackUrl: string;
  params: Record<string, string>;
  currentRecipientStatus?: string | null;
}): SmsWebhookApplyResult {
  const signature = validateTwilioRequestSignature({
    authToken: input.authToken,
    signatureHeader: input.signatureHeader,
    url: input.callbackUrl,
    params: input.params,
  });

  if (!signature.ok) {
    return { accepted: false, reason: signature.reason };
  }

  const messageSid = input.params.MessageSid || input.params.SmsSid || "";
  if (!messageSid) {
    return { accepted: false, reason: "MessageSid ausente no callback SMS." };
  }

  const rawStatus = input.params.MessageStatus || input.params.SmsStatus || "";
  const mapped = mapTwilioSmsMessageStatus(rawStatus);
  if (!mapped) {
    return {
      accepted: false,
      reason: `MessageStatus SMS desconhecido: ${rawStatus}`,
    };
  }

  const current = input.currentRecipientStatus ?? "queued";
  const applied = shouldApplySmsStatus(current, mapped);

  const event: MessagingWebhookEvent = {
    provider: "twilio",
    channel: "sms_sandbox_or_test",
    messageSid,
    status: mapped,
    rawStatus,
    to: input.params.To,
    from: input.params.From,
    errorCode: input.params.ErrorCode || undefined,
    receivedAt: new Date().toISOString(),
  };

  return { accepted: true, event, applied };
}

export function twilioSmsParamsFromFormData(
  form: URLSearchParams | FormData
): Record<string, string> {
  const params: Record<string, string> = {};
  if (form instanceof URLSearchParams) {
    for (const [key, value] of form.entries()) {
      params[key] = value;
    }
    return params;
  }
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }
  return params;
}
