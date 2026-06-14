import { NextResponse } from "next/server";
import { rsvpFormSchema } from "@/lib/events/rsvp-validation";
import { performRsvp } from "@/lib/events/services/rsvp.service";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const limited = rateLimit(`event-rsvp:${ip}`, RATE_LIMITS.eventAction);
    if (!limited.allowed) {
      return rateLimitResponse(limited, { ok: false });
    }

    const raw = await request.json();
    const parsed = rsvpFormSchema.safeParse(raw);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json(
        { ok: false, error: "invalid_request", message },
        { status: 400 }
      );
    }

    const result = await performRsvp({
      eventId: parsed.data.eventId,
      token: parsed.data.token,
      name: parsed.data.name,
      phone: parsed.data.phone || undefined,
      email: parsed.data.email || undefined,
      attendance: parsed.data.attendance,
      plusOnes: parsed.data.plusOnes,
      dietaryNotes: parsed.data.dietaryNotes || undefined,
      guestNotes: parsed.data.guestNotes || undefined,
    });

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/events/rsvp]", err);
    return NextResponse.json(
      { ok: false, error: "unavailable" },
      { status: 500 }
    );
  }
}
