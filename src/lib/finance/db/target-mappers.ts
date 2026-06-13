import type { Tables } from "@/lib/supabase/database.types";
import type { BusinessId, Currency } from "@/lib/admin/types";
import type { MonthlyTarget } from "@/lib/finance/types";

export function mapMonthlyTarget(
  row: Tables<"finance_monthly_targets">
): MonthlyTarget {
  return {
    id: row.id,
    businessId: row.business_id as BusinessId,
    year: row.year,
    month: row.month,
    targetAmount: Number(row.target_amount),
    currency: row.currency as Currency,
    notes: row.notes,
  };
}
