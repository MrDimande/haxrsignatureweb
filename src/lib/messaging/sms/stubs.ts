/**
 * Stubs de fila / throttling / retries / audit / opt-out para SMS.
 * Fail-closed por defeito — sem envio real.
 */

export type SmsQueueJob = {
  eventId: string;
  campaignId?: string;
  recipientId: string;
  idempotencyKey: string;
  phoneE164: string;
  body: string;
};

export type SmsQueueEnqueueResult =
  | { enqueued: false; blocked: true; reason: string }
  | { enqueued: true; jobId: string };

export interface SmsSendQueue {
  enqueue(job: SmsQueueJob): Promise<SmsQueueEnqueueResult>;
}

export interface SmsThrottler {
  allow(eventId: string, recipientId: string): Promise<boolean>;
}

export interface SmsIdempotencyStore {
  reserve(
    eventId: string,
    key: string
  ): Promise<{ reserved: boolean; existingRef?: string }>;
}

export interface SmsRetryPolicy {
  shouldRetry(attempt: number, errorCode: string): boolean;
  nextDelayMs(attempt: number): number;
}

export type SmsAuditEvent = {
  at: string;
  action: string;
  eventId?: string;
  recipientId?: string;
  channel?: string;
  detail?: string;
  /** Nunca incluir secrets. */
  metadata?: Record<string, string>;
};

export interface SmsAuditTrail {
  record(event: SmsAuditEvent): Promise<void>;
  list(): Promise<SmsAuditEvent[]>;
}

export interface SmsOptOutStore {
  isOptedOut(phoneE164: string): Promise<boolean>;
  recordOptOut(phoneE164: string, reason?: string): Promise<void>;
}

export class FailClosedSmsSendQueue implements SmsSendQueue {
  async enqueue(job: SmsQueueJob): Promise<SmsQueueEnqueueResult> {
    void job;
    return {
      enqueued: false,
      blocked: true,
      reason: "Fila SMS indisponível — provider fail-closed / stub.",
    };
  }
}

export class FailClosedSmsThrottler implements SmsThrottler {
  async allow(): Promise<boolean> {
    return false;
  }
}

export class AllowAllSmsThrottler implements SmsThrottler {
  async allow(): Promise<boolean> {
    return true;
  }
}

export class InMemorySmsIdempotencyStore implements SmsIdempotencyStore {
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
    const ref = `sms_idem_${this.keys.size + 1}`;
    this.keys.set(composite, ref);
    return { reserved: true, existingRef: ref };
  }

  seed(eventId: string, key: string, ref: string): void {
    this.keys.set(`${eventId}::${key}`, ref);
  }
}

export class FailClosedSmsRetryPolicy implements SmsRetryPolicy {
  shouldRetry(): boolean {
    return false;
  }

  nextDelayMs(): number {
    return Number.POSITIVE_INFINITY;
  }
}

export class ExponentialSmsRetryPolicy implements SmsRetryPolicy {
  shouldRetry(attempt: number, errorCode: string): boolean {
    if (attempt >= 3) return false;
    if (
      errorCode === "21211" ||
      errorCode === "21614" ||
      errorCode === "opt_out" ||
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

export class InMemorySmsAuditTrail implements SmsAuditTrail {
  private readonly events: SmsAuditEvent[] = [];

  async record(event: SmsAuditEvent): Promise<void> {
    this.events.push(event);
  }

  async list(): Promise<SmsAuditEvent[]> {
    return [...this.events];
  }
}

export class InMemorySmsOptOutStore implements SmsOptOutStore {
  private readonly opted = new Set<string>();

  async isOptedOut(phoneE164: string): Promise<boolean> {
    return this.opted.has(phoneE164.replace(/\D/g, ""));
  }

  async recordOptOut(phoneE164: string): Promise<void> {
    this.opted.add(phoneE164.replace(/\D/g, ""));
  }
}

export function createSmsStubStack() {
  return {
    queue: new FailClosedSmsSendQueue(),
    throttler: new FailClosedSmsThrottler(),
    idempotency: new InMemorySmsIdempotencyStore(),
    retry: new FailClosedSmsRetryPolicy(),
    audit: new InMemorySmsAuditTrail(),
    optOut: new InMemorySmsOptOutStore(),
  };
}
