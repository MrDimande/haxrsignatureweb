/**
 * Interfaces fail-closed para queue/throttling/idempotency/retry/cancel/report/webhook.
 * NÃO activam provider automático nem inventam credenciais.
 */

import { gateAutomaticProvider } from "@/lib/campaigns/send-mode";
import type { HaxrWhatsappSendMode } from "@/lib/campaigns/types";

export type QueueJob = {
  campaignId: string;
  eventId: string;
  recipientId: string;
  idempotencyKey: string;
};

export type QueueEnqueueResult =
  | { enqueued: false; blocked: true; reason: string }
  | { enqueued: true; jobId: string };

export interface CampaignSendQueue {
  enqueue(job: QueueJob): Promise<QueueEnqueueResult>;
}

export interface CampaignThrottler {
  /** Retorna se o envio pode avançar neste instante. */
  allow(eventId: string, recipientId: string): Promise<boolean>;
}

export interface CampaignIdempotencyStore {
  /**
   * Reserva chave de idempotência. Se já existir, devolve o resultado anterior.
   */
  reserve(
    eventId: string,
    key: string
  ): Promise<{ reserved: boolean; existingRef?: string }>;
}

export interface CampaignRetryPolicy {
  shouldRetry(attempt: number, errorCode: string): boolean;
  nextDelayMs(attempt: number): number;
}

export interface CampaignCancelService {
  cancelCampaign(
    eventId: string,
    campaignId: string
  ): Promise<{ cancelled: boolean; reason?: string }>;
}

export interface CampaignDeliveryReport {
  summarize(
    eventId: string,
    campaignId: string
  ): Promise<{
    pending: number;
    markedSent: number;
    failed: number;
    blocked: number;
  }>;
}

export interface CampaignWebhookHandler {
  /**
   * Webhooks de provider — ignorados/bloqueados até integração real.
   */
  handle(
    payload: unknown
  ): Promise<{ accepted: false; reason: string }>;
}

export class FailClosedCampaignSendQueue implements CampaignSendQueue {
  constructor(
    private readonly mode: HaxrWhatsappSendMode,
    private readonly hasProviderCredentials = false,
    private readonly hasConfiguredProvider = false
  ) {}

  async enqueue(job: QueueJob): Promise<QueueEnqueueResult> {
    void job;
    const gate = gateAutomaticProvider({
      mode: this.mode,
      hasProviderCredentials: this.hasProviderCredentials,
      hasConfiguredProvider: this.hasConfiguredProvider,
    });
    return {
      enqueued: false,
      blocked: true,
      reason: gate.allowed
        ? "Queue indisponível neste MVP."
        : gate.reason,
    };
  }
}

export class FailClosedThrottler implements CampaignThrottler {
  async allow(): Promise<boolean> {
    return false;
  }
}

export class InMemoryIdempotencyStore implements CampaignIdempotencyStore {
  private readonly keys = new Map<string, string>();

  async reserve(
    eventId: string,
    key: string
  ): Promise<{ reserved: boolean; existingRef?: string }> {
    const composite = `${eventId}::${key}`;
    const existing = this.keys.get(composite);
    if (existing) {
      return { reserved: false, existingRef: existing };
    }
    const ref = `idem_${this.keys.size + 1}`;
    this.keys.set(composite, ref);
    return { reserved: true, existingRef: ref };
  }

  /** Utilitário de teste — marca chave como já usada com ref explícita. */
  seed(eventId: string, key: string, ref: string): void {
    this.keys.set(`${eventId}::${key}`, ref);
  }
}

export class FailClosedRetryPolicy implements CampaignRetryPolicy {
  shouldRetry(): boolean {
    return false;
  }

  nextDelayMs(): number {
    return Number.POSITIVE_INFINITY;
  }
}

export class FailClosedCancelService implements CampaignCancelService {
  async cancelCampaign(): Promise<{ cancelled: boolean; reason?: string }> {
    return {
      cancelled: false,
      reason: "Cancelamento de fila automática indisponível — provider fail-closed.",
    };
  }
}

export class FailClosedWebhookHandler implements CampaignWebhookHandler {
  async handle(): Promise<{ accepted: false; reason: string }> {
    return {
      accepted: false,
      reason: "Webhooks de provider ignorados — integração automática não activa.",
    };
  }
}

export function createFailClosedProviderStack(mode: HaxrWhatsappSendMode) {
  return {
    queue: new FailClosedCampaignSendQueue(mode),
    throttler: new FailClosedThrottler(),
    idempotency: new InMemoryIdempotencyStore(),
    retry: new FailClosedRetryPolicy(),
    cancel: new FailClosedCancelService(),
    webhook: new FailClosedWebhookHandler(),
  };
}
