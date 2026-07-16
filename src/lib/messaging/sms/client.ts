import type { TwilioSmsConfig } from "@/lib/messaging/sms/config";
import { formatSmsE164 } from "@/lib/messaging/sms/config";

export type TwilioSmsSendInput = {
  toPhone: string;
  body: string;
  statusCallbackUrl: string;
  idempotencyKey: string;
};

export type TwilioSmsSendResult =
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

export type TwilioSmsMessagesClient = {
  sendSms(input: TwilioSmsSendInput): Promise<TwilioSmsSendResult>;
};

/**
 * Cliente HTTP Twilio Messages API (SMS).
 * Sem SDK — secrets só em memória server-side.
 * Se liveSendEnabled=false → dry-run (não chama a API).
 * Nunca regista auth token / SID completo em erros.
 */
export function createTwilioSmsClient(
  config: TwilioSmsConfig
): TwilioSmsMessagesClient {
  return {
    async sendSms(input) {
      if (!config.liveSendEnabled) {
        return {
          ok: true,
          dryRun: true,
          sid: `DRYRUN_SMS_${input.idempotencyKey.slice(0, 20)}`,
          status: "queued",
        };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: formatSmsE164(input.toPhone),
        From: config.smsFrom,
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
              `Twilio SMS HTTP ${response.status}`,
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
              : "Falha de rede ao contactar Twilio SMS.",
        };
      }
    },
  };
}

/** Mock client — nunca chama rede. */
export function createMockTwilioSmsClient(
  overrides?: Partial<TwilioSmsSendResult>
): TwilioSmsMessagesClient {
  return {
    async sendSms(input) {
      if (overrides && "ok" in overrides && overrides.ok === false) {
        return {
          ok: false,
          dryRun: true,
          error: overrides.error ?? "mock_error",
          code: overrides.code,
        };
      }
      return {
        ok: true,
        dryRun: true,
        sid: `MOCK_SMS_${input.idempotencyKey.slice(0, 20)}`,
        status: "queued",
        ...(overrides && overrides.ok !== false ? overrides : {}),
      };
    },
  };
}
