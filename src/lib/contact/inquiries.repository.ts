import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";
import {
  countNewInquiries as countNewInquiriesNeon,
  countRecentInquiriesByEmail as countRecentInquiriesByEmailNeon,
  createInquiry as createInquiryNeon,
  getInquiriesDueForExperiences as getInquiriesDueForExperiencesNeon,
  getInquiriesDueForLastCall as getInquiriesDueForLastCallNeon,
  getInquiriesDueForMeeting as getInquiriesDueForMeetingNeon,
  getInquiriesDueForPortfolio as getInquiriesDueForPortfolioNeon,
  getInquiryById as getInquiryByIdNeon,
  listInquiries as listInquiriesNeon,
  markBrevoFunnelSent as markBrevoFunnelSentNeon,
  updateInquiryStatus as updateInquiryStatusNeon,
} from "@/lib/contact/inquiries.neon.repository";
import type {
  BrevoFunnelTimestampField,
  CreateInquiryInput,
} from "@/lib/contact/inquiries.types";

export type {
  BrevoFunnelTimestampField,
  CreateInquiryInput,
} from "@/lib/contact/inquiries.types";

export function createInquiry(input: CreateInquiryInput): Promise<ContactInquiry> {
  return createInquiryNeon(input);
}

export function countRecentInquiriesByEmail(
  email: string,
  windowMs = 60 * 60 * 1000,
): Promise<number> {
  return countRecentInquiriesByEmailNeon(email, windowMs);
}

export function getInquiryById(id: string): Promise<ContactInquiry | null> {
  return getInquiryByIdNeon(id);
}

export function listInquiries(): Promise<ContactInquiry[]> {
  return listInquiriesNeon();
}

export function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<ContactInquiry> {
  return updateInquiryStatusNeon(id, status);
}

export function countNewInquiries(): Promise<number> {
  return countNewInquiriesNeon();
}

export function markBrevoFunnelSent(
  id: string,
  field: BrevoFunnelTimestampField,
): Promise<void> {
  return markBrevoFunnelSentNeon(id, field);
}

export function getInquiriesDueForPortfolio(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueForPortfolioNeon(afterDays);
}

export function getInquiriesDueForLastCall(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueForLastCallNeon(afterDays);
}

export function getInquiriesDueForExperiences(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueForExperiencesNeon(afterDays);
}

export function getInquiriesDueForMeeting(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueForMeetingNeon(afterDays);
}
