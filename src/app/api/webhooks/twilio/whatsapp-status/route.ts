import { InvitationCampaignService } from "@/lib/campaigns/campaign-service";
import { resolveSignatureCallbackUrl } from "@/lib/campaigns/provider/twilio-callback-url";
import { resolveTwilioWhatsappConfig } from "@/lib/campaigns/provider/twilio-config";
import { twilioParamsFromFormData } from "@/lib/campaigns/provider/twilio-webhook";
import { getWhatsappSendMode } from "@/lib/campaigns/send-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * StatusCallback Twilio WhatsApp.
 * Validação obrigatória de X-Twilio-Signature na URL exacta (proxy-safe).
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

  const { url: callbackUrl, receivedUrl } = resolveSignatureCallbackUrl({
    request,
    configuredUrl: resolved.config.statusCallbackUrl,
  });

  // Serviço in-memory não persiste entre requests em Production —
  // a rota valida assinatura + AccountSid e rejeita SID desconhecido.
  // Persistência Supabase liga-se quando a migration 044 estiver aplicada.
  const service = new InvitationCampaignService();
  const result = service.applyTwilioStatusWebhook({
    signatureHeader: signature,
    callbackUrl,
    params,
  });

  if (!result.accepted) {
    return Response.json(
      {
        ok: false,
        error: result.reason ?? "webhook_rejected",
        receivedUrl,
      },
      { status: 403 }
    );
  }

  return Response.json({
    ok: true,
    status: result.status ?? null,
    recipientId: result.recipientId ?? null,
    replay: result.replay ?? false,
    detail: result.reason ?? null,
  });
}
