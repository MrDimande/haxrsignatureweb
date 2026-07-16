import type {
  CampaignIdempotencyStore,
  CampaignRetryPolicy,
  CampaignSendQueue,
  CampaignThrottler,
  QueueEnqueueResult,
  QueueJob,
} from "@/lib/campaigns/provider/fail-closed";
import {
  FailClosedThrottler,
  InMemoryIdempotencyStore,
} from "@/lib/campaigns/provider/fail-closed";
import type { TwilioMessagesClient } from "@/lib/campaigns/provider/twilio-client";
import {
  isSandboxRecipientAllowed,
  type TwilioWhatsappConfig,
} from "@/lib/campaigns/provider/twilio-config";
import { gateAutomaticProvider } from "@/lib/campaigns/send-mode";
import type { HaxrWhatsappSendMode } from "@/lib/campaigns/types";

export type TwilioQueueRecipientLookup = (
  job: QueueJob
) => Promise<{
  phoneE164: string | null;
  body: string;
} | null>;

export type TwilioQueueSendResult = {
  jobId: string;
  recipientId: string;
  sid: string;
  status: string;
  dryRun: boolean;
};

/**
 * Fila Twilio com throttling, idempotência e retries.
 * Só opera em twilio_sandbox (twilio_production permanece fail-closed).
 */
export class TwilioSandboxSendQueue implements CampaignSendQueue {
  private readonly results = new Map<string, TwilioQueueSendResult>();

  constructor(
    private readonly mode: HaxrWhatsappSendMode,
    private readonly config: TwilioWhatsappConfig,
    private readonly client: TwilioMessagesClient,
    private readonly lookupRecipient: TwilioQueueRecipientLookup,
    private readonly idempotency: CampaignIdempotencyStore = new InMemoryIdempotencyStore(),
    private readonly throttler: CampaignThrottler = new FailClosedThrottler(),
    private readonly retry: CampaignRetryPolicy = new ExponentialTwilioRetryPolicy()
  ) {}

  getResult(idempotencyKey: string): TwilioQueueSendResult | undefined {
    return this.results.get(idempotencyKey);
  }

  async enqueue(job: QueueJob): Promise<QueueEnqueueResult> {
    const gate = gateAutomaticProvider({
      mode: this.mode,
      hasConfiguredProvider: true,
      hasProviderCredentials: true,
    });
    if (!gate.allowed) {
      return { enqueued: false, blocked: true, reason: gate.reason };
    }

    if (this.mode !== "twilio_sandbox") {
      return {
        enqueued: false,
        blocked: true,
        reason:
          "Apenas HAXR_WHATSAPP_SEND_MODE=twilio_sandbox está autorizado neste PR.",
      };
    }

    const reserved = await this.idempotency.reserve(
      job.eventId,
      job.idempotencyKey
    );
    if (!reserved.reserved) {
      const existing = this.results.get(job.idempotencyKey);
      return {
        enqueued: true,
        jobId: existing?.jobId ?? reserved.existingRef ?? job.idempotencyKey,
      };
    }

    const recipient = await this.lookupRecipient(job);
    if (!recipient?.phoneE164) {
      return {
        enqueued: false,
        blocked: true,
        reason: "Destinatário sem telefone E.164.",
      };
    }

    if (
      !isSandboxRecipientAllowed(
        recipient.phoneE164,
        this.config.sandboxAllowlist
      )
    ) {
      return {
        enqueued: false,
        blocked: true,
        reason:
          "Destinatário fora da TWILIO_SANDBOX_ALLOWLIST — nenhum convidado real permitido.",
      };
    }

    const allowed = await this.throttler.allow(job.eventId, job.recipientId);
    if (!allowed) {
      // Throttler fail-closed por defeito — usar AllowAllThrottler em sandbox.
      return {
        enqueued: false,
        blocked: true,
        reason: "Throttling bloqueou o envio.",
      };
    }

    let attempt = 0;
    let lastError = "unknown";
    while (attempt < 3) {
      attempt += 1;
      const send = await this.client.sendWhatsappMessage({
        toPhone: recipient.phoneE164,
        body: recipient.body,
        statusCallbackUrl: this.config.statusCallbackUrl,
        idempotencyKey: job.idempotencyKey,
      });

      if (send.ok) {
        const jobId = `twilio_${send.sid}`;
        this.results.set(job.idempotencyKey, {
          jobId,
          recipientId: job.recipientId,
          sid: send.sid,
          status: send.status,
          dryRun: send.dryRun,
        });
        return { enqueued: true, jobId };
      }

      lastError = send.error;
      if (!this.retry.shouldRetry(attempt, send.code ?? "send_failed")) {
        break;
      }
      const delay = this.retry.nextDelayMs(attempt);
      if (Number.isFinite(delay) && delay > 0 && delay < 5_000) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      enqueued: false,
      blocked: true,
      reason: `Twilio send falhou após retries: ${lastError}`,
    };
  }
}

export class AllowAllThrottler implements CampaignThrottler {
  async allow(): Promise<boolean> {
    return true;
  }
}

export class ExponentialTwilioRetryPolicy implements CampaignRetryPolicy {
  shouldRetry(attempt: number, errorCode: string): boolean {
    if (attempt >= 3) return false;
    // Não retry em erros de validação / allowlist
    if (
      errorCode === "21211" ||
      errorCode === "21608" ||
      errorCode === "allowlist"
    ) {
      return false;
    }
    return true;
  }

  nextDelayMs(attempt: number): number {
    return Math.min(1000 * 2 ** (attempt - 1), 4000);
  }
}
