import { NextResponse } from "next/server";
import { z } from "zod";
import { searchFindSeat } from "@/lib/events/services/find-seat.service";
import { normalizeFindSeatCode } from "@/lib/events/find-seat-code";
import {
  getRequestIp,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";

const schema = z.object({
  eventId: z.string().uuid("Evento inválido"),
  query: z.string().trim().min(4).max(80),
  accessCode: z.string().trim().min(4).max(20),
});

const GENERIC_ERROR = {
  ok: false,
  error: "not_found",
  message:
    "Código ou nome incorrectos. Verifique os dados ou dirija-se à recepção.",
};

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const raw = await request.json();
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(GENERIC_ERROR, { status: 400 });
    }

    const { eventId, query, accessCode } = parsed.data;
    const codeKey = normalizeFindSeatCode(accessCode);

    const ipLimited = await persistentRateLimit(
      `find-seat:ip:${ip}`,
      RATE_LIMITS.findSeat
    );
    if (!ipLimited.allowed) {
      return rateLimitResponse(ipLimited, GENERIC_ERROR);
    }

    const eventLimited = await persistentRateLimit(
      `find-seat:event:${eventId}:${ip}`,
      RATE_LIMITS.findSeatPerEvent
    );
    if (!eventLimited.allowed) {
      return rateLimitResponse(eventLimited, GENERIC_ERROR);
    }

    const result = await searchFindSeat(eventId, query, codeKey);

    if (!result.ok) {
      const status =
        result.error === "query_too_long"
          ? 400
          : result.error === "invalid_access" || result.error === "not_found"
            ? 404
            : 400;
      return NextResponse.json(GENERIC_ERROR, { status });
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
