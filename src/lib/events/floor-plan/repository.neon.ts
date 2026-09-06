import { z } from "zod";
import { neonQuery } from "@/lib/neon/server-db";
import { PUBLIC_ELEMENT_LABELS } from "@/lib/events/floor-plan/presentation";
import {
  isFloorPlanSchemaMissingError,
  validateFloorPlanLayout,
} from "@/lib/events/floor-plan/repository.supabase";
import type {
  EventFloorPlan,
  FloorPlanItem,
  FloorPlanPrintPreferences,
  FloorPlanRoom,
} from "@/lib/events/floor-plan/types";
import type { Tables } from "@/lib/supabase/database.types";
import type { PublicFloorPlan } from "@/lib/events/types";

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

type FloorPlanRow = Tables<"event_floor_plans">;
type NeonFloorPlanJsonRow = { row: FloorPlanRow };

function mapFloorPlan(row: FloorPlanRow): EventFloorPlan {
  return {
    eventId: row.event_id,
    room: roomSchema.parse(row.room),
    items: z.array(itemSchema).max(500).parse(row.items) as FloorPlanItem[],
    printPreferences: printPreferencesSchema.parse(
      row.print_preferences,
    ) as FloorPlanPrintPreferences,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export async function getEventFloorPlan(
  eventId: string,
): Promise<EventFloorPlan | null> {
  const result = await neonQuery<NeonFloorPlanJsonRow>(
    `
      SELECT to_jsonb(fp) AS row
      FROM public.event_floor_plans fp
      WHERE fp.event_id = $1::uuid
      LIMIT 1
    `,
    [eventId],
  );

  const row = result.rows[0]?.row;
  return row ? mapFloorPlan(row) : null;
}

export async function saveEventFloorPlan(
  plan: EventFloorPlan,
): Promise<EventFloorPlan> {
  const room = roomSchema.parse(plan.room) as FloorPlanRoom;
  const items = z.array(itemSchema).max(500).parse(plan.items) as FloorPlanItem[];
  const printPreferences = printPreferencesSchema.parse(plan.printPreferences);
  validateFloorPlanLayout(room, items);

  try {
    const result =
      plan.version === 0
        ? await neonQuery<NeonFloorPlanJsonRow>(
            `
              WITH saved AS (
                INSERT INTO public.event_floor_plans (
                  event_id,
                  room,
                  items,
                  print_preferences,
                  version
                )
                VALUES ($1::uuid, $2::jsonb, $3::jsonb, $4::jsonb, 1)
                RETURNING *
              )
              SELECT to_jsonb(saved) AS row FROM saved
            `,
            [
              plan.eventId,
              JSON.stringify(room),
              JSON.stringify(items),
              JSON.stringify(printPreferences),
            ],
          )
        : await neonQuery<NeonFloorPlanJsonRow>(
            `
              WITH saved AS (
                UPDATE public.event_floor_plans
                SET room = $3::jsonb,
                    items = $4::jsonb,
                    print_preferences = $5::jsonb,
                    version = $2::int + 1
                WHERE event_id = $1::uuid
                  AND version = $2::int
                RETURNING *
              )
              SELECT to_jsonb(saved) AS row FROM saved
            `,
            [
              plan.eventId,
              plan.version,
              JSON.stringify(room),
              JSON.stringify(items),
              JSON.stringify(printPreferences),
            ],
          );

    const row = result.rows[0]?.row;
    if (!row) {
      throw new Error(
        "A planta foi alterada noutra sessão. Recarregue para evitar perder alterações.",
      );
    }

    return mapFloorPlan(row);
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      throw new Error(
        "A planta foi criada noutra sessão. Recarregue antes de guardar.",
      );
    }
    throw error;
  }
}

/**
 * Versão estritamente visual para a experiência pública.
 * Nunca inclui lugares, ocupação, nomes de convidados ou texto livre interno.
 */
export async function getPublicEventFloorPlan(
  eventId: string,
): Promise<PublicFloorPlan | null> {
  try {
    const plan = await getEventFloorPlan(eventId);
    if (!plan || !plan.items.some((item) => item.kind === "table")) return null;

    return {
      room: plan.room,
      items: plan.items.map((item) =>
        item.kind === "table"
          ? { ...item }
          : {
              ...item,
              label: PUBLIC_ELEMENT_LABELS[item.elementKind],
            },
      ),
    };
  } catch (error) {
    if (isFloorPlanSchemaMissingError(error)) return null;
    throw error;
  }
}
