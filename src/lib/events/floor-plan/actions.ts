"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import { saveEventFloorPlan } from "@/lib/events/floor-plan/repository";
import type { EventFloorPlan } from "@/lib/events/floor-plan/types";

export async function saveEventFloorPlanAction(plan: EventFloorPlan) {
  const result = await runAction(() => saveEventFloorPlan(plan));
  if (result.success) {
    revalidatePath(`/admin/events/${plan.eventId}`);
  }
  return result;
}
