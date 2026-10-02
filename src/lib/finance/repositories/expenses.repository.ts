import type { ExpenseFormInput, ExpenseRecord } from "@/lib/finance/types";
import type { ManagedEvent } from "@/lib/events/types";
import {
  createExpense as createExpenseNeon,
  deleteExpense as deleteExpenseNeon,
  listExpenses as listExpensesNeon,
} from "@/lib/finance/repositories/expenses.neon.repository";

export function listExpenses(limit = 200): Promise<ExpenseRecord[]> {
  return listExpensesNeon(limit);
}

export function createExpense(
  input: ExpenseFormInput,
  eventName = "",
): Promise<ExpenseRecord> {
  return createExpenseNeon(input, eventName);
}

export function deleteExpense(id: string): Promise<void> {
  return deleteExpenseNeon(id);
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
