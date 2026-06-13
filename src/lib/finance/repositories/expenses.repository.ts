import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { mapExpense } from "@/lib/finance/db/expense-mappers";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { ExpenseFormInput, ExpenseRecord } from "@/lib/finance/types";
import type { ManagedEvent } from "@/lib/events/types";

export async function listExpenses(limit = 200): Promise<ExpenseRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return asTableRows<"finance_expenses">(data).map((row) => mapExpense(row));
}

export async function createExpense(
  input: ExpenseFormInput,
  eventName = ""
): Promise<ExpenseRecord> {
  const supabase = createAdminClient();

  const payload: TablesInsert<"finance_expenses"> = {
    business_id: input.businessId,
    event_id: input.eventId ?? null,
    category: input.category,
    description: input.description.trim(),
    amount: input.amount,
    currency: input.currency,
    expense_date: input.expenseDate,
    reference: input.reference?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
  };

  const { data, error } = await supabase
    .from("finance_expenses")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"finance_expenses">(data);
  if (!row) throw new Error("Falha ao registar despesa.");
  return mapExpense(row, eventName);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("finance_expenses")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export function enrichExpensesWithEvents(
  expenses: ExpenseRecord[],
  events: ManagedEvent[]
): ExpenseRecord[] {
  const eventMap = new Map(events.map((event) => [event.id, event.name]));
  return expenses.map((expense) => ({
    ...expense,
    eventName: expense.eventId
      ? (eventMap.get(expense.eventId) ?? expense.eventName)
      : expense.eventName,
  }));
}
