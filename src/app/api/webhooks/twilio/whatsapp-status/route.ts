import { InvitationCampaignService } from "@/lib/campaigns/campaign-service";
import { resolveTwilioWhatsappConfig } from "@/lib/campaigns/provider/twilio-config";
import { twilioParamsFromFormData } from "@/lib/campaigns/provider/twilio-webhook";
import { getWhatsappSendMode } from "@/lib/campaigns/send-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * StatusCallback Twilio WhatsApp.
 * Validação obrigatória de X-Twilio-Signature.
 * Não envia mensagens — só actualiza estados.
 */
export async function POST(request: Request) {
  const mode = getWhatsappSendMode();
  const resolved = resolveTwilioWhatsappConfig(process.env, mode);

  if (!resolved.ok) {
    return Response.json(
      { ok: false, error: resolved.reason },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-twilio-signature");
  const form = await request.formData();
  const params = twilioParamsFromFormData(form);

  // URL exacta configurada em TWILIO_STATUS_CALLBACK_URL (assinatura Twilio).
  const callbackUrl = resolved.config.statusCallbackUrl;

  // Serviço in-memory não persiste entre requests em Production —
  // a rota valida assinatura e devolve 200/403. Persistência Supabase
  // liga-se quando a migration 044 estiver aplicada + repositório de SID.
  const service = new InvitationCampaignService();
  const result = service.applyTwilioStatusWebhook({
    signatureHeader: signature,
    callbackUrl,
    params,
  });

  if (!result.accepted) {
    return Response.json(
      { ok: false, error: result.reason ?? "webhook_rejected" },
      { status: 403 }
    );
  }

  return Response.json({
    ok: true,
    status: result.status ?? null,
    recipientId: result.recipientId ?? null,
    detail: result.reason ?? null,
  });
}
