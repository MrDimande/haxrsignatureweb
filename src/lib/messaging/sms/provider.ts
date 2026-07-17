import { isSmsChannel } from "@/lib/messaging/channels";
import type {
  MessagingChannel,
  MessagingProvider,
  MessagingResult,
  MessagingSendInput,
} from "@/lib/messaging/types";
import {
  createTwilioSmsClient,
  type TwilioSmsMessagesClient,
} from "@/lib/messaging/sms/client";
import {
  isSmsSandboxRecipientAllowed,
  resolveTwilioSmsConfig,
  type TwilioSmsConfig,
} from "@/lib/messaging/sms/config";
import { estimateSmsSegments } from "@/lib/messaging/sms/encoding";
import { gateSmsSend, getSmsSendMode } from "@/lib/messaging/sms/send-mode";
import type {
  SmsAuditTrail,
  SmsIdempotencyStore,
  SmsOptOutStore,
  SmsThrottler,
} from "@/lib/messaging/sms/stubs";
import {
  AllowAllSmsThrottler,
  InMemorySmsAuditTrail,
  InMemorySmsIdempotencyStore,
  InMemorySmsOptOutStore,
} from "@/lib/messaging/sms/stubs";

export type TwilioSmsProviderOptions = {
  config?: TwilioSmsConfig;
  client?: TwilioSmsMessagesClient;
  idempotency?: SmsIdempotencyStore;
  throttler?: SmsThrottler;
  optOut?: SmsOptOutStore;
  audit?: SmsAuditTrail;
  env?: NodeJS.ProcessEnv;
  /** Event id para chave de idempotência composta. */
  eventId?: string;
};

/**
 * Provider SMS Twilio — fail-closed.
 * Production bloqueado; sandbox dry-run por defeito.
 */
export class TwilioSmsMessagingProvider implements MessagingProvider {
  readonly id = "twilio_sms";

  private readonly env: NodeJS.ProcessEnv;
  private readonly config: TwilioSmsConfig | null;
  private readonly configReason: string | null;
  private readonly client: TwilioSmsMessagesClient | null;
  private readonly idempotency: SmsIdempotencyStore;
  private readonly throttler: SmsThrottler;
  private readonly optOut: SmsOptOutStore;
  private readonly audit: SmsAuditTrail;
  private readonly eventId: string;

  constructor(options: TwilioSmsProviderOptions = {}) {
    this.env = options.env ?? process.env;
    this.eventId = options.eventId ?? "default";
    this.idempotency =
      options.idempotency ?? new InMemorySmsIdempotencyStore();
    this.throttler = options.throttler ?? new AllowAllSmsThrottler();
    this.optOut = options.optOut ?? new InMemorySmsOptOutStore();
    this.audit = options.audit ?? new InMemorySmsAuditTrail();

    if (options.config) {
      this.config = options.config;
      this.configReason = null;
      this.client = options.client ?? createTwilioSmsClient(options.config);
    } else {
      const resolved = resolveTwilioSmsConfig(this.env);
      if (resolved.ok) {
        this.config = resolved.config;
        this.configReason = null;
        this.client =
          options.client ?? createTwilioSmsClient(resolved.config);
      } else {
        this.config = null;
        this.configReason = resolved.reason;
        this.client = options.client ?? null;
      }
    }
  }

  supports(channel: MessagingChannel): boolean {
    return isSmsChannel(channel);
  }

  async send(input: MessagingSendInput): Promise<MessagingResult> {
    const { channel, recipient, message } = input;

    if (!this.supports(channel)) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error: `Canal ${channel} não suportado pelo Twilio SMS provider.`,
      };
    }

    const segments = estimateSmsSegments(message.body);

    if (recipient.optedOut || (await this.optOut.isOptedOut(recipient.phoneE164))) {
      await this.audit.record({
        at: new Date().toISOString(),
        action: "sms_blocked_opt_out",
        recipientId: recipient.id,
        channel,
      });
      return {
        ok: false,
        channel,
        status: "opted_out",
        dryRun: true,
        error: "Destinatário com opt-out SMS.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    if (recipient.whatsappDelivered) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error:
          "WhatsApp já entregue — SMS bloqueado para evitar duplicação.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    // Production channel always fail-closed in this PR
    if (channel === "sms_production") {
      await this.audit.record({
        at: new Date().toISOString(),
        action: "sms_production_blocked",
        recipientId: recipient.id,
        channel,
        detail: "fail-closed",
      });
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error:
          "sms_production está fail-closed por defeito. Sem GO humano / live send.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    const mode = getSmsSendMode(this.env);
    const gate = gateSmsSend({
      mode,
      configOk: this.config != null,
      env: this.env,
    });
    if (!gate.allowed) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error: gate.reason,
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    if (!this.config || !this.client) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error: this.configReason ?? "Config Twilio SMS ausente — fail-closed.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    if (
      !isSmsSandboxRecipientAllowed(
        recipient.phoneE164,
        this.config.sandboxAllowlist
      )
    ) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error:
          "Destinatário fora da allowlist SMS sandbox — nenhum convidado real permitido.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    const reserved = await this.idempotency.reserve(
      this.eventId,
      message.idempotencyKey
    );
    if (!reserved.reserved) {
      return {
        ok: true,
        channel,
        status: "queued",
        providerMessageId: reserved.existingRef,
        dryRun: true,
        error: undefined,
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    const allowed = await this.throttler.allow(this.eventId, recipient.id);
    if (!allowed) {
      return {
        ok: false,
        channel,
        status: "blocked",
        dryRun: true,
        error: "Throttling SMS bloqueou o envio.",
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    const send = await this.client.sendSms({
      toPhone: recipient.phoneE164,
      body: message.body,
      statusCallbackUrl: this.config.statusCallbackUrl,
      idempotencyKey: message.idempotencyKey,
    });

    await this.audit.record({
      at: new Date().toISOString(),
      action: send.ok ? "sms_send_ok" : "sms_send_failed",
      recipientId: recipient.id,
      channel,
      detail: send.ok ? (send.dryRun ? "dry_run" : "live") : "error",
      metadata: send.ok
        ? { sidPrefix: send.sid.slice(0, 12) }
        : { code: "code" in send && send.code ? send.code : "unknown" },
    });

    if (!send.ok) {
      return {
        ok: false,
        channel,
        status: "failed",
        dryRun: send.dryRun,
        error: send.error,
        segmentEstimate: segments.segmentCount,
        costWarning: segments.costWarning ?? undefined,
      };
    }

    return {
      ok: true,
      channel,
      status: send.dryRun ? "dry_run" : "queued",
      providerMessageId: send.sid,
      dryRun: send.dryRun,
      segmentEstimate: segments.segmentCount,
      costWarning: segments.costWarning ?? undefined,
    };
  }
}

/**
 * Preview fail-closed: sem credenciais, nunca envia; devolve blocked + estimativas.
 */
export function createFailClosedSmsPreviewProvider(
  env: NodeJS.ProcessEnv = process.env
): MessagingProvider {
  return new TwilioSmsMessagingProvider({ env });
}
