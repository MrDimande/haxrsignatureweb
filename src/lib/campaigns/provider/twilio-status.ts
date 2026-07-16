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
  undelivered: "undelivered",
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
  undelivered: 5,
  failed: 5,
};

export function shouldApplyTwilioStatus(
  current: string,
  next: TwilioDeliveryStatus
): boolean {
  // Estados manuais / inválidos não devem ser sobrescritos por Twilio
  // excepto se ainda estiverem em fila Twilio.
  const manualLocked = new Set([
    "marked_sent",
    "rsvp_received",
    "invalid_phone",
    "skipped",
    "opened_whatsapp",
    "opened",
    "copied",
    "previewed",
    "pending",
  ]);
  if (manualLocked.has(current) && !(current in STATUS_RANK)) {
    // pending/previewed podem receber queued se enfileirados
    if (
      (current === "pending" ||
        current === "previewed" ||
        current === "copied") &&
      next === "queued"
    ) {
      return true;
    }
    if (current === "pending" || current === "previewed" || current === "copied") {
      return STATUS_RANK[next] >= STATUS_RANK.queued;
    }
    return false;
  }

  if ((current === "failed" || current === "undelivered") && next !== "failed" && next !== "undelivered") {
    return false;
  }
  if (!(current in STATUS_RANK)) return true;
  const currentRank = STATUS_RANK[current as TwilioDeliveryStatus];
  if (currentRank === undefined) return true;
  if (next === "failed" || next === "undelivered") {
    return currentRank < STATUS_RANK.failed;
  }
  return STATUS_RANK[next] >= currentRank;
}

export function isValidTwilioStatusTransition(
  current: string,
  next: TwilioDeliveryStatus
): boolean {
  return shouldApplyTwilioStatus(current, next);
}
