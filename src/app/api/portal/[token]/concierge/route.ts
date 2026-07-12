import { NextResponse } from "next/server";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { getPortalConciergeData } from "@/lib/portal/services/portal-concierge.service";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: "eventId é obrigatório." },
      { status: 400 }
    );
  }

  const result = await getPortalConciergeData(token, eventId);
  return toConciergeApiResponse(result);
}
