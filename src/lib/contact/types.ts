export type InquiryStatus = "new" | "contacted" | "converted" | "archived";

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  packageLabel: string | null;
  intent: string;
  message: string;
  status: InquiryStatus;
  marketingOptIn: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
  brevoLeadWelcomeAt: string | null;
  brevoPortfolioSentAt: string | null;
  brevoExperiencesSentAt: string | null;
  brevoMeetingSentAt: string | null;
  brevoLastCallSentAt: string | null;
  brevoNewsletterWelcomeAt: string | null;
}

export interface ContactFormPayload {
  name: string;
  email: string;
  projectType: string;
  intent: string;
  message?: string;
  packageLabel?: string | null;
  marketingOptIn?: boolean;
  gotcha?: string;
}
