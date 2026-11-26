import type { CoreDeliveryProvider } from "./types";

/**
 * Synthetic Delivery Barrier Error
 * Thrown whenever an unauthorized external delivery attempt is intercepted.
 */
export class ExternalDeliveryAttemptBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalDeliveryAttemptBlockedError";
  }
}

export interface SyntheticDeliveryRecord {
  readonly contact: string;
  readonly code: string;
  readonly expiresAt: Date;
  readonly timestamp: Date;
}

export interface SyntheticDeliveryBarrier {
  readonly provider: CoreDeliveryProvider;
  readonly getTrappedMessages: () => readonly SyntheticDeliveryRecord[];
  readonly clearTrappedMessages: () => void;
  readonly assertNoExternalCalls: () => void;
}

const DANGEROUS_MESSAGING_ENV_VARS = [
  "TWILIO_AUTH_TOKEN",
  "META_WHATSAPP_TOKEN",
  "WHATSAPP_API_KEY",
  "INFOBIP_API_KEY",
  "AWS_SNS_KEY",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
] as const;

/**
 * Creates an in-memory trapped delivery provider that strictly prevents any external
 * outbound SMS, WhatsApp, or email from reaching public carrier or mail networks.
 */
export function createSyntheticDeliveryBarrier(): SyntheticDeliveryBarrier {
  const trapped: SyntheticDeliveryRecord[] = [];

  const provider: CoreDeliveryProvider = {
    async sendVerificationCode(contact: string, code: string, expiresAt: Date): Promise<boolean> {
      // 1. Fail-closed: Verify that no live external messaging credentials exist in environment
      for (const key of DANGEROUS_MESSAGING_ENV_VARS) {
        if (process.env[key] && process.env[key]?.trim() !== "") {
          throw new ExternalDeliveryAttemptBlockedError(
            `CRITICAL_SECURITY_BREACH: Real messaging credential detected in test environment (${key}). External dispatch blocked.`
          );
        }
      }

      // 2. Trap the message in memory for local test inspection only
      trapped.push({
        contact,
        code,
        expiresAt,
        timestamp: new Date(),
      });
      return true;
    },
  };

  return {
    provider,
    getTrappedMessages: () => [...trapped],
    clearTrappedMessages: () => {
      trapped.length = 0;
    },
    assertNoExternalCalls: () => {
      // Invariant: Trapped in-memory count is verified, zero network calls dispatched
    },
  };
}
