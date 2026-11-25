import { NextResponse } from "next/server";
import {
  editionProxyUnauthorizedResponse,
  validateAyllaProxyRequest,
  validateEditionProxyJsonBody,
} from "@/lib/edition/proxy-auth";
import { getRequestIp } from "@/lib/security/rate-limit";
import { isAyllaGiftRegistryOperational } from "@/lib/edition/gifts/aylla/test-activation";
import { getCoreAyllaGiftService } from "@/lib/edition/gifts/aylla/instance";
import { withCoreAyllaRouteTrace } from "@/lib/edition/gifts/aylla/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withCoreAyllaRouteTrace(request, "challenge", async () => {
    const proxyAuth = validateAyllaProxyRequest(request);
    if (!proxyAuth.ok) {
      return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
    }

    if (!isAyllaGiftRegistryOperational()) {
      return NextResponse.json({ success: false, outcome: "registry_closed" }, { status: 403 });
    }

    const bodyCheck = validateEditionProxyJsonBody(request);
    if (!bodyCheck.ok) {
      return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
    }

    let body: { contact?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    if (!body.contact || typeof body.contact !== "string") {
      return NextResponse.json({ success: false, error: "Contacto obrigatório." }, { status: 400 });
    }

    const clientIp = getRequestIp(request);
    const service = getCoreAyllaGiftService();
    const result = await service.requestVerification(body.contact, clientIp);

    if (result.outcome === "rate_limited") {
      return NextResponse.json({ success: false, error: "Demasiados pedidos. Tente mais tarde." }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      outcome: result.outcome,
      challengeId: result.challengeId,
    });
  });
}
