import { NextResponse } from "next/server";
import { z } from "zod";
import { performCheckin } from "@/lib/events/services/checkin.service";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

const schema = z.object({
  eventId: z.string().uuid("Evento inválido"),
  token: z.string().min(16).max(128),
});

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const limited = rateLimit(`event-checkin:${ip}`, RATE_LIMITS.eventAction);
    if (!limited.allowed) {
      return rateLimitResponse(limited, { ok: false });
    }

    const raw = await request.json();
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    const result = await performCheckin(
      parsed.data.eventId,
      parsed.data.token
    );

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/events/checkin]", err);
    return NextResponse.json(
      { ok: false, error: "unavailable" },
      { status: 500 }
    );
  }
}
