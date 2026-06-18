import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type { Tables } from "@/lib/supabase/database.types";
import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";

function mapInquiry(row: Tables<"contact_inquiries">): ContactInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    projectType: row.project_type,
    packageLabel: row.package_label,
    intent: row.intent ?? row.message,
    message: row.message,
    status: row.status,
    marketingOptIn: row.marketing_opt_in,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    brevoLeadWelcomeAt: row.brevo_lead_welcome_at,
    brevoPortfolioSentAt: row.brevo_portfolio_sent_at,
    brevoExperiencesSentAt: row.brevo_experiences_sent_at,
    brevoMeetingSentAt: row.brevo_meeting_sent_at,
    brevoLastCallSentAt: row.brevo_last_call_sent_at,
    brevoNewsletterWelcomeAt: row.brevo_newsletter_welcome_at,
  };
}

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

export async function createInquiry(
  input: CreateInquiryInput
): Promise<ContactInquiry> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .insert({
      name: input.name,
      email: input.email.toLowerCase(),
      project_type: input.projectType,
      package_label: input.packageLabel?.trim() || null,
      intent: input.intent.trim(),
      message: input.message?.trim() || "",
      marketing_opt_in: input.marketingOptIn ?? false,
      source: "website",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"contact_inquiries">(data);
  if (!row) throw new Error("Falha ao guardar pedido de contacto.");
  return mapInquiry(row);
}

export async function countRecentInquiriesByEmail(
  email: string,
  windowMs = 60 * 60 * 1000
): Promise<number> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from("contact_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("created_at", since);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listInquiries(): Promise<ContactInquiry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return asTableRows<"contact_inquiries">(data).map(mapInquiry);
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<ContactInquiry> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .update({ status } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"contact_inquiries">(data);
  if (!row) throw new Error("Pedido não encontrado.");
  return mapInquiry(row);
}

export async function countNewInquiries(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("contact_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markBrevoFunnelSent(
  id: string,
  field: BrevoFunnelTimestampField
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_inquiries")
    .update({ [field]: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export async function getInquiriesDueForPortfolio(
  afterDays: number
): Promise<ContactInquiry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .eq("status", "new")
    .not("brevo_lead_welcome_at", "is", null)
    .is("brevo_portfolio_sent_at", null)
    .lte("created_at", daysAgoIso(afterDays));

  if (error) throw new Error(error.message);
  return asTableRows<"contact_inquiries">(data).map(mapInquiry);
}

export async function getInquiriesDueForLastCall(
  afterDays: number
): Promise<ContactInquiry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .eq("status", "new")
    .not("brevo_lead_welcome_at", "is", null)
    .is("brevo_last_call_sent_at", null)
    .lte("created_at", daysAgoIso(afterDays));

  if (error) throw new Error(error.message);
  return asTableRows<"contact_inquiries">(data).map(mapInquiry);
}

export async function getInquiriesDueForExperiences(
  afterDays: number
): Promise<ContactInquiry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .eq("status", "new")
    .not("brevo_lead_welcome_at", "is", null)
    .is("brevo_experiences_sent_at", null)
    .lte("created_at", daysAgoIso(afterDays));

  if (error) throw new Error(error.message);
  return asTableRows<"contact_inquiries">(data).map(mapInquiry);
}

export async function getInquiriesDueForMeeting(
  afterDays: number
): Promise<ContactInquiry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .eq("status", "new")
    .not("brevo_lead_welcome_at", "is", null)
    .is("brevo_meeting_sent_at", null)
    .lte("created_at", daysAgoIso(afterDays));

  if (error) throw new Error(error.message);
  return asTableRows<"contact_inquiries">(data).map(mapInquiry);
}
