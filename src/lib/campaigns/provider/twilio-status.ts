import type { TwilioDeliveryStatus } from "@/lib/campaigns/types";

/**
 * Mapeia MessageStatus Twilio → estados canónicos HAXR.
 * @see https://www.twilio.com/docs/sms/api/message-resource#message-status-values
 */

const TWILIO_STATUS_MAP: Record<string, TwilioDeliveryStatus> = {
  queued: "queued",
  accepted: "queued",
  sending: "queued",
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
  undelivered: "failed",
  canceled: "failed",
  cancelled: "failed",
};

export function mapTwilioMessageStatus(
  raw: string | null | undefined
): TwilioDeliveryStatus | null {
  if (!raw?.trim()) return null;
  return TWILIO_STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

/** Ordem monotónica — nunca regredir (ex.: delivered → sent). */
const STATUS_RANK: Record<TwilioDeliveryStatus, number> = {
  queued: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
};

export function shouldApplyTwilioStatus(
  current: string,
  next: TwilioDeliveryStatus
): boolean {
  if (current === "failed" && next !== "failed") return false;
  if (!(current in STATUS_RANK)) return true;
  const currentRank = STATUS_RANK[current as TwilioDeliveryStatus];
  if (currentRank === undefined) return true;
  // failed pode sobrescrever estados intermédios
  if (next === "failed") return currentRank < STATUS_RANK.failed;
  return STATUS_RANK[next] >= currentRank;
}
