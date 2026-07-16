import {
  mapTwilioMessageStatus,
  shouldApplyTwilioStatus,
} from "@/lib/campaigns/provider/twilio-status";
import { validateTwilioRequestSignature } from "@/lib/campaigns/provider/twilio-signature";
import { sanitizeTwilioWebhookParams } from "@/lib/campaigns/provider/twilio-sanitize";
import type { TwilioDeliveryStatus } from "@/lib/campaigns/types";

export type TwilioStatusCallbackParams = Record<string, string>;

export type TwilioWebhookApplyResult =
  | {
      accepted: true;
      messageSid: string;
      status: TwilioDeliveryStatus;
      applied: boolean;
      replay: boolean;
      sanitizedParams: Record<string, string>;
    }
  | {
      accepted: false;
      reason: string;
      sanitizedParams: Record<string, string>;
    };

/**
 * Processa StatusCallback Twilio após validar assinatura.
 * Nunca aceita payloads sem X-Twilio-Signature válida.
 * Rejeita AccountSid desconhecido e MessageStatus inválido.
 */
export function handleTwilioWhatsappStatusCallback(input: {
  authToken: string;
  expectedAccountSid: string;
  signatureHeader: string | null | undefined;
  callbackUrl: string;
  params: TwilioStatusCallbackParams;
  /** Status actual do recipient (se já conhecido). */
  currentRecipientStatus?: string | null;
  /** true se este MessageSid+MessageStatus já foi processado. */
  alreadyProcessed?: boolean;
}): TwilioWebhookApplyResult {
  const sanitizedParams = sanitizeTwilioWebhookParams(input.params);

  const signature = validateTwilioRequestSignature({
    authToken: input.authToken,
    signatureHeader: input.signatureHeader,
    url: input.callbackUrl,
    params: input.params,
  });

  if (!signature.ok) {
    return {
      accepted: false,
      reason: signature.reason,
      sanitizedParams,
    };
  }

  const accountSid = (input.params.AccountSid || "").trim();
  if (!accountSid) {
    return {
      accepted: false,
      reason: "AccountSid ausente no callback.",
      sanitizedParams,
    };
  }
  if (accountSid !== input.expectedAccountSid.trim()) {
    return {
      accepted: false,
      reason: "AccountSid do callback não corresponde à conta configurada.",
      sanitizedParams,
    };
  }

  const messageSid = input.params.MessageSid || input.params.SmsSid || "";
  if (!messageSid) {
    return {
      accepted: false,
      reason: "MessageSid ausente no callback.",
      sanitizedParams,
    };
  }

  const mapped = mapTwilioMessageStatus(input.params.MessageStatus);
  if (!mapped) {
    return {
      accepted: false,
      reason: `MessageStatus desconhecido: ${input.params.MessageStatus ?? ""}`,
      sanitizedParams,
    };
  }

  if (input.alreadyProcessed) {
    return {
      accepted: true,
      messageSid,
      status: mapped,
      applied: false,
      replay: true,
      sanitizedParams,
    };
  }

  const current = input.currentRecipientStatus ?? "pending";
  const applied = shouldApplyTwilioStatus(current, mapped);

  return {
    accepted: true,
    messageSid,
    status: mapped,
    applied,
    replay: false,
    sanitizedParams,
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

export function twilioReplayKey(
  messageSid: string,
  messageStatus: string
): string {
  return `${messageSid}:${messageStatus.trim().toLowerCase()}`;
}
