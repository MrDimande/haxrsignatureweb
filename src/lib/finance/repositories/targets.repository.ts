import type { MonthlyTarget, MonthlyTargetInput } from "@/lib/finance/types";
import {
  listMonthlyTargets as listMonthlyTargetsNeon,
  upsertMonthlyTarget as upsertMonthlyTargetNeon,
} from "@/lib/finance/repositories/targets.neon.repository";

export function listMonthlyTargets(year?: number): Promise<MonthlyTarget[]> {
  return listMonthlyTargetsNeon(year);
}

export function upsertMonthlyTarget(
  input: MonthlyTargetInput,
): Promise<MonthlyTarget> {
  return upsertMonthlyTargetNeon(input);
}
