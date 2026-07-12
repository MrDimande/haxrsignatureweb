import { NextResponse } from "next/server";
import { marketingCampaignDraftSchema } from "@/lib/email/email-schemas";
import { createCampaignDraftFromDefinition } from "@/lib/email/marketing/marketing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** POST /api/marketing/campaigns/draft — cria rascunho no Brevo (não envia) */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = marketingCampaignDraftSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const result = await createCampaignDraftFromDefinition(
      parsed.data.campaignId,
      parsed.data.firstName
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/marketing/campaigns/draft]", err);
    return NextResponse.json(
      { error: "Falha ao criar rascunho de campanha." },
      { status: 500 }
    );
  }
}
