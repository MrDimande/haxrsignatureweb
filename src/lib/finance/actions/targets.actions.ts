"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as targetsRepo from "@/lib/finance/repositories/targets.repository";
import type { MonthlyTargetInput } from "@/lib/finance/types";

export async function upsertMonthlyTargetAction(input: MonthlyTargetInput) {
  const result = await runAction(() => targetsRepo.upsertMonthlyTarget(input));
  if (result.success) revalidatePath("/admin/cash");
  return result;
}
