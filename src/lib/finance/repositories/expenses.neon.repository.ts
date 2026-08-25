import { mapExpense } from "@/lib/finance/db/expense-mappers";
import type { ExpenseFormInput, ExpenseRecord } from "@/lib/finance/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type ExpenseRow = Tables<"finance_expenses">;
type NeonExpenseRow = { row: ExpenseRow };

export async function listExpenses(limit = 200): Promise<ExpenseRecord[]> {
  const result = await neonQuery<NeonExpenseRow>(
    `
      SELECT to_jsonb(e) AS row
      FROM public.finance_expenses e
      ORDER BY e.expense_date DESC
      LIMIT $1
    `,
    [limit],
  );
  return result.rows.map(({ row }) => mapExpense(row));
}

export async function createExpense(
  input: ExpenseFormInput,
  eventName = "",
): Promise<ExpenseRecord> {
  const result = await neonQuery<NeonExpenseRow>(
    `
      WITH saved AS (
        INSERT INTO public.finance_expenses (
          business_id,
          event_id,
          category,
          description,
          amount,
          currency,
          expense_date,
          reference,
          notes
        )
        VALUES (
          $1,
          $2::uuid,
          $3::public.expense_category,
          $4,
          $5,
          $6::public.currency_code,
          $7::date,
          $8,
          $9
        )
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
    [
      input.businessId,
      input.eventId ?? null,
      input.category,
      input.description.trim(),
      input.amount,
      input.currency,
      input.expenseDate,
      input.reference?.trim() ?? "",
      input.notes?.trim() ?? "",
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao registar despesa.");
  return mapExpense(row, eventName);
}

export async function deleteExpense(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.finance_expenses WHERE id = $1::uuid", [id]);
}
