import { NextResponse } from "next/server";
import { z } from "zod";
import { searchFindSeat } from "@/lib/events/services/find-seat.service";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

const schema = z.object({
  eventId: z.string().uuid("Evento inválido"),
  query: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const limited = rateLimit(`find-seat:${ip}`, RATE_LIMITS.findSeat);
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

    const result = await searchFindSeat(
      parsed.data.eventId,
      parsed.data.query
    );

    if (!result.ok) {
      const status =
        result.error === "event_not_found"
          ? 404
          : result.error === "query_too_short" ||
              result.error === "query_too_long"
            ? 400
            : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/events/find-seat]", err);
    return NextResponse.json(
      { ok: false, error: "unavailable" },
      { status: 500 }
    );
  }
}
