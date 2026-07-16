import type { HaxrWhatsappSendMode } from "@/lib/campaigns/types";
import { getWhatsappSendMode } from "@/lib/campaigns/send-mode";

/**
 * Configuração Twilio WhatsApp — apenas server-side.
 * Nunca NEXT_PUBLIC_*.
 *
 * Sandbox FROM típico: whatsapp:+14155238886
 * Production: número dedicado Twilio (NÃO +258 87 088 3428).
 */

export const TWILIO_ENV_KEYS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_STATUS_CALLBACK_URL",
] as const;

export type TwilioEnvKey = (typeof TWILIO_ENV_KEYS)[number];

export type TwilioWhatsappConfig = {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
  statusCallbackUrl: string;
  /** Destinatários E.164 permitidos no Sandbox (sem convidados reais). */
  sandboxAllowlist: string[];
  /**
   * Gate extra: só chama a API Twilio quando true.
   * Default false → dry-run (fila/idempotência/status simuláveis sem envio real).
   */
  liveSendEnabled: boolean;
};

export type TwilioConfigResult =
  | { ok: true; config: TwilioWhatsappConfig }
  | { ok: false; missing: string[]; reason: string };

function readRequired(
  env: NodeJS.ProcessEnv,
  key: TwilioEnvKey
): string | null {
  const value = env[key]?.trim();
  return value ? value : null;
}

/** Normaliza telefone para dígitos E.164-ish (sem +). */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function parseSandboxAllowlist(
  raw: string | null | undefined
): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((part) => normalizePhoneDigits(part))
        .filter((digits) => digits.length >= 8)
    ),
  ];
}

export function formatWhatsappAddress(phoneOrWhatsapp: string): string {
  const trimmed = phoneOrWhatsapp.trim();
  if (trimmed.toLowerCase().startsWith("whatsapp:")) return trimmed;
  const digits = normalizePhoneDigits(trimmed);
  return `whatsapp:+${digits}`;
}

/**
 * Resolve config Twilio. Fail-closed se faltar qualquer secret obrigatório
 * ou (em sandbox) a allowlist.
 */
export function resolveTwilioWhatsappConfig(
  env: NodeJS.ProcessEnv = process.env,
  mode: HaxrWhatsappSendMode = getWhatsappSendMode(env)
): TwilioConfigResult {
  const missing: string[] = [];
  const accountSid = readRequired(env, "TWILIO_ACCOUNT_SID");
  const authToken = readRequired(env, "TWILIO_AUTH_TOKEN");
  const whatsappFromRaw = readRequired(env, "TWILIO_WHATSAPP_FROM");
  const statusCallbackUrl = readRequired(env, "TWILIO_STATUS_CALLBACK_URL");

  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!whatsappFromRaw) missing.push("TWILIO_WHATSAPP_FROM");
  if (!statusCallbackUrl) missing.push("TWILIO_STATUS_CALLBACK_URL");

  const sandboxAllowlist = parseSandboxAllowlist(
    env.TWILIO_SANDBOX_ALLOWLIST
  );

  if (mode === "twilio_sandbox" && sandboxAllowlist.length === 0) {
    missing.push("TWILIO_SANDBOX_ALLOWLIST");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      reason: `Configuração Twilio incompleta (${missing.join(", ")}). Fail-closed.`,
    };
  }

  const whatsappFrom = formatWhatsappAddress(whatsappFromRaw!);

  // Produção: bloquear se FROM apontar para o número manual HAXR (+258870883428).
  const fromDigits = normalizePhoneDigits(whatsappFrom);
  if (fromDigits === "258870883428") {
    return {
      ok: false,
      missing: ["TWILIO_WHATSAPP_FROM"],
      reason:
        "TWILIO_WHATSAPP_FROM não pode ser +258 87 088 3428 (sender manual). Use o Sandbox ou um número Twilio dedicado.",
    };
  }

  const liveSendEnabled =
    env.HAXR_TWILIO_LIVE_SEND?.trim().toLowerCase() === "true";

  return {
    ok: true,
    config: {
      accountSid: accountSid!,
      authToken: authToken!,
      whatsappFrom,
      statusCallbackUrl: statusCallbackUrl!,
      sandboxAllowlist,
      liveSendEnabled,
    },
  };
}

export function isSandboxRecipientAllowed(
  phone: string,
  allowlist: string[]
): boolean {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return false;
  return allowlist.some(
    (allowed) =>
      allowed === digits ||
      allowed === digits.replace(/^258/, "") ||
      `258${allowed}` === digits
  );
}

export function hasTwilioCredentials(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return TWILIO_ENV_KEYS.every((key) => Boolean(env[key]?.trim()));
}
