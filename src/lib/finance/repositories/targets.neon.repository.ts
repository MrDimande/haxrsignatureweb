import { mapMonthlyTarget } from "@/lib/finance/db/target-mappers";
import type { MonthlyTarget, MonthlyTargetInput } from "@/lib/finance/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type TargetRow = Tables<"finance_monthly_targets">;
type NeonTargetRow = { row: TargetRow };

export async function listMonthlyTargets(
  year?: number,
): Promise<MonthlyTarget[]> {
  const result = year
    ? await neonQuery<NeonTargetRow>(
        `
          SELECT to_jsonb(t) AS row
          FROM public.finance_monthly_targets t
          WHERE t.year = $1
          ORDER BY t.year DESC, t.month DESC
        `,
        [year],
      )
    : await neonQuery<NeonTargetRow>(`
        SELECT to_jsonb(t) AS row
        FROM public.finance_monthly_targets t
        ORDER BY t.year DESC, t.month DESC
      `);

  return result.rows.map(({ row }) => mapMonthlyTarget(row));
}

export async function upsertMonthlyTarget(
  input: MonthlyTargetInput,
): Promise<MonthlyTarget> {
  const result = await neonQuery<NeonTargetRow>(
    `
      WITH saved AS (
        INSERT INTO public.finance_monthly_targets (
          business_id,
          year,
          month,
          target_amount,
          currency,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::public.currency_code,
          $6
        )
        ON CONFLICT (business_id, year, month, currency)
        DO UPDATE SET
          target_amount = EXCLUDED.target_amount,
          notes = EXCLUDED.notes
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
    [
      input.businessId,
      input.year,
      input.month,
      input.targetAmount,
      input.currency,
      input.notes?.trim() ?? "",
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar meta mensal.");
  return mapMonthlyTarget(row);
}
