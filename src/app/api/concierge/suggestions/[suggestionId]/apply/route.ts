import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { applySuggestion } from "@/lib/concierge/portal/get-concierge-data";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";
import { z } from "zod";

// TODO: auth/session protection
// TODO: event ownership validation

const bodySchema = z.object({
  eventId: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  const { suggestionId } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const eventId = parsed.success ? parsed.data.eventId ?? DEFAULT_EVENT_ID : DEFAULT_EVENT_ID;
  const result = await applySuggestion(eventId, suggestionId);
  return toConciergeApiResponse(result);
}
