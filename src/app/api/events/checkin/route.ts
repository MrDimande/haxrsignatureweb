import { NextResponse } from "next/server";
import { z } from "zod";
import { performCheckin } from "@/lib/events/services/checkin.service";
import { verifyCheckinSession } from "@/lib/events/services/checkin-auth";
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

    // 1. Validação dos parâmetros da requisição para isolar o evento
    const raw = await request.json();
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    // 2. Verificação de autorização efectiva do operador sobre o evento específico
    const authCheck = await verifyCheckinSession(parsed.data.eventId);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { ok: false, error: authCheck.error, message: authCheck.message },
        { status: authCheck.status }
      );
    }

    // 4. Execução atómica do check-in através da RPC perform_event_checkin
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
