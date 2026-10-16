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
    // 1. Rate limit
    const ip = getRequestIp(request);
    const limited = rateLimit(`event-checkin:${ip}`, RATE_LIMITS.eventAction);
    if (!limited.allowed) {
      return rateLimitResponse(limited, { ok: false });
    }

    // 2. Autenticação obrigatória do operador no servidor (sem eventId) -> 401 se não houver sessão
    const sessionCheck = await verifyCheckinSession();
    if (!sessionCheck.authorized) {
      return NextResponse.json(
        { ok: false, error: sessionCheck.error, message: sessionCheck.message },
        { status: sessionCheck.status }
      );
    }

    // 3. Leitura do corpo dentro de try/catch próprio -> 400 invalid_request se for JSON inválido
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    // 4. Validação com o schema zod -> 400
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    // 5. Autorização efectiva do operador sobre o evento específico (404/403)
    const eventAuthCheck = await verifyCheckinSession(parsed.data.eventId);
    if (!eventAuthCheck.authorized) {
      return NextResponse.json(
        { ok: false, error: eventAuthCheck.error, message: eventAuthCheck.message },
        { status: eventAuthCheck.status }
      );
    }

    // 6. Execução atómica do check-in através da RPC perform_event_checkin
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
