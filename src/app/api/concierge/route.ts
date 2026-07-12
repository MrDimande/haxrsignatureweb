import { NextResponse } from "next/server";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { getConciergeData } from "@/lib/concierge/portal/get-concierge-data";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";

// TODO: auth/session protection
// TODO: event ownership validation

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? DEFAULT_EVENT_ID;
  const result = await getConciergeData(eventId);
  if (!result.ok) {
    return toConciergeApiResponse(result);
  }
  return NextResponse.json(result);
}
