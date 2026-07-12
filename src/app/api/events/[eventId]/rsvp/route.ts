import { NextResponse } from "next/server";
import { getRsvpModuleData } from "@/lib/event-modules/get-event-module-data";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const result = await getRsvpModuleData(eventId);
  const status = !result.ok ? (result.error === "not_found" ? 404 : 503) : 200;
  return NextResponse.json(result, { status });
}
