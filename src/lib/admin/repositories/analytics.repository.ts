import { createAdminClient } from "@/lib/supabase/server";
import type { DocumentAnalyticsRow } from "@/lib/supabase/database.types";
import type { BusinessId, DocumentStatus, DocumentType } from "@/lib/admin/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";

export type AnalyticsFilters = {
  businessId?: BusinessId;
  documentType?: DocumentType;
  status?: DocumentStatus;
  fiscalYear?: number;
  fiscalMonth?: number;
};

type NeonAnalyticsRow = {
  row: DocumentAnalyticsRow;
};

async function queryDocumentAnalyticsFromNeon(
  filters?: AnalyticsFilters,
): Promise<DocumentAnalyticsRow[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters?.businessId) {
    values.push(filters.businessId);
    conditions.push(`a.business_id = $${values.length}`);
  }
  if (filters?.documentType) {
    values.push(filters.documentType);
    conditions.push(`a.document_type = $${values.length}`);
  }
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`a.status = $${values.length}`);
  }
  if (filters?.fiscalYear) {
    values.push(filters.fiscalYear);
    conditions.push(`a.fiscal_year = $${values.length}`);
  }
  if (filters?.fiscalMonth) {
    values.push(filters.fiscalMonth);
    conditions.push(`a.fiscal_month = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // to_jsonb preserves the JSON/PostgREST contract expected by the existing
  // application (timestamps as strings and numeric values as JSON numbers).
  const result = await neonQuery<NeonAnalyticsRow>(
    `
      SELECT to_jsonb(a) AS row
      FROM public.document_analytics a
      ${whereClause}
      ORDER BY a.issue_date DESC
    `,
    values,
  );

  return result.rows.map(({ row }) => row);
}

async function queryDocumentAnalyticsFromSupabase(
  filters?: AnalyticsFilters,
): Promise<DocumentAnalyticsRow[]> {
  const supabase = createAdminClient();
  let query = supabase.from("document_analytics").select("*");

  if (filters?.businessId) {
    query = query.eq("business_id", filters.businessId);
  }
  if (filters?.documentType) {
    query = query.eq("document_type", filters.documentType);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.fiscalYear) {
    query = query.eq("fiscal_year", filters.fiscalYear);
  }
  if (filters?.fiscalMonth) {
    query = query.eq("fiscal_month", filters.fiscalMonth);
  }

  const { data, error } = await query.order("issue_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentAnalyticsRow[];
}

export async function queryDocumentAnalytics(
  filters?: AnalyticsFilters,
): Promise<DocumentAnalyticsRow[]> {
  if (shouldUseNeonServerDatabase()) {
    return queryDocumentAnalyticsFromNeon(filters);
  }

  return queryDocumentAnalyticsFromSupabase(filters);
}

export async function getRevenueByBusiness(
  fiscalYear?: number,
): Promise<{ businessId: string; businessName: string; total: number }[]> {
  const rows = await queryDocumentAnalytics({
    fiscalYear,
    status: "paid",
  });

  const map = new Map<string, { businessId: string; businessName: string; total: number }>();

  for (const row of rows) {
    const current = map.get(row.business_id) ?? {
      businessId: row.business_id,
      businessName: row.business_name,
      total: 0,
    };
    current.total += Number(row.grand_total);
    map.set(row.business_id, current);
  }

  return Array.from(map.values());
}

export async function getRevenueByMonth(
  fiscalYear: number,
  businessId?: BusinessId,
): Promise<{ month: number; total: number; count: number }[]> {
  const rows = await queryDocumentAnalytics({
    fiscalYear,
    businessId,
    status: "paid",
  });
  const map = new Map<number, { month: number; total: number; count: number }>();

  for (const row of rows) {
    const month = row.fiscal_month;
    const current = map.get(month) ?? { month, total: 0, count: 0 };
    current.total += Number(row.grand_total);
    current.count += 1;
    map.set(month, current);
  }

  return Array.from(map.values()).sort((a, b) => a.month - b.month);
}
