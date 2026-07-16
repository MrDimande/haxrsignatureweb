import {
  mapTwilioMessageStatus,
  shouldApplyTwilioStatus,
} from "@/lib/campaigns/provider/twilio-status";
import { validateTwilioRequestSignature } from "@/lib/campaigns/provider/twilio-signature";
import type { TwilioDeliveryStatus } from "@/lib/campaigns/types";

export type TwilioStatusCallbackParams = Record<string, string>;

export type TwilioWebhookApplyResult =
  | {
      accepted: true;
      messageSid: string;
      status: TwilioDeliveryStatus;
      applied: boolean;
    }
  | { accepted: false; reason: string };

/**
 * Processa StatusCallback Twilio após validar assinatura.
 * Nunca aceita payloads sem X-Twilio-Signature válida.
 */
export function handleTwilioWhatsappStatusCallback(input: {
  authToken: string;
  signatureHeader: string | null | undefined;
  callbackUrl: string;
  params: TwilioStatusCallbackParams;
  /** Status actual do recipient (se já conhecido). */
  currentRecipientStatus?: string | null;
}): TwilioWebhookApplyResult {
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
    return { accepted: false, reason: "MessageSid ausente no callback." };
  }

  const mapped = mapTwilioMessageStatus(input.params.MessageStatus);
  if (!mapped) {
    return {
      accepted: false,
      reason: `MessageStatus desconhecido: ${input.params.MessageStatus ?? ""}`,
    };
  }

  const current = input.currentRecipientStatus ?? "pending";
  const applied = shouldApplyTwilioStatus(current, mapped);

  return {
    accepted: true,
    messageSid,
    status: mapped,
    applied,
  };
}

/** Converte form-urlencoded / URLSearchParams em Record<string,string>. */
export function twilioParamsFromFormData(
  form: URLSearchParams | FormData
): TwilioStatusCallbackParams {
  const params: TwilioStatusCallbackParams = {};
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
