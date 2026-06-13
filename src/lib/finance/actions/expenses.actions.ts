"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as expensesRepo from "@/lib/finance/repositories/expenses.repository";
import type { ExpenseFormInput } from "@/lib/finance/types";

function revalidateFinance() {
  revalidatePath("/admin/cash");
  revalidatePath("/admin/dashboard");
}

export async function createExpenseAction(
  input: ExpenseFormInput,
  eventName?: string
) {
  const result = await runAction(() =>
    expensesRepo.createExpense(input, eventName)
  );
  if (result.success) revalidateFinance();
  return result;
}

export async function deleteExpenseAction(id: string) {
  const result = await runAction(() => expensesRepo.deleteExpense(id));
  if (result.success) revalidateFinance();
  return result;
}
