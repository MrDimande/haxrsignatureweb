import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { performCheckin } from "@/lib/events/services/checkin.service";
import { getEventById } from "@/lib/events/repositories/events.repository";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
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

export type CheckinAuthVerificationResult =
  | { authorized: true }
  | { authorized: false; error: "unauthorized" | "forbidden"; status: 401 | 403; message: string };

export async function verifyCheckinSession(): Promise<CheckinAuthVerificationResult> {
  let sessionToken: string | undefined;
  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  } catch {
    // Fora de contexto de cookies do Next.js
  }

  if (!sessionToken || !(await isValidSession(sessionToken))) {
    return {
      authorized: false,
      error: "unauthorized",
      status: 401,
      message: "Sessão não autorizada para realizar check-in.",
    };
  }

  const identity = await getCurrentAdminIdentity();
  if (!identity || identity.status !== "active") {
    return {
      authorized: false,
      error: "forbidden",
      status: 403,
      message: "Identidade administrativa inactiva ou suspensa.",
    };
  }

  return { authorized: true };
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const limited = rateLimit(`event-checkin:${ip}`, RATE_LIMITS.eventAction);
    if (!limited.allowed) {
      return rateLimitResponse(limited, { ok: false });
    }

    // 1. Verificação obrigatória de autenticação no servidor (princípio da defesa em profundidade)
    const authCheck = await verifyCheckinSession();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { ok: false, error: authCheck.error, message: authCheck.message },
        { status: authCheck.status }
      );
    }

    // 2. Validação dos parâmetros da requisição
    const raw = await request.json();
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    // 3. Validação do evento (deve existir e estar activo)
    const event = await getEventById(parsed.data.eventId);
    if (!event || !event.isActive) {
      return NextResponse.json(
        { ok: false, error: "event_not_found", message: "Evento não encontrado ou inactivo." },
        { status: 404 }
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
