import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry } from "@/lib/contact/inquiries.repository";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";
import { resolveSegmentFromEventType } from "@/lib/email/marketing/marketing-contact";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const submitWeddingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  coupleNames: z.string().min(2).max(160),
  eventDate: z.string().max(32).optional(),
  location: z.string().max(160).optional(),
  instagram: z.string().max(120).optional(),
  story: z.string().min(20).max(4000),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 }
    );
  }

  const parsed = submitWeddingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const message = [
    `Casal: ${data.coupleNames}`,
    data.eventDate ? `Data: ${data.eventDate}` : null,
    data.location ? `Local: ${data.location}` : null,
    data.instagram ? `Instagram: ${data.instagram}` : null,
    data.phone ? `Telefone: ${data.phone}` : null,
    "",
    data.story,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const inquiry = await createInquiry({
    name: data.name,
    email: data.email,
    projectType: "casamento",
    packageLabel: "Submissão portfólio",
    intent: "submit_wedding",
    message,
    marketingOptIn: data.marketingOptIn ?? true,
  });

  if (data.marketingOptIn !== false) {
    const [firstName, ...rest] = data.name.trim().split(/\s+/);
    await captureMarketingContact({
      email: data.email,
      firstName: firstName ?? data.name,
      lastName: rest.join(" ") || undefined,
      segment: resolveSegmentFromEventType("casamento"),
      consentStatus: "granted",
      source: "submit_wedding",
      eventType: "casamento",
      message,
    }).catch(() => undefined);
  }

  return NextResponse.json({ success: true, inquiryId: inquiry.id });
}
