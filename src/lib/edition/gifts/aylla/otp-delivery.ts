import { sendTransactionalEmail } from "@/lib/email/brevo-client";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import { logAyllaTrace } from "./trace";
import type { CoreDeliveryProvider } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAXR_MANUAL_WHATSAPP_DIGITS = "258870883428";
const OTP_DELIVERY_TIMEOUT_MS = 10_000;

export type AyllaContactChannel = "email" | "phone" | "unknown";
export type AyllaPhoneOtpChannel = "whatsapp" | "sms";

export interface AyllaOtpDeliveryReadiness {
  readonly emailReady: boolean;
  readonly whatsappReady: boolean;
  readonly smsReady: boolean;
  readonly phoneChannelOrder: readonly AyllaPhoneOtpChannel[];
  readonly anyProductionChannelReady: boolean;
  readonly missingHints: readonly string[];
}

export type AyllaOtpEnv = Readonly<Record<string, string | undefined>>;

export interface ProductionOtpDeliveryDeps {
  readonly env?: AyllaOtpEnv;
  readonly fetchFn?: typeof fetch;
  readonly sendEmailFn?: typeof sendHaxrEmail;
  readonly sendBrevoEmailFn?: typeof sendTransactionalEmail;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normalizes email or Mozambican/E.164 telephone contacts for lookup and delivery.
 * Local 9-digit Mozambican mobile numbers (82-87xxxxxxx) normalize to +2588...
 */
export function normalizeAyllaContactForLookup(rawContact: string): string {
  const trimmed = rawContact.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const normalizedPrefix = trimmed.replace(/\s+/g, "").replace(/^00/, "+");
  const digits = normalizePhoneDigits(normalizedPrefix);
  if (digits.length === 9 && /^8[2-7]\d{7}$/.test(digits)) {
    return `+258${digits}`;
  }
  if (digits.length === 10 && /^08[2-7]\d{7}$/.test(digits)) {
    return `+258${digits.slice(1)}`;
  }
  if (digits.length >= 8) {
    return `+${digits}`;
  }
  return trimmed.toLowerCase();
}

export function classifyAyllaContactChannel(contact: string): AyllaContactChannel {
  const normalized = normalizeAyllaContactForLookup(contact);
  if (EMAIL_PATTERN.test(normalized)) {
    return "email";
  }
  const digits = normalizePhoneDigits(normalized);
  if (digits.length >= 8 && digits.length <= 15) {
    return "phone";
  }
  return "unknown";
}

function isProductionEnv(env: AyllaOtpEnv): boolean {
  return (
    env.VERCEL_ENV?.trim().toLowerCase() === "production" ||
    env.VERCEL_TARGET_ENV?.trim().toLowerCase() === "production"
  );
}

function parsePhoneChannelOrder(env: AyllaOtpEnv): readonly AyllaPhoneOtpChannel[] {
  const raw = env.HAXR_AYLLA_OTP_PHONE_CHANNELS?.trim();
  if (!raw) return ["whatsapp", "sms"];
  const parsed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is AyllaPhoneOtpChannel => entry === "whatsapp" || entry === "sms");
  return parsed.length > 0 ? [...new Set(parsed)] : ["whatsapp", "sms"];
}

function isManualWhatsappNumber(phoneOrWhatsapp: string): boolean {
  return normalizePhoneDigits(phoneOrWhatsapp) === HAXR_MANUAL_WHATSAPP_DIGITS;
}

function resolveWhatsappConfig(env: AyllaOtpEnv): {
  ready: boolean;
  accountSid?: string;
  authToken?: string;
  from?: string;
  contentSid?: string;
  reason?: string;
} {
  if (env.HAXR_AYLLA_OTP_WHATSAPP_ENABLED?.trim().toLowerCase() !== "true") {
    return { ready: false, reason: "HAXR_AYLLA_OTP_WHATSAPP_ENABLED=false" };
  }
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const fromRaw = env.TWILIO_WHATSAPP_FROM?.trim();
  const contentSid = env.TWILIO_AYLLA_OTP_CONTENT_SID?.trim();

  if (!accountSid || !authToken || !fromRaw) {
    return { ready: false, reason: "TWILIO_WHATSAPP_CREDENTIALS_MISSING" };
  }
  if (isManualWhatsappNumber(fromRaw)) {
    return { ready: false, reason: "TWILIO_WHATSAPP_FROM_CANNOT_USE_MANUAL_HAXR_NUMBER" };
  }
  if (isProductionEnv(env) && !contentSid) {
    return { ready: false, reason: "TWILIO_AYLLA_OTP_CONTENT_SID_REQUIRED_IN_PRODUCTION" };
  }

  const from = fromRaw.toLowerCase().startsWith("whatsapp:")
    ? fromRaw
    : `whatsapp:+${normalizePhoneDigits(fromRaw)}`;

  return { ready: true, accountSid, authToken, from, contentSid };
}

