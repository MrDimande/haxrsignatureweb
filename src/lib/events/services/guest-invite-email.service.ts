import { buildEventInviteEmail } from "@/lib/email/templates/event";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import { formatEventDate } from "@/lib/events/export/report";
import { buildRsvpUrl } from "@/lib/events/tokens";
import type { EventGuest, ManagedEvent } from "@/lib/events/types";

const BRAND = "HAXR Signature";

export type SendGuestInviteResult = {
  sent: boolean;
  skipped?: string;
  error?: string;
};

export async function sendGuestInviteEmail(
  event: ManagedEvent,
  guest: EventGuest
): Promise<SendGuestInviteResult> {
  if (!isResendConfigured()) {
    return { sent: false, skipped: "resend_not_configured" };
  }

  const email = guest.email?.trim().toLowerCase();
  if (!email) {
    return { sent: false, skipped: "no_email" };
  }

  const html = buildEventInviteEmail({
    guestName: guest.name,
    eventTitle: event.name,
    eventDate: formatEventDate(event.date),
    eventUrl: buildRsvpUrl(event.id, guest.qrToken),
  });

  const result = await sendHaxrEmail({
    channel: "hello",
    to: email,
    subject: `${BRAND} · Convite · ${event.name}`,
    html,
  });

  if (!result.ok) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

export type BulkSendGuestInviteResult = {
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export async function bulkSendGuestInviteEmails(
  event: ManagedEvent,
  guests: EventGuest[]
): Promise<BulkSendGuestInviteResult> {
  const output: BulkSendGuestInviteResult = {
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const guest of guests) {
    const result = await sendGuestInviteEmail(event, guest);
    if (result.sent) {
      output.sent++;
    } else if (result.skipped) {
      output.skipped++;
    } else {
      output.failed++;
      if (result.error && output.errors.length < 8) {
        output.errors.push(`${guest.name}: ${result.error}`);
      }
    }
  }

  return output;
}
