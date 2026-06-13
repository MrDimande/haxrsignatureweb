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
    message: row.message,
    status: row.status,
    marketingOptIn: row.marketing_opt_in,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateInquiryInput {
  name: string;
  email: string;
  projectType: string;
  message: string;
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
      message: input.message,
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
