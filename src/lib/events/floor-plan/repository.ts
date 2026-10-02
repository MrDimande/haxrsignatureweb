import type { EventFloorPlan } from "@/lib/events/floor-plan/types";
import type { PublicFloorPlan } from "@/lib/events/types";
import {
  getEventFloorPlan as getEventFloorPlanNeon,
  getPublicEventFloorPlan as getPublicEventFloorPlanNeon,
  saveEventFloorPlan as saveEventFloorPlanNeon,
} from "@/lib/events/floor-plan/repository.neon";
export {
  createEmptyFloorPlan,
  isFloorPlanSchemaMissingError,
  validateFloorPlanLayout,
} from "@/lib/events/floor-plan/repository.neon";

export function getEventFloorPlan(
  eventId: string,
): Promise<EventFloorPlan | null> {
  return getEventFloorPlanNeon(eventId);
}

export function saveEventFloorPlan(
  plan: EventFloorPlan,
): Promise<EventFloorPlan> {
  return saveEventFloorPlanNeon(plan);
}

export function getPublicEventFloorPlan(
  eventId: string,
): Promise<PublicFloorPlan | null> {
  return getPublicEventFloorPlanNeon(eventId);
}
