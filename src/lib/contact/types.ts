export type InquiryStatus = "new" | "contacted" | "converted" | "archived";

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  packageLabel: string | null;
  message: string;
  status: InquiryStatus;
  marketingOptIn: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormPayload {
  name: string;
  email: string;
  projectType: string;
  message: string;
  packageLabel?: string | null;
  marketingOptIn?: boolean;
  gotcha?: string;
}
