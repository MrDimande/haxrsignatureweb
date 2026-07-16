import type { MessagingChannel } from "@/lib/messaging/types";

export function isSmsChannel(channel: MessagingChannel): boolean {
  return channel === "sms_sandbox_or_test" || channel === "sms_production";
}

export function isWhatsappChannel(channel: MessagingChannel): boolean {
  return (
    channel === "manual_whatsapp" ||
    channel === "whatsapp_sandbox" ||
    channel === "whatsapp_production"
  );
}

export function isProductionChannel(channel: MessagingChannel): boolean {
  return channel === "sms_production" || channel === "whatsapp_production";
}
