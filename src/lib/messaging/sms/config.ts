/**
 * Configuração Twilio SMS — server-only.
 * Nunca NEXT_PUBLIC_*.
 * NÃO assume o mesmo número para SMS e WhatsApp.
 * Rejeita o número manual HAXR WhatsApp (+258 87 088 3428) como SMS FROM.
 */

export const TWILIO_SMS_ENV_KEYS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_SMS_FROM",
  "TWILIO_STATUS_CALLBACK_URL",
] as const;

export type TwilioSmsEnvKey = (typeof TWILIO_SMS_ENV_KEYS)[number];

/** Número manual WhatsApp HAXR — NUNCA usar como SMS FROM. */
export const HAXR_MANUAL_WHATSAPP_DIGITS = "258870883428";

export type TwilioSmsConfig = {
  accountSid: string;
  authToken: string;
  smsFrom: string;
  statusCallbackUrl: string;
  sandboxAllowlist: string[];
  /**
   * Gate extra: só chama a API Twilio quando true.
   * Default false → dry-run (sem envio real).
   */
  liveSendEnabled: boolean;
};

export type TwilioSmsConfigResult =
  | { ok: true; config: TwilioSmsConfig }
  | { ok: false; missing: string[]; reason: string };

function readRequired(
  env: NodeJS.ProcessEnv,
  key: TwilioSmsEnvKey
): string | null {
  const value = env[key]?.trim();
  return value ? value : null;
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function formatSmsE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `+${normalizePhoneDigits(trimmed)}`;
  }
  const digits = normalizePhoneDigits(trimmed);
  return digits ? `+${digits}` : "";
}

export function parseSmsSandboxAllowlist(
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

export function isHaxrManualWhatsappAsSmsFrom(phone: string): boolean {
  return normalizePhoneDigits(phone) === HAXR_MANUAL_WHATSAPP_DIGITS;
}

/**
 * Resolve config Twilio SMS. Fail-closed se faltar secret ou se FROM
 * for o número manual WhatsApp HAXR.
 */
export function resolveTwilioSmsConfig(
  env: NodeJS.ProcessEnv = process.env
): TwilioSmsConfigResult {
  const missing: string[] = [];
  const accountSid = readRequired(env, "TWILIO_ACCOUNT_SID");
  const authToken = readRequired(env, "TWILIO_AUTH_TOKEN");
  const smsFromRaw = readRequired(env, "TWILIO_SMS_FROM");
  const statusCallbackUrl = readRequired(env, "TWILIO_STATUS_CALLBACK_URL");

  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!smsFromRaw) missing.push("TWILIO_SMS_FROM");
  if (!statusCallbackUrl) missing.push("TWILIO_STATUS_CALLBACK_URL");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      reason: `Configuração Twilio SMS incompleta (${missing.join(", ")}). Fail-closed.`,
    };
  }

  if (isHaxrManualWhatsappAsSmsFrom(smsFromRaw!)) {
    return {
      ok: false,
      missing: ["TWILIO_SMS_FROM"],
      reason:
        "TWILIO_SMS_FROM não pode ser +258 87 088 3428 (sender manual WhatsApp HAXR). Use um número Twilio SMS dedicado — SMS e WhatsApp não partilham o mesmo FROM.",
    };
  }

  const smsFrom = formatSmsE164(smsFromRaw!);
  if (!smsFrom || smsFrom.length < 10) {
    return {
      ok: false,
      missing: ["TWILIO_SMS_FROM"],
      reason: "TWILIO_SMS_FROM inválido — use E.164 (ex.: +1…).",
    };
  }

  const sandboxAllowlist = parseSmsSandboxAllowlist(
    env.TWILIO_SMS_SANDBOX_ALLOWLIST ?? env.TWILIO_SANDBOX_ALLOWLIST
  );

  const liveSendEnabled =
    env.HAXR_TWILIO_SMS_LIVE_SEND?.trim().toLowerCase() === "true";

  return {
    ok: true,
    config: {
      accountSid: accountSid!,
      authToken: authToken!,
      smsFrom,
      statusCallbackUrl: statusCallbackUrl!,
      sandboxAllowlist,
      liveSendEnabled,
    },
  };
}

export function isSmsSandboxRecipientAllowed(
  phone: string,
  allowlist: string[]
): boolean {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return false;
  if (allowlist.length === 0) return false;
  return allowlist.some(
    (allowed) =>
      allowed === digits ||
      allowed === digits.replace(/^258/, "") ||
      `258${allowed}` === digits
  );
}

export function hasTwilioSmsCredentials(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return TWILIO_SMS_ENV_KEYS.every((key) => Boolean(env[key]?.trim()));
}
