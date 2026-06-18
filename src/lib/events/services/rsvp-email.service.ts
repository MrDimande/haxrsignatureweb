import { buildRsvpConfirmedEmail, buildRsvpDeclinedEmail } from "@/lib/email/templates/event";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import { formatEventDate } from "@/lib/events/export/report";
import { buildRsvpUrl } from "@/lib/events/tokens";
import type { CheckinLookup, RsvpSubmitInput } from "@/lib/events/types";

const BRAND = "HAXR Signature";

export type RsvpEmailResult = {
  sent: boolean;
  skipped?: string;
  error?: string;
};

/**
 * Envia confirmação transaccional ao convidado após RSVP bem-sucedido.
 * Não bloqueia o fluxo — falhas são apenas registadas em log.
 */
export async function sendRsvpGuestEmail(
  input: RsvpSubmitInput,
  result: CheckinLookup
): Promise<RsvpEmailResult> {
  if (!isResendConfigured()) {
    return { sent: false, skipped: "resend_not_configured" };
  }

  if (!result.ok || !result.guest || !result.event) {
    return { sent: false, skipped: "incomplete_result" };
  }

  if (result.alreadyConfirmed || result.alreadyDeclined || result.alreadyCheckedIn) {
    return { sent: false, skipped: "no_change" };
  }

  if (!result.confirmedRsvp && !result.declinedRsvp) {
    return { sent: false, skipped: "no_rsvp_action" };
  }

  const email = (input.email?.trim() || result.guest.email?.trim()) ?? "";
  if (!email) {
    return { sent: false, skipped: "no_email" };
  }

  const guestName = result.guest.name?.trim() || input.name.trim();
  const eventTitle = result.event.name;
  const ctx = {
    guestName,
    eventTitle,
    eventDate: formatEventDate(result.event.date),
    eventUrl: buildRsvpUrl(input.eventId, input.token),
  };

  const declined = Boolean(result.declinedRsvp);
  const html = declined ? buildRsvpDeclinedEmail(ctx) : buildRsvpConfirmedEmail(ctx);
  const subject = declined
    ? `${BRAND} · Resposta registada · ${eventTitle}`
    : `${BRAND} · Presença confirmada · ${eventTitle}`;

  const sendResult = await sendHaxrEmail({
    channel: "hello",
    to: email,
    subject,
    html,
  });

  if (!sendResult.ok) {
    console.warn("[rsvp/email] Falha ao enviar:", sendResult.error);
    return { sent: false, error: sendResult.error };
  }

  return { sent: true };
}
