import { buildKulayaGuestRsvpEmail } from "@/lib/edition/email/templates/kulaya-guest-rsvp";
import { buildKulayaRsvpTeamEmail } from "@/lib/edition/email/templates/kulaya-rsvp";
import {
  buildFarewellGuestRsvpEmail,
  buildFarewellRsvpTeamEmail,
} from "@/lib/edition/email/templates/farewell-rsvp";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import type { EditionRsvpEmailConfig } from "@/lib/edition/rsvp/config";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

export type EditionRsvpEmailResult = {
  teamSent: boolean;
  guestSent: boolean;
  guestSkipped?: string;
};

export async function sendEditionRsvpNotificationEmail(
  submission: EditionRsvpSubmission,
  config: EditionRsvpEmailConfig
): Promise<EditionRsvpEmailResult> {
  const result: EditionRsvpEmailResult = {
    teamSent: false,
    guestSent: false,
  };

  if (!isResendConfigured()) {
    console.warn(
      "[edition/rsvp] RESEND_API_KEY não configurada — confirmação registada sem envio de email."
    );
    return result;
  }

  const slug = config.slug;
  const isFarewell = slug === "jessicachadelingerie";

  const { subject, html } = isFarewell
    ? buildFarewellRsvpTeamEmail(submission, config.eventName, slug)
    : buildKulayaRsvpTeamEmail(submission, config.eventName, slug);

  const teamResult = await sendHaxrEmail({
    channel: config.channel,
    to: config.notifyTo,
    cc: config.cc,
    replyTo: config.replyTo,
    subject,
    html,
  });

  if (!teamResult.ok) {
    throw new Error(teamResult.error ?? "Falha ao enviar email RSVP via Resend");
  }

  result.teamSent = true;

  const guestEmail = isFarewell
    ? buildFarewellGuestRsvpEmail(submission, config.eventName, slug)
    : buildKulayaGuestRsvpEmail(submission, config.eventName);

  if (!guestEmail) {
    result.guestSkipped = "no_email";
    return result;
  }

  const guestResult = await sendHaxrEmail({
    channel: "hello",
    to: submission.email!.trim(),
    subject: guestEmail.subject,
    html: guestEmail.html,
    replyTo: config.replyTo,
  });

  if (!guestResult.ok) {
    console.warn("[edition/rsvp] Guest confirmation email failed:", guestResult.error);
    return result;
  }

  result.guestSent = true;
  return result;
}
