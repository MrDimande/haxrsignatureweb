import { z } from "zod";
import { toConciergeApiResponse } from "@/lib/concierge/portal/concierge-adapter";
import { archivePortalConciergeItem } from "@/lib/portal/services/portal-concierge.service";

const bodySchema = z.object({
  eventId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ token: string; itemId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { token, itemId } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "validation_error", message: "eventId é obrigatório." },
      { status: 400 }
    );
  }

  const result = await archivePortalConciergeItem(
    token,
    parsed.data.eventId,
    itemId
  );
  return toConciergeApiResponse(result);
}
