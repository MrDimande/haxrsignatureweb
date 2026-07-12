import { NextResponse } from "next/server";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { intakeConciergeItem } from "@/lib/concierge/portal/get-concierge-data";
import { conciergeIntakeInputSchema } from "@/lib/concierge/portal/schemas";
import { z } from "zod";

const bodySchema = conciergeIntakeInputSchema.extend({
  fileBase64: z.string().optional(),
});

// TODO: auth/session protection
// TODO: event ownership validation
// TODO: persistent storage + file upload to object storage

export async function POST(request: Request) {
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

  const result = await intakeConciergeItem(input, fileBuffer);
  return toConciergeApiResponse(result);
}
