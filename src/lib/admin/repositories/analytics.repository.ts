import type { DocumentAnalyticsRow } from "@/lib/supabase/database.types";
import type { BusinessId, DocumentStatus, DocumentType } from "@/lib/admin/types";
import { neonQuery } from "@/lib/neon/server-db";

export type AnalyticsFilters = {
  businessId?: BusinessId;
  documentType?: DocumentType;
  status?: DocumentStatus;
  fiscalYear?: number;
  fiscalMonth?: number;
};

type NeonAnalyticsRow = { row: DocumentAnalyticsRow };

export async function queryDocumentAnalytics(
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

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await neonQuery<NeonAnalyticsRow>(
    `SELECT to_jsonb(a) AS row
     FROM public.document_analytics a
     ${whereClause}
     ORDER BY a.issue_date DESC`,
    values,
  );
  return result.rows.map(({ row }) => row);
}

export async function getRevenueByBusiness(
  fiscalYear?: number,
): Promise<{ businessId: string; businessName: string; total: number }[]> {
  const rows = await queryDocumentAnalytics({ fiscalYear, status: "paid" });
  const revenue = new Map<string, { businessId: string; businessName: string; total: number }>();
  for (const row of rows) {
    const current = revenue.get(row.business_id) ?? {
      businessId: row.business_id,
      businessName: row.business_name,
      total: 0,
    };
    current.total += Number(row.grand_total);
    revenue.set(row.business_id, current);
  }
  return Array.from(revenue.values());
}

export async function getRevenueByMonth(
  fiscalYear: number,
  businessId?: BusinessId,
): Promise<{ month: number; total: number; count: number }[]> {
  const rows = await queryDocumentAnalytics({ fiscalYear, businessId, status: "paid" });
  const revenue = new Map<number, { month: number; total: number; count: number }>();
  for (const row of rows) {
    const current = revenue.get(row.fiscal_month) ?? {
      month: row.fiscal_month,
      total: 0,
      count: 0,
    };
    current.total += Number(row.grand_total);
    current.count += 1;
    revenue.set(row.fiscal_month, current);
  }
  return Array.from(revenue.values()).sort((left, right) => left.month - right.month);
}
