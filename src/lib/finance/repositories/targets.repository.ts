import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { mapMonthlyTarget } from "@/lib/finance/db/target-mappers";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { MonthlyTarget, MonthlyTargetInput } from "@/lib/finance/types";

export async function listMonthlyTargets(
  year?: number
): Promise<MonthlyTarget[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("finance_monthly_targets")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (year) query = query.eq("year", year);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return asTableRows<"finance_monthly_targets">(data).map(mapMonthlyTarget);
}

export async function upsertMonthlyTarget(
  input: MonthlyTargetInput
): Promise<MonthlyTarget> {
  const supabase = createAdminClient();

  const payload: TablesInsert<"finance_monthly_targets"> = {
    business_id: input.businessId,
    year: input.year,
    month: input.month,
    target_amount: input.targetAmount,
    currency: input.currency,
    notes: input.notes?.trim() ?? "",
  };

  const { data, error } = await supabase
    .from("finance_monthly_targets")
    .upsert(payload as never, {
      onConflict: "business_id,year,month,currency",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"finance_monthly_targets">(data);
  if (!row) throw new Error("Falha ao guardar meta mensal.");
  return mapMonthlyTarget(row);
}
