import { resolveTwilioSmsConfig } from "@/lib/messaging/sms/config";
import {
  handleTwilioSmsStatusCallback,
  twilioSmsParamsFromFormData,
} from "@/lib/messaging/sms/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * StatusCallback Twilio SMS.
 * Validação obrigatória de X-Twilio-Signature (reutiliza HMAC existente).
 * Não envia mensagens — só processa estados delivered/failed/undelivered.
 * Persistência: stub até repositório SMS ligado.
 */
export async function POST(request: Request) {
  const resolved = resolveTwilioSmsConfig(process.env);

  if (!resolved.ok) {
    return Response.json(
      { ok: false, error: resolved.reason },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-twilio-signature");
  const form = await request.formData();
  const params = twilioSmsParamsFromFormData(form);
  const callbackUrl = resolved.config.statusCallbackUrl;

  const result = handleTwilioSmsStatusCallback({
    authToken: resolved.config.authToken,
    signatureHeader: signature,
    callbackUrl,
    params,
  });

  if (!result.accepted) {
    return Response.json(
      { ok: false, error: result.reason },
      { status: 403 }
    );
  }

  return Response.json({
    ok: true,
    status: result.event.status,
    messageSid: result.event.messageSid,
    applied: result.applied,
  });
}
