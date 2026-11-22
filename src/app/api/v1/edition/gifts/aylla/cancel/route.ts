import { NextResponse } from "next/server";
import {
  editionProxyUnauthorizedResponse,
  validateEditionProxyJsonBody,
  validateEditionProxyRequest,
} from "@/lib/edition/proxy-auth";
import { getCoreAyllaGiftService } from "@/lib/edition/gifts/aylla/instance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const proxyAuth = validateEditionProxyRequest(request);
  if (!proxyAuth.ok) {
    return NextResponse.json(editionProxyUnauthorizedResponse(), { status: 401 });
  }

  const bodyCheck = validateEditionProxyJsonBody(request);
  if (!bodyCheck.ok) {
    return NextResponse.json({ success: false, error: bodyCheck.error }, { status: bodyCheck.status });
  }

  let body: { sessionToken?: string; reservationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
  }

  if (!body.sessionToken || !body.reservationId) {
    return NextResponse.json({ success: false, error: "Parâmetros obrigatórios em falta." }, { status: 400 });
  }

  const service = getCoreAyllaGiftService();
  const result = await service.cancelReservation({
    sessionToken: body.sessionToken,
    reservationId: body.reservationId,
  });

  if (result.outcome === "reservation_confirmed") {
    return NextResponse.json({ success: true, outcome: result.outcome, reservation: result.reservation });
  }

  const statusMap: Record<string, number> = {
    access_denied: 403,
    session_expired: 401,
  };

  return NextResponse.json({ success: false, outcome: result.outcome }, { status: statusMap[result.outcome] ?? 400 });
}
