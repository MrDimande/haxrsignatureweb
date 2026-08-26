import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
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
import {
  countNewInquiries as countNewInquiriesSupabase,
  countRecentInquiriesByEmail as countRecentInquiriesByEmailSupabase,
  createInquiry as createInquirySupabase,
  getInquiriesDueForExperiences as getInquiriesDueForExperiencesSupabase,
  getInquiriesDueForLastCall as getInquiriesDueForLastCallSupabase,
  getInquiriesDueForMeeting as getInquiriesDueForMeetingSupabase,
  getInquiriesDueForPortfolio as getInquiriesDueForPortfolioSupabase,
  getInquiryById as getInquiryByIdSupabase,
  listInquiries as listInquiriesSupabase,
  markBrevoFunnelSent as markBrevoFunnelSentSupabase,
  updateInquiryStatus as updateInquiryStatusSupabase,
} from "@/lib/contact/inquiries.supabase.repository";
import type {
  BrevoFunnelTimestampField,
  CreateInquiryInput,
} from "@/lib/contact/inquiries.supabase.repository";

export type {
  BrevoFunnelTimestampField,
  CreateInquiryInput,
} from "@/lib/contact/inquiries.supabase.repository";

export function createInquiry(input: CreateInquiryInput): Promise<ContactInquiry> {
  return shouldUseNeonServerDatabase()
    ? createInquiryNeon(input)
    : createInquirySupabase(input);
}

export function countRecentInquiriesByEmail(
  email: string,
  windowMs = 60 * 60 * 1000,
): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? countRecentInquiriesByEmailNeon(email, windowMs)
    : countRecentInquiriesByEmailSupabase(email, windowMs);
}

export function getInquiryById(id: string): Promise<ContactInquiry | null> {
  return shouldUseNeonServerDatabase()
    ? getInquiryByIdNeon(id)
    : getInquiryByIdSupabase(id);
}

export function listInquiries(): Promise<ContactInquiry[]> {
  return shouldUseNeonServerDatabase()
    ? listInquiriesNeon()
    : listInquiriesSupabase();
}

export function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<ContactInquiry> {
  return shouldUseNeonServerDatabase()
    ? updateInquiryStatusNeon(id, status)
    : updateInquiryStatusSupabase(id, status);
}

export function countNewInquiries(): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? countNewInquiriesNeon()
    : countNewInquiriesSupabase();
}

export function markBrevoFunnelSent(
  id: string,
  field: BrevoFunnelTimestampField,
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? markBrevoFunnelSentNeon(id, field)
    : markBrevoFunnelSentSupabase(id, field);
}

export function getInquiriesDueForPortfolio(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return shouldUseNeonServerDatabase()
    ? getInquiriesDueForPortfolioNeon(afterDays)
    : getInquiriesDueForPortfolioSupabase(afterDays);
}

export function getInquiriesDueForLastCall(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return shouldUseNeonServerDatabase()
    ? getInquiriesDueForLastCallNeon(afterDays)
    : getInquiriesDueForLastCallSupabase(afterDays);
}

export function getInquiriesDueForExperiences(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return shouldUseNeonServerDatabase()
    ? getInquiriesDueForExperiencesNeon(afterDays)
    : getInquiriesDueForExperiencesSupabase(afterDays);
}

export function getInquiriesDueForMeeting(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return shouldUseNeonServerDatabase()
    ? getInquiriesDueForMeetingNeon(afterDays)
    : getInquiriesDueForMeetingSupabase(afterDays);
}
