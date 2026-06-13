import type { Tables } from "@/lib/supabase/database.types";
import type { BusinessId, Currency } from "@/lib/admin/types";
import type { ExpenseCategory, ExpenseRecord } from "@/lib/finance/types";

export function mapExpense(
  row: Tables<"finance_expenses">,
  eventName = ""
): ExpenseRecord {
  return {
    id: row.id,
    businessId: row.business_id as BusinessId,
    eventId: row.event_id,
    eventName,
    category: row.category as ExpenseCategory,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    expenseDate: row.expense_date,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
