import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  editionProxyUnauthorizedResponse,
  validateEditionProxyJsonBody,
  validateEditionProxyRequest,
} from "@/lib/edition/proxy-auth";
import { processEditionRsvpSubmission } from "@/lib/edition/rsvp/service";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";
import {
  editionRateLimitResponse,
  getRequestIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || randomUUID();
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const proxyAuth = validateEditionProxyRequest(request);
    if (!proxyAuth.ok) {
      console.warn(
        `[api/v1/edition/rsvp] proxy auth failed requestId=${requestId} reason=${proxyAuth.reason}`
      );
      return NextResponse.json(editionProxyUnauthorizedResponse(), {
        status: 401,
      });
    }

    const bodyCheck = validateEditionProxyJsonBody(request);
    if (!bodyCheck.ok) {
      return NextResponse.json(
        { success: false, error: bodyCheck.error },
        { status: bodyCheck.status }
      );
    }

    const ip = getRequestIp(request);
    const rateKey = `edition:rsvp:${ip}`;
    const rateResult = await persistentRateLimit(
      rateKey,
      RATE_LIMITS.editionRsvp
    );

    if (!rateResult.allowed) {
      console.info("[api/v1/edition/rsvp] Rate limited", {
        requestId,
        proxyOrigin: request.headers.get("x-haxr-proxy-origin") ?? "direct",
      });
      return editionRateLimitResponse(rateResult);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Payload inválido." },
        { status: 400 }
      );
    }

    const result = await processEditionRsvpSubmission(body);

    console.info("[api/v1/edition/rsvp] Processed", {
      requestId,
      status: result.status,
      proxyOrigin: request.headers.get("x-haxr-proxy-origin") ?? "direct",
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(`[api/v1/edition/rsvp] requestId=${requestId}`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocorreu um erro ao processar o seu RSVP.",
      },
      { status: 500 }
    );
  }
}
