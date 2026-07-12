import { NextResponse } from "next/server";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { classifyItem } from "@/lib/concierge/portal/get-concierge-data";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";
import { z } from "zod";

// TODO: auth/session protection
// TODO: event ownership validation

const bodySchema = z.object({
  eventId: z.string().optional(),
  itemId: z.string(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: "Pedido inválido." },
      { status: 400 }
    );
  }
  const eventId = parsed.data.eventId ?? DEFAULT_EVENT_ID;
  const result = await classifyItem(eventId, parsed.data.itemId);
  return toConciergeApiResponse(result);
}
