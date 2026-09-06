import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  BrevoFunnelTimestampField,
  CreateInquiryInput,
} from "@/lib/contact/inquiries.supabase.repository";

type InquiryRow = Tables<"contact_inquiries">;
type NeonInquiryRow = { row: InquiryRow };
type CountRow = { count: number | string };

function mapInquiry(row: InquiryRow): ContactInquiry {
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

function readCount(row: CountRow | undefined): number {
  if (!row) return 0;
  const value = Number(row.count);
  return Number.isFinite(value) ? value : 0;
}

export async function createInquiry(
  input: CreateInquiryInput,
): Promise<ContactInquiry> {
  const result = await neonQuery<NeonInquiryRow>(
    `
      WITH saved AS (
        INSERT INTO public.contact_inquiries (
          name,
          email,
          project_type,
          package_label,
          intent,
          message,
          marketing_opt_in,
          source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'website')
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
    [
      input.name,
      input.email.toLowerCase(),
      input.projectType,
      input.packageLabel?.trim() || null,
      input.intent.trim(),
      input.message?.trim() || "",
      input.marketingOptIn ?? false,
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar pedido de contacto.");
  return mapInquiry(row);
}

export async function countRecentInquiriesByEmail(
  email: string,
  windowMs = 60 * 60 * 1000,
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const result = await neonQuery<CountRow>(
    `
      SELECT count(*)::int AS count
      FROM public.contact_inquiries
      WHERE email = $1
        AND created_at >= $2::timestamptz
    `,
    [email.toLowerCase(), since],
  );
  return readCount(result.rows[0]);
}

export async function getInquiryById(
  id: string,
): Promise<ContactInquiry | null> {
  const result = await neonQuery<NeonInquiryRow>(
    `
      SELECT to_jsonb(i) AS row
      FROM public.contact_inquiries i
      WHERE i.id = $1::uuid
      LIMIT 1
    `,
    [id],
  );
  const row = result.rows[0]?.row;
  return row ? mapInquiry(row) : null;
}

export async function listInquiries(): Promise<ContactInquiry[]> {
  const result = await neonQuery<NeonInquiryRow>(
    `
      SELECT to_jsonb(i) AS row
      FROM public.contact_inquiries i
      ORDER BY i.created_at DESC
    `,
  );
  return result.rows.map(({ row }) => mapInquiry(row));
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<ContactInquiry> {
  const result = await neonQuery<NeonInquiryRow>(
    `
      WITH saved AS (
        UPDATE public.contact_inquiries
        SET status = $2::public.inquiry_status
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
    [id, status],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Pedido não encontrado.");
  return mapInquiry(row);
}

export async function countNewInquiries(): Promise<number> {
  const result = await neonQuery<CountRow>(
    `
      SELECT count(*)::int AS count
      FROM public.contact_inquiries
      WHERE status = 'new'::public.inquiry_status
    `,
  );
  return readCount(result.rows[0]);
}

const BREVO_FIELD_SQL: Record<BrevoFunnelTimestampField, string> = {
  brevo_lead_welcome_at: "brevo_lead_welcome_at",
  brevo_portfolio_sent_at: "brevo_portfolio_sent_at",
  brevo_experiences_sent_at: "brevo_experiences_sent_at",
  brevo_meeting_sent_at: "brevo_meeting_sent_at",
  brevo_last_call_sent_at: "brevo_last_call_sent_at",
  brevo_newsletter_welcome_at: "brevo_newsletter_welcome_at",
};

export async function markBrevoFunnelSent(
  id: string,
  field: BrevoFunnelTimestampField,
): Promise<void> {
  const column = BREVO_FIELD_SQL[field];
  await neonQuery(
    `UPDATE public.contact_inquiries SET ${column} = now() WHERE id = $1::uuid`,
    [id],
  );
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function getInquiriesDueFor(
  field: Exclude<
    BrevoFunnelTimestampField,
    "brevo_lead_welcome_at" | "brevo_newsletter_welcome_at"
  >,
  afterDays: number,
): Promise<ContactInquiry[]> {
  const column = BREVO_FIELD_SQL[field];
  const result = await neonQuery<NeonInquiryRow>(
    `
      SELECT to_jsonb(i) AS row
      FROM public.contact_inquiries i
      WHERE i.status = 'new'::public.inquiry_status
        AND i.brevo_lead_welcome_at IS NOT NULL
        AND i.${column} IS NULL
        AND i.created_at <= $1::timestamptz
    `,
    [daysAgoIso(afterDays)],
  );
  return result.rows.map(({ row }) => mapInquiry(row));
}

export function getInquiriesDueForPortfolio(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueFor("brevo_portfolio_sent_at", afterDays);
}

export function getInquiriesDueForLastCall(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueFor("brevo_last_call_sent_at", afterDays);
}

export function getInquiriesDueForExperiences(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueFor("brevo_experiences_sent_at", afterDays);
}

export function getInquiriesDueForMeeting(
  afterDays: number,
): Promise<ContactInquiry[]> {
  return getInquiriesDueFor("brevo_meeting_sent_at", afterDays);
}