function resolveSmsConfig(env: AyllaOtpEnv): {
  ready: boolean;
  accountSid?: string;
  authToken?: string;
  from?: string;
  reason?: string;
} {
  if (env.HAXR_AYLLA_OTP_SMS_ENABLED?.trim().toLowerCase() !== "true") {
    return { ready: false, reason: "HAXR_AYLLA_OTP_SMS_ENABLED=false" };
  }
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const fromRaw = env.TWILIO_SMS_FROM?.trim();

  if (!accountSid || !authToken || !fromRaw) {
    return { ready: false, reason: "TWILIO_SMS_CREDENTIALS_MISSING" };
  }
  if (isManualWhatsappNumber(fromRaw)) {
    return { ready: false, reason: "TWILIO_SMS_FROM_CANNOT_USE_MANUAL_HAXR_NUMBER" };
  }

  return {
    ready: true,
    accountSid,
    authToken,
    from: fromRaw.startsWith("+") ? fromRaw : `+${normalizePhoneDigits(fromRaw)}`,
  };
}

export function isAyllaBrevoOtpEnabled(env: AyllaOtpEnv = process.env): boolean {
  return env.HAXR_AYLLA_OTP_BREVO_ENABLED?.trim().toLowerCase() === "true";
}

export function getAyllaOtpDeliveryReadiness(
  env: AyllaOtpEnv = process.env
): AyllaOtpDeliveryReadiness {
  const resendReady = Boolean(env.RESEND_API_KEY?.trim());
  const brevoReady =
    isAyllaBrevoOtpEnabled(env) &&
    Boolean(env.BREVO_API_KEY?.trim()) &&
    env.EMAIL_SEND_MODE?.trim().toLowerCase() === "production";
  const emailReady = resendReady || brevoReady;

  const whatsapp = resolveWhatsappConfig(env);
  const sms = resolveSmsConfig(env);
  const phoneChannelOrder = parsePhoneChannelOrder(env);

  const missingHints: string[] = [];
  if (!emailReady) {
    missingHints.push("Configurar RESEND_API_KEY para OTP por email");
  }
  if (!whatsapp.ready) {
    missingHints.push(whatsapp.reason ?? "WhatsApp OTP desactivado");
  }
  if (!sms.ready) {
    missingHints.push(sms.reason ?? "SMS OTP desactivado");
  }

  return {
    emailReady,
    whatsappReady: whatsapp.ready,
    smsReady: sms.ready,
    phoneChannelOrder,
    anyProductionChannelReady: emailReady || whatsapp.ready || sms.ready,
    missingHints,
  };
}

export function getAyllaOtpSupportedChannels(
  env: AyllaOtpEnv = process.env
): { readonly email: boolean; readonly phone: boolean } {
  const readiness = getAyllaOtpDeliveryReadiness(env);
  return {
    email: readiness.emailReady,
    phone: readiness.whatsappReady || readiness.smsReady,
  };
}

export function buildAyllaOtpEmailText(code: string): string {
  return [
    "HAXR SIGNATURE · ÉDITION ROSE",
    "Baby Aylla · Lista de Presentes",
    "",
    `O seu código de verificação de uso único é: ${code}`,
    "",
    "Validade: 10 minutos.",
    "Por segurança, nunca partilhe este código com terceiros.",
    "Se não solicitou este código para aceder à lista de presentes da Baby Aylla, ignore este e-mail com segurança.",
    "",
    "HAXR Signature · Atelier de Alta Costura Digital",
    "hello@haxrsignature.com",
  ].join("\n");
}

