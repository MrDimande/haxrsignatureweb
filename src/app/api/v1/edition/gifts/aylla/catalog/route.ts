import { NextResponse } from "next/server";
import {
  editionProxyUnauthorizedResponse,
  validateAyllaProxyRequest,
  validateEditionProxyJsonBody,
} from "@/lib/edition/proxy-auth";
import { getCoreAyllaGiftService } from "@/lib/edition/gifts/aylla/instance";
import { withCoreAyllaRouteTrace } from "@/lib/edition/gifts/aylla/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withCoreAyllaRouteTrace(request, "catalog", async () => {
    const proxyAuth = validateAyllaProxyRequest(request);
    if (!proxyAuth.ok) {
      return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
    }

    const bodyCheck = validateEditionProxyJsonBody(request);
    if (!bodyCheck.ok) {
      return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
    }

    let body: { sessionToken?: string | null } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const sessionToken = typeof body.sessionToken === "string" && body.sessionToken.trim()
      ? body.sessionToken.trim()
      : null;

    const service = getCoreAyllaGiftService();
    try {
      const snapshot = await service.getCatalogAvailability(sessionToken);
      return NextResponse.json({
        success: true,
        registryEnabled: snapshot.registryEnabled,
        items: snapshot.items,
        myReservations: snapshot.myReservations,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Serviço temporariamente indisponível." },
        { status: 503 }
      );
    }
  });
}
