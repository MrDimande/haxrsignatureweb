import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { getConciergeItem } from "@/lib/concierge/portal/get-concierge-data";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";

// TODO: auth/session protection
// TODO: event ownership validation

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? DEFAULT_EVENT_ID;
  const result = await getConciergeItem(eventId, itemId);
  return toConciergeApiResponse(result);
}
