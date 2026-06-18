import type { ContactInquiry } from "@/lib/contact/types";
import {
  getBrevoFunnelDelays,
  isBrevoFunnelEnabled,
} from "@/lib/brevo/config";
import { brevoFetch, brevoReady } from "@/lib/brevo/client";
import { splitName } from "@/lib/brevo/names";
import { sendFunnelEmail } from "@/lib/brevo/transactional";
import {
  getInquiriesDueForExperiences,
  getInquiriesDueForLastCall,
  getInquiriesDueForMeeting,
  getInquiriesDueForPortfolio,
  markBrevoFunnelSent,
} from "@/lib/contact/inquiries.repository";

export type FunnelEmailResult = {
  sent: boolean;
  skipped?: string;
  error?: string;
};

export type FunnelOnSyncResult = {
  leadWelcome?: FunnelEmailResult;
  newsletterWelcome?: FunnelEmailResult;
};

export type FunnelBatchResult = {
  portfolio: { sent: number; failed: number };
  experiences: { sent: number; failed: number };
  meeting: { sent: number; failed: number };
  lastCall: { sent: number; failed: number };
};

async function sendToInquiry(
  inquiry: ContactInquiry,
  kind:
    | "lead_welcome"
    | "lead_portfolio"
    | "lead_experiences"
    | "lead_meeting"
    | "lead_last_call"
    | "newsletter_welcome"
): Promise<FunnelEmailResult> {
  const { firstName } = splitName(inquiry.name);
  const result = await sendFunnelEmail({
    email: inquiry.email,
    name: inquiry.name,
    kind,
    params: { firstName },
  });

  if (!result.ok) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/**
 * Dispara emails imediatos após sync Brevo (boas-vindas lead + newsletter).
 */
export async function triggerLeadFunnelOnSync(
  inquiry: ContactInquiry
): Promise<FunnelOnSyncResult> {
  if (!isBrevoFunnelEnabled()) {
    return {
      leadWelcome: { sent: false, skipped: "Funil Brevo desactivado" },
    };
  }

  const output: FunnelOnSyncResult = {};
  const { firstName } = splitName(inquiry.name);

  const welcome = await sendFunnelEmail({
    email: inquiry.email,
    name: inquiry.name,
    kind: "lead_welcome",
    params: { firstName },
  });

  if (welcome.ok) {
    await markBrevoFunnelSent(inquiry.id, "brevo_lead_welcome_at");
    output.leadWelcome = { sent: true };
    await trackBrevoLeadEvent(inquiry);
  } else {
    output.leadWelcome = { sent: false, error: welcome.error };
  }

  if (inquiry.marketingOptIn) {
    const newsletter = await sendFunnelEmail({
      email: inquiry.email,
      name: inquiry.name,
      kind: "newsletter_welcome",
      params: { firstName },
    });

    if (newsletter.ok) {
      await markBrevoFunnelSent(inquiry.id, "brevo_newsletter_welcome_at");
      output.newsletterWelcome = { sent: true };
    } else {
      output.newsletterWelcome = { sent: false, error: newsletter.error };
    }
  }

  return output;
}

async function trackBrevoLeadEvent(inquiry: ContactInquiry): Promise<void> {
  if (!brevoReady()) return;

  await brevoFetch("/events", {
    method: "POST",
    body: JSON.stringify({
      event_name: "haxr_lead_created",
      event_date: new Date().toISOString(),
      identifiers: { email_id: inquiry.email.toLowerCase() },
      event_properties: {
        inquiry_id: inquiry.id,
        project_type: inquiry.projectType,
        package: inquiry.packageLabel ?? "",
        source: inquiry.source,
      },
    }),
  });
}

/**
 * Follow-ups agendados (cron diário): portfólio (+3), experiências (+7), reunião (+14), última chamada (+21).
 */
export async function processScheduledFunnelEmails(): Promise<FunnelBatchResult> {
  const result: FunnelBatchResult = {
    portfolio: { sent: 0, failed: 0 },
    experiences: { sent: 0, failed: 0 },
    meeting: { sent: 0, failed: 0 },
    lastCall: { sent: 0, failed: 0 },
  };

  if (!isBrevoFunnelEnabled()) {
    return result;
  }

  const { portfolioDays, experiencesDays, meetingDays, lastCallDays } =
    getBrevoFunnelDelays();
  const portfolioDue = await getInquiriesDueForPortfolio(portfolioDays);
  const experiencesDue = await getInquiriesDueForExperiences(experiencesDays);
  const meetingDue = await getInquiriesDueForMeeting(meetingDays);
  const lastCallDue = await getInquiriesDueForLastCall(lastCallDays);

  for (const inquiry of portfolioDue) {
    const sent = await sendToInquiry(inquiry, "lead_portfolio");
    if (sent.sent) {
      await markBrevoFunnelSent(inquiry.id, "brevo_portfolio_sent_at");
      result.portfolio.sent++;
    } else {
      result.portfolio.failed++;
      console.warn(
        `[brevo/funnel] portfolio ${inquiry.email}:`,
        sent.error ?? "erro"
      );
    }
  }

  for (const inquiry of experiencesDue) {
    const sent = await sendToInquiry(inquiry, "lead_experiences");
    if (sent.sent) {
      await markBrevoFunnelSent(inquiry.id, "brevo_experiences_sent_at");
      result.experiences.sent++;
    } else {
      result.experiences.failed++;
      console.warn(
        `[brevo/funnel] experiences ${inquiry.email}:`,
        sent.error ?? "erro"
      );
    }
  }

  for (const inquiry of meetingDue) {
    const sent = await sendToInquiry(inquiry, "lead_meeting");
    if (sent.sent) {
      await markBrevoFunnelSent(inquiry.id, "brevo_meeting_sent_at");
      result.meeting.sent++;
    } else {
      result.meeting.failed++;
      console.warn(
        `[brevo/funnel] meeting ${inquiry.email}:`,
        sent.error ?? "erro"
      );
    }
  }

  for (const inquiry of lastCallDue) {
    const sent = await sendToInquiry(inquiry, "lead_last_call");
    if (sent.sent) {
      await markBrevoFunnelSent(inquiry.id, "brevo_last_call_sent_at");
      result.lastCall.sent++;
    } else {
      result.lastCall.failed++;
      console.warn(
        `[brevo/funnel] last_call ${inquiry.email}:`,
        sent.error ?? "erro"
      );
    }
  }

  return result;
}
