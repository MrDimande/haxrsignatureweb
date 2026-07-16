import { createHash } from "node:crypto";

/**
 * Chaves de idempotência para SMS — nunca reenviar o mesmo job.
 */

export type SmsIdempotencyParts = {
  eventId: string;
  campaignId?: string;
  recipientId: string;
  channel: "sms_sandbox_or_test" | "sms_production";
  /** Versão do corpo / template para invalidar se o texto mudar. */
  bodyFingerprint?: string;
};

export function buildSmsIdempotencyKey(parts: SmsIdempotencyParts): string {
  const raw = [
    "sms",
    parts.eventId,
    parts.campaignId ?? "none",
    parts.recipientId,
    parts.channel,
    parts.bodyFingerprint ?? "v1",
  ].join(":");

  // Twilio I-Twilio-Idempotency-Token ≤ 64 chars
  if (raw.length <= 64) return raw;
  const digest = createHash("sha256").update(raw).digest("hex").slice(0, 40);
  return `sms_${digest}`;
}

export function fingerprintSmsBody(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex").slice(0, 16);
}
