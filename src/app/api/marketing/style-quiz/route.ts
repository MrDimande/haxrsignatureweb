import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry } from "@/lib/contact/inquiries.repository";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";
import { resolveSegmentFromEventType } from "@/lib/email/marketing/marketing-contact";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const styleQuizLeadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  eventType: z.string().min(2).max(80),
  budgetRange: z.string().min(2).max(80),
  urgency: z.string().min(2).max(80),
  styleResult: z.string().min(2).max(120),
  styleDescription: z.string().max(500).optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 }
    );
  }

  const parsed = styleQuizLeadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const message = [
    `Style Quiz: ${data.styleResult}`,
    data.styleDescription ? `Descrição: ${data.styleDescription}` : null,
    `Orçamento: ${data.budgetRange}`,
    `Urgência: ${data.urgency}`,
    data.phone ? `Telefone: ${data.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const inquiry = await createInquiry({
    name: data.name,
    email: data.email,
    projectType: data.eventType,
    packageLabel: data.styleResult,
    intent: "style_quiz",
    message,
    marketingOptIn: data.marketingOptIn ?? true,
  });

  if (data.marketingOptIn !== false) {
    const [firstName, ...rest] = data.name.trim().split(/\s+/);
    await captureMarketingContact({
      email: data.email,
      firstName: firstName ?? data.name,
      lastName: rest.join(" ") || undefined,
      segment: resolveSegmentFromEventType(data.eventType),
      consentStatus: "granted",
      source: "style_quiz",
      eventType: data.eventType,
      message,
    }).catch(() => undefined);
  }

  return NextResponse.json({ success: true, inquiryId: inquiry.id });
}
