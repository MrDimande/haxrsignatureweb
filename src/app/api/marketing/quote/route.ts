import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/email/email-schemas";
import {
  isHoneypotFilled,
  isRateLimited,
  publicFormSuccess,
} from "@/lib/api/public-form-guard";
import {
  MARKETING_CONSENT_TEXT,
  resolveSegmentFromEventType,
  splitFullName,
} from "@/lib/email/marketing/marketing-contact";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_MESSAGE =
  "Recebemos o seu pedido. A equipa HAXR entrará em contacto brevemente.";

/** POST /api/marketing/quote — pedido de orçamento */
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = quoteRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    if (isHoneypotFilled(parsed.data.gotcha)) {
      return NextResponse.json(publicFormSuccess(SUCCESS_MESSAGE));
    }

    const email = parsed.data.email.toLowerCase();
    if (isRateLimited(email)) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const { firstName, lastName } = splitFullName(parsed.data.name);
    const segment = resolveSegmentFromEventType(parsed.data.eventType);
    const now = new Date().toISOString();

    const messageParts = [
      parsed.data.message?.trim(),
      parsed.data.serviceInterest
        ? `Interesse: ${parsed.data.serviceInterest}`
        : null,
      parsed.data.estimatedGuests
        ? `Convidados estimados: ${parsed.data.estimatedGuests}`
        : null,
      parsed.data.packageLabel
        ? `Pacote: ${parsed.data.packageLabel}`
        : null,
    ].filter(Boolean);

    const result = await captureMarketingContact({
      email,
      firstName,
      lastName,
      phone: parsed.data.phone,
      segment,
      source: "quote_request",
      role: "lead",
      consentStatus: "granted",
      consentText: MARKETING_CONSENT_TEXT,
      consentAt: now,
      city: parsed.data.city,
      eventType: parsed.data.eventType,
      eventDate: parsed.data.eventDate || undefined,
      message: messageParts.join("\n") || undefined,
      metadata: {
        estimatedGuests: parsed.data.estimatedGuests ?? null,
        serviceInterest: parsed.data.serviceInterest ?? null,
        packageLabel: parsed.data.packageLabel ?? null,
      },
    });

    if (!result.brevo.synced && result.brevo.skipped) {
      console.warn("[api/marketing/quote] Brevo:", result.brevo.skipped);
    }

    return NextResponse.json(publicFormSuccess(SUCCESS_MESSAGE));
  } catch (err) {
    console.error("[api/marketing/quote]", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
