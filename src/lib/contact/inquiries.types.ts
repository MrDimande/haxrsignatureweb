export type BrevoFunnelTimestampField =
  | "brevo_lead_welcome_at"
  | "brevo_portfolio_sent_at"
  | "brevo_experiences_sent_at"
  | "brevo_meeting_sent_at"
  | "brevo_last_call_sent_at"
  | "brevo_newsletter_welcome_at";

export interface CreateInquiryInput {
  name: string;
  email: string;
  projectType: string;
  intent: string;
  message?: string;
  packageLabel?: string | null;
  marketingOptIn?: boolean;
}
