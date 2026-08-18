import type { TwilioWhatsappConfig } from "@/lib/campaigns/provider/twilio-config";
import { formatWhatsappAddress } from "@/lib/campaigns/provider/twilio-config";

export type TwilioSendMessageInput = {
  toPhone: string;
  body: string;
  statusCallbackUrl: string;
  idempotencyKey: string;
};

export type TwilioSendMessageResult =
  | {
      ok: true;
      dryRun: boolean;
      sid: string;
      status: string;
    }
  | {
      ok: false;
      dryRun: boolean;
      error: string;
      code?: string;
    };

export type TwilioMessagesClient = {
  sendWhatsappMessage(
    input: TwilioSendMessageInput
  ): Promise<TwilioSendMessageResult>;
};

/**
 * Cliente HTTP Twilio Messages API.
 * Sem SDK — secrets só em memória server-side.
 * Se liveSendEnabled=false → dry-run (não chama a API).
 */
export function createTwilioMessagesClient(
  config: TwilioWhatsappConfig
): TwilioMessagesClient {
  return {
    async sendWhatsappMessage(input) {
      if (!config.liveSendEnabled) {
        return {
          ok: true,
          dryRun: true,
          sid: `DRYRUN_${input.idempotencyKey.slice(0, 24)}`,
          status: "queued",
        };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: formatWhatsappAddress(input.toPhone),
        From: config.whatsappFrom,
        Body: input.body,
        StatusCallback: input.statusCallbackUrl,
      });

      const auth = Buffer.from(
        `${config.accountSid}:${config.authToken}`
      ).toString("base64");

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            // Idempotency via header Twilio (quando suportado) + nossa chave local.
            "I-Twilio-Idempotency-Token": input.idempotencyKey.slice(0, 64),
          },
          body,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          sid?: string;
          status?: string;
          message?: string;
          code?: number | string;
          error_message?: string;
        };

        if (!response.ok || !payload.sid) {
          return {
            ok: false,
            dryRun: false,
            error:
              payload.error_message ||
              payload.message ||
              `Twilio HTTP ${response.status}`,
            code: payload.code != null ? String(payload.code) : undefined,
          };
        }

        return {
          ok: true,
          dryRun: false,
          sid: payload.sid,
          status: payload.status ?? "queued",
        };
      } catch (error) {
        return {
          ok: false,
          dryRun: false,
          error:
            error instanceof Error
              ? error.message
              : "Falha de rede ao contactar Twilio.",
        };
      }
    },
  };
}