export function buildAyllaOtpEmailHtml(code: string): string {
  const safeCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Código de Verificação · Baby Aylla · Édition Rose</title>
  </head>
  <body style="margin:0;padding:32px 16px;background-color:#FBF8F5;color:#4A3B39;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;margin:0 auto;background-color:#FFFFFF;border:1px solid #ECCBC0;border-collapse:collapse;">
      <tr>
        <td style="height:4px;background-color:#D8C39D;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:30px 28px 22px;background-color:#FAF3EE;border-bottom:1px solid #ECCBC0;text-align:center;">
          <p style="margin:0 0 10px;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#C87A6E;font-weight:600;">
            HAXR SIGNATURE · ÉDITION ROSE
          </p>
          <div style="display:inline-block;width:38px;height:38px;line-height:38px;border:1px solid #D8C39D;border-radius:999px;background-color:#FFFFFF;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:20px;color:#C87A6E;margin:0 auto 12px;">
            A
          </div>
          <h1 style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:25px;line-height:1.28;font-weight:400;color:#4A3B39;">
            Código de Verificação
          </h1>
          <p style="margin:6px 0 0;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#7A6662;">
            Baby Aylla · Lista de Presentes
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 28px;text-align:center;">
          <p style="margin:0 0 24px;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.7;color:#4A3B39;">
            Utilize o código numérico abaixo para confirmar a sua identidade e reservar um mimo com total privacidade:
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;border-collapse:collapse;">
            <tr>
              <td style="padding:16px 32px;background-color:#FAF3EE;border:1px solid #D8C39D;text-align:center;">
                <span style="font-family:'Playfair Display',Georgia,'Courier New',monospace;font-size:32px;line-height:1.2;letter-spacing:0.28em;color:#4A3B39;font-weight:700;display:inline-block;">
                  ${safeCode}
                </span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 14px;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.6;color:#7A6662;">
            Este código é válido durante <strong style="color:#4A3B39;">10 minutos</strong> e é de uso único.
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0;border-top:1px solid #ECCBC0;border-collapse:collapse;">
            <tr>
              <td style="padding-top:18px;text-align:center;">
                <p style="margin:0;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:1.65;color:#7A6662;">
                  Por segurança, nunca partilhe este código com terceiros. Se não solicitou esta verificação, pode ignorar este e-mail com segurança.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px 24px;background-color:#FAF3EE;border-top:1px solid #ECCBC0;text-align:center;">
          <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:13px;color:#4A3B39;">
            HAXR Signature
          </p>
          <p style="margin:0;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#7A6662;">
            Atelier de Alta Costura Digital · hello@haxrsignature.com
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function postTwilioMessage(input: {
  accountSid: string;
  authToken: string;
  params: URLSearchParams;
  fetchFn: typeof fetch;
}): Promise<{ ok: boolean; errorCode?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OTP_DELIVERY_TIMEOUT_MS);
  const auth = Buffer.from(`${input.accountSid}:${input.authToken}`).toString("base64");
  try {
    const response = await input.fetchFn(
      `https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: input.params,
        signal: controller.signal,
      }
    );
    const payload = (await response.json().catch(() => ({}))) as {
      sid?: string;
      code?: string | number;
    };
    if (!response.ok || !payload.sid) {
      return {
        ok: false,
        errorCode: payload.code != null ? String(payload.code) : `HTTP_${response.status}`,
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorCode: error instanceof Error ? error.name : "FETCH_ERROR",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Production real OTP delivery provider supporting Resend/Brevo for emails and
 * Twilio WhatsApp / SMS for verified Mozambican & international mobile numbers.
 * Never logs verification codes, secrets, or unmasked PII.
 */
export function createProductionAyllaOtpDeliveryProvider(
  deps: ProductionOtpDeliveryDeps = {}
): CoreDeliveryProvider {
  const env = deps.env ?? process.env;
  const fetchFn = deps.fetchFn ?? fetch;
  const sendEmailFn = deps.sendEmailFn ?? sendHaxrEmail;
  const sendBrevoFn = deps.sendBrevoEmailFn ?? sendTransactionalEmail;

  return {
    async sendVerificationCode(contact: string, code: string): Promise<boolean> {
      const normalized = normalizeAyllaContactForLookup(contact);
      const channel = classifyAyllaContactChannel(normalized);

      if (channel === "email") {
        const html = buildAyllaOtpEmailHtml(code);
        const text = buildAyllaOtpEmailText(code);
        const subject = "Código de verificação · Lista de Presentes Baby Aylla";

        if (deps.sendEmailFn || (env === process.env ? isResendConfigured() : Boolean(env.RESEND_API_KEY?.trim()))) {
          try {
            const emailRes = await sendEmailFn({
              channel: "hello",
              to: normalized,
              subject,
              html,
              text,
            });
            if (emailRes.ok) {
              logAyllaTrace("otp_delivery_sent", { channel: "email", provider: "resend" });
              return true;
            }
          } catch {
            // Handled below via fail-closed otp_delivery_failed trace
          }
          logAyllaTrace("otp_delivery_failed", { channel: "email", provider: "resend" });
        }

        if (
          isAyllaBrevoOtpEnabled(env) &&
          Boolean(env.BREVO_API_KEY?.trim()) &&
          env.EMAIL_SEND_MODE?.trim().toLowerCase() === "production"
        ) {
          const brevoRes = await sendBrevoFn({
            toEmail: normalized,
            toName: "Convidado(a) Baby Aylla",
            subject,
            htmlContent: html,
            textContent: text,
            tags: ["aylla-gift-otp"],
          });
          const isMockResult = "mock" in brevoRes && Boolean(brevoRes.mock);
          if (brevoRes.ok && !isMockResult) {
            logAyllaTrace("otp_delivery_sent", { channel: "email", provider: "brevo" });
            return true;
          }
          logAyllaTrace("otp_delivery_failed", { channel: "email", provider: "brevo" });
        }

        logAyllaTrace("otp_delivery_unconfigured", { channel: "email" });
        return false;
      }

      if (channel === "phone") {
        const order = parsePhoneChannelOrder(env);
        for (const phoneChannel of order) {
          if (phoneChannel === "whatsapp") {
            const wa = resolveWhatsappConfig(env);
            if (!wa.ready || !wa.accountSid || !wa.authToken || !wa.from) {
              continue;
            }
            const params = new URLSearchParams({
              To: `whatsapp:${normalized}`,
              From: wa.from,
            });
            if (wa.contentSid) {
              params.set("ContentSid", wa.contentSid);
              params.set("ContentVariables", JSON.stringify({ "1": code }));
            } else {
              params.set(
                "Body",
                `HAXR Signature · Baby Aylla: o seu código de verificação é ${code}. Válido por 10 minutos.`
              );
            }
            const result = await postTwilioMessage({
              accountSid: wa.accountSid,
              authToken: wa.authToken,
              params,
              fetchFn,
            });
            if (result.ok) {
              logAyllaTrace("otp_delivery_sent", { channel: "whatsapp", provider: "twilio" });
              return true;
            }
            logAyllaTrace("otp_delivery_failed", {
              channel: "whatsapp",
              provider: "twilio",
              errorCode: result.errorCode ?? "UNKNOWN",
            });
          } else if (phoneChannel === "sms") {
            const sms = resolveSmsConfig(env);
            if (!sms.ready || !sms.accountSid || !sms.authToken || !sms.from) {
              continue;
            }
            const params = new URLSearchParams({
              To: normalized,
              From: sms.from,
              Body: `HAXR Signature - Baby Aylla: o seu codigo de verificacao e ${code}. Valido por 10 minutos.`,
            });
            const result = await postTwilioMessage({
              accountSid: sms.accountSid,
              authToken: sms.authToken,
              params,
              fetchFn,
            });
            if (result.ok) {
              logAyllaTrace("otp_delivery_sent", { channel: "sms", provider: "twilio" });
              return true;
            }
            logAyllaTrace("otp_delivery_failed", {
              channel: "sms",
              provider: "twilio",
              errorCode: result.errorCode ?? "UNKNOWN",
            });
          }
        }

        logAyllaTrace("otp_delivery_unconfigured", { channel: "phone" });
        return false;
      }

      logAyllaTrace("otp_delivery_invalid_contact", { channel });
      return false;
    },
  };
}
