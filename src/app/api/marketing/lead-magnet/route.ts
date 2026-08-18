import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry } from "@/lib/contact/inquiries.repository";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";
import { resolveSegmentFromEventType } from "@/lib/email/marketing/marketing-contact";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const leadMagnetSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  guiaId: z.string().min(2).max(80),
  guiaTitle: z.string().min(2).max(200),
  source: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível." },
      { status: 503 }
    );
  }

  const parsed = leadMagnetSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const message = `Pedido de guia: ${data.guiaTitle} (${data.guiaId})`;

  const inquiry = await createInquiry({
    name: data.name,
    email: data.email,
    projectType: "guia",
    packageLabel: data.guiaTitle,
    intent: data.source,
    message,
    marketingOptIn: true,
  });

  const [firstName, ...rest] = data.name.trim().split(/\s+/);
  await captureMarketingContact({
    email: data.email,
    firstName: firstName ?? data.name,
    lastName: rest.join(" ") || undefined,
    segment: resolveSegmentFromEventType("casamento"),
    consentStatus: "granted",
    source: data.source,
    eventType: "casamento",
    message,
  }).catch(() => undefined);

  return NextResponse.json({ success: true, inquiryId: inquiry.id });
}
