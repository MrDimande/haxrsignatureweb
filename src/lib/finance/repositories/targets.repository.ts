import type { MonthlyTarget, MonthlyTargetInput } from "@/lib/finance/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  listMonthlyTargets as listMonthlyTargetsNeon,
  upsertMonthlyTarget as upsertMonthlyTargetNeon,
} from "@/lib/finance/repositories/targets.neon.repository";
import {
  listMonthlyTargets as listMonthlyTargetsSupabase,
  upsertMonthlyTarget as upsertMonthlyTargetSupabase,
} from "@/lib/finance/repositories/targets.supabase.repository";

export function listMonthlyTargets(year?: number): Promise<MonthlyTarget[]> {
  return shouldUseNeonServerDatabase()
    ? listMonthlyTargetsNeon(year)
    : listMonthlyTargetsSupabase(year);
}

export function upsertMonthlyTarget(
  input: MonthlyTargetInput,
): Promise<MonthlyTarget> {
  return shouldUseNeonServerDatabase()
    ? upsertMonthlyTargetNeon(input)
    : upsertMonthlyTargetSupabase(input);
}
