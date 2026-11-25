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
  return withCoreAyllaRouteTrace(request, "session_post", async () => {
    const proxyAuth = validateAyllaProxyRequest(request);
    if (!proxyAuth.ok) {
      return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
    }

    const bodyCheck = validateEditionProxyJsonBody(request);
    if (!bodyCheck.ok) {
      return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
    }

    let body: { sessionToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    if (!body.sessionToken || typeof body.sessionToken !== "string") {
      return NextResponse.json({ success: false, error: "sessionToken obrigatório." }, { status: 400 });
    }

    const service = getCoreAyllaGiftService();
    const session = await service.resolveSession(body.sessionToken);

    if (!session.valid) {
      return NextResponse.json({ success: false, reason: session.reason }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      guest: {
        id: session.guest.id,
        name: session.guest.name,
        contact: session.guest.contact,
      },
    });
  });
}

export async function DELETE(request: Request) {
  return withCoreAyllaRouteTrace(request, "session_delete", async () => {
    const proxyAuth = validateAyllaProxyRequest(request);
    if (!proxyAuth.ok) {
      return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
    }

    const bodyCheck = validateEditionProxyJsonBody(request);
    if (!bodyCheck.ok) {
      return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
    }

    let body: { sessionToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    if (!body.sessionToken || typeof body.sessionToken !== "string") {
      return NextResponse.json({ success: false, error: "sessionToken obrigatório." }, { status: 400 });
    }

    const service = getCoreAyllaGiftService();
    const revoked = await service.revokeSession(body.sessionToken);

    return NextResponse.json({ success: true, revoked });
  });
}
