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

export function getAyllaOtpDeliveryReadiness(
  env: AyllaOtpEnv = process.env
): AyllaOtpDeliveryReadiness {
  const resendReady = Boolean(env.RESEND_API_KEY?.trim());
  const brevoReady =
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

function buildAyllaOtpEmailHtml(code: string): string {
  const safeCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="pt">
  <body style="margin:0;padding:32px 16px;background:#f9f3f2;font-family:Georgia,serif;color:#4a3130;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ead8d5;padding:36px 28px;">
      <tr>
        <td style="text-align:center;">
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#97685e;">HAXR SIGNATURE · ÉDITION ROSE</p>
          <h1 style="margin:0 0 18px;font-size:24px;font-weight:normal;color:#4a3130;">Código de Verificação · Baby Aylla</h1>
          <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#5c4442;">
            Utilize o código abaixo para confirmar a sua identidade na lista de presentes da Baby Aylla:
          </p>
          <div style="display:inline-block;padding:14px 28px;margin:0 0 24px;background:#fdf7f6;border:1px solid #d9b6ae;font-family:'Courier New',monospace;font-size:30px;letter-spacing:0.24em;color:#4a3130;font-weight:bold;">
            ${safeCode}
          </div>
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;color:#7c5e5a;">
            Este código expira em 10 minutos. Não o partilhe com terceiros.
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#9f8581;">
            Se não solicitou esta verificação, pode ignorar esta mensagem com segurança.
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
        const subject = "Código de verificação · Lista de Presentes Baby Aylla";

        if (deps.sendEmailFn || (env === process.env ? isResendConfigured() : Boolean(env.RESEND_API_KEY?.trim()))) {
          const emailRes = await sendEmailFn({
            channel: "hello",
            to: normalized,
            subject,
            html,
          });
          if (emailRes.ok) {
            logAyllaTrace("otp_delivery_sent", { channel: "email", provider: "resend" });
            return true;
          }
          logAyllaTrace("otp_delivery_failed", { channel: "email", provider: "resend" });
        }

        if (
          Boolean(env.BREVO_API_KEY?.trim()) &&
          env.EMAIL_SEND_MODE?.trim().toLowerCase() === "production"
        ) {
          const brevoRes = await sendBrevoFn({
            toEmail: normalized,
            toName: "Convidado(a) Baby Aylla",
            subject,
            htmlContent: html,
            textContent: `HAXR Signature - Baby Aylla: o seu codigo de verificacao e ${code}. Valido por 10 minutos.`,
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
