import type { ExpenseFormInput, ExpenseRecord } from "@/lib/finance/types";
import type { ManagedEvent } from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  createExpense as createExpenseNeon,
  deleteExpense as deleteExpenseNeon,
  listExpenses as listExpensesNeon,
} from "@/lib/finance/repositories/expenses.neon.repository";
import {
  createExpense as createExpenseSupabase,
  deleteExpense as deleteExpenseSupabase,
  listExpenses as listExpensesSupabase,
} from "@/lib/finance/repositories/expenses.supabase.repository";

export function listExpenses(limit = 200): Promise<ExpenseRecord[]> {
  return shouldUseNeonServerDatabase()
    ? listExpensesNeon(limit)
    : listExpensesSupabase(limit);
}

export function createExpense(
  input: ExpenseFormInput,
  eventName = "",
): Promise<ExpenseRecord> {
  return shouldUseNeonServerDatabase()
    ? createExpenseNeon(input, eventName)
    : createExpenseSupabase(input, eventName);
}

export function deleteExpense(id: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? deleteExpenseNeon(id)
    : deleteExpenseSupabase(id);
}

export function enrichExpensesWithEvents(
  expenses: ExpenseRecord[],
  events: ManagedEvent[],
): ExpenseRecord[] {
  const eventMap = new Map(events.map((event) => [event.id, event.name]));
  return expenses.map((expense) => ({
    ...expense,
    eventName: expense.eventId
      ? (eventMap.get(expense.eventId) ?? expense.eventName)
      : expense.eventName,
  }));
}
