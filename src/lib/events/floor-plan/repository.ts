import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type { EventFloorPlan } from "@/lib/events/floor-plan/types";
import type { PublicFloorPlan } from "@/lib/events/types";
import {
  getEventFloorPlan as getEventFloorPlanNeon,
  getPublicEventFloorPlan as getPublicEventFloorPlanNeon,
  saveEventFloorPlan as saveEventFloorPlanNeon,
} from "@/lib/events/floor-plan/repository.neon";
import {
  getEventFloorPlan as getEventFloorPlanSupabase,
  getPublicEventFloorPlan as getPublicEventFloorPlanSupabase,
  saveEventFloorPlan as saveEventFloorPlanSupabase,
} from "@/lib/events/floor-plan/repository.supabase";

export {
  createEmptyFloorPlan,
  isFloorPlanSchemaMissingError,
  validateFloorPlanLayout,
} from "@/lib/events/floor-plan/repository.supabase";

export function getEventFloorPlan(
  eventId: string,
): Promise<EventFloorPlan | null> {
  return shouldUseNeonServerDatabase()
    ? getEventFloorPlanNeon(eventId)
    : getEventFloorPlanSupabase(eventId);
}

export function saveEventFloorPlan(
  plan: EventFloorPlan,
): Promise<EventFloorPlan> {
  return shouldUseNeonServerDatabase()
    ? saveEventFloorPlanNeon(plan)
    : saveEventFloorPlanSupabase(plan);
}

export function getPublicEventFloorPlan(
  eventId: string,
): Promise<PublicFloorPlan | null> {
  return shouldUseNeonServerDatabase()
    ? getPublicEventFloorPlanNeon(eventId)
    : getPublicEventFloorPlanSupabase(eventId);
}
