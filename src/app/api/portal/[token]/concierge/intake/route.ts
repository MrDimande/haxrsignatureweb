import { NextResponse } from "next/server";
import { z } from "zod";
import { conciergeIntakeInputSchema } from "@/lib/concierge/portal/schemas";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { intakePortalConciergeItem } from "@/lib/portal/services/portal-concierge.service";

const bodySchema = conciergeIntakeInputSchema.extend({
  fileBase64: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;
  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: "Dados de entrada inválidos." },
      { status: 400 }
    );
  }

  const { fileBase64, ...input } = parsed.data;
  const fileBuffer = fileBase64?.trim()
    ? Buffer.from(fileBase64, "base64")
    : undefined;

  const result = await intakePortalConciergeItem(token, input, fileBuffer);
  return toConciergeApiResponse(result);
}
