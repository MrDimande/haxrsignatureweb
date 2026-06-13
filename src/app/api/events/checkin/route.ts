import { NextResponse } from "next/server";
import { z } from "zod";
import { performCheckin } from "@/lib/events/services/checkin.service";

const schema = z.object({
  eventId: z.string().uuid("Evento inválido"),
  token: z.string().min(16).max(128),
});

export async function POST(request: Request) {
  try {
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
