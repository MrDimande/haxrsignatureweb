import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow } from "@/lib/supabase/helpers";
import { DEFAULT_FLOOR_PLAN } from "@/lib/events/floor-plan/model";
import type {
  EventFloorPlan,
  FloorPlanItem,
  FloorPlanPrintPreferences,
  FloorPlanRoom,
} from "@/lib/events/floor-plan/types";
import type { Json } from "@/lib/supabase/database.types";

const geometrySchema = z.object({
  id: z.string().min(1).max(160),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
  rotation: z.number().finite(),
  locked: z.boolean(),
});

const itemSchema = z.discriminatedUnion("kind", [
  geometrySchema.extend({
    kind: z.literal("table"),
    tableKey: z.string().min(1).max(160),
    sourceTableName: z.string().min(1).max(160),
    shape: z.enum(["round", "rectangle", "square", "imperial", "sweetheart"]),
  }),
  geometrySchema.extend({
    kind: z.literal("element"),
    elementKind: z.enum([
      "entrance",
      "exit",
      "stage",
      "dance-floor",
      "buffet",
      "bar",
      "dj",
      "cake",
      "photo",
      "wc",
      "wall",
      "column",
      "reserved",
      "text",
    ]),
    label: z.string().max(160),
  }),
]);

const roomSchema = z.object({
  width: z.number().min(4).max(200),
  length: z.number().min(4).max(200),
  gridSize: z.number().min(0.1).max(5),
  unit: z.literal("m"),
});

const printPreferencesSchema = z.object({
  format: z.enum(["A4", "A3"]),
  orientation: z.enum(["portrait", "landscape"]),
  template: z.enum(["technical", "client", "staff", "seating-chart"]),
  showGuestNames: z.boolean(),
});

export function isFloorPlanSchemaMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("event_floor_plans") &&
    (message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("Could not find"))
  );
}

export async function getEventFloorPlan(
  eventId: string
): Promise<EventFloorPlan | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_floor_plans")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"event_floor_plans">(data);
  if (!row) return null;

  return {
    eventId,
    room: roomSchema.parse(row.room),
    items: z.array(itemSchema).max(500).parse(row.items) as FloorPlanItem[],
    printPreferences: printPreferencesSchema.parse(
      row.print_preferences
    ) as FloorPlanPrintPreferences,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export async function saveEventFloorPlan(
  plan: EventFloorPlan
): Promise<EventFloorPlan> {
  const room = roomSchema.parse(plan.room) as FloorPlanRoom;
  const items = z.array(itemSchema).max(500).parse(plan.items) as FloorPlanItem[];
  const printPreferences = printPreferencesSchema.parse(plan.printPreferences);
  const supabase = createAdminClient();
  const payload = {
    event_id: plan.eventId,
    room: room as unknown as Json,
    items: items as unknown as Json,
    print_preferences: printPreferences as unknown as Json,
    version: plan.version,
  };
  const { data, error } = await supabase
    .from("event_floor_plans")
    .upsert(payload as never, { onConflict: "event_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"event_floor_plans">(data);
  if (!row) throw new Error("Falha ao guardar a planta.");
  return {
    eventId: row.event_id,
    room,
    items,
    printPreferences,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export function createEmptyFloorPlan(eventId: string): EventFloorPlan {
  return {
    eventId,
    ...DEFAULT_FLOOR_PLAN,
    room: { ...DEFAULT_FLOOR_PLAN.room },
    items: [],
    printPreferences: { ...DEFAULT_FLOOR_PLAN.printPreferences },
  };
}
