/**
 * Modos SMS — server-only, fail-closed por defeito.
 * Espelha o espírito de HAXR_WHATSAPP_SEND_MODE sem misturar canais.
 */

export const HAXR_SMS_SEND_MODES = [
  "disabled",
  "sms_sandbox_or_test",
  "sms_production",
] as const;

export type HaxrSmsSendMode = (typeof HAXR_SMS_SEND_MODES)[number];

const DEFAULT_SMS_MODE: HaxrSmsSendMode = "disabled";

export function parseSmsSendMode(
  raw: string | null | undefined
): HaxrSmsSendMode {
  const value = (raw ?? "").trim().toLowerCase();
  if ((HAXR_SMS_SEND_MODES as readonly string[]).includes(value)) {
    return value as HaxrSmsSendMode;
  }
  return DEFAULT_SMS_MODE;
}

/** Lê HAXR_SMS_SEND_MODE; default fail-closed = disabled. */
export function getSmsSendMode(
  env: NodeJS.ProcessEnv = process.env
): HaxrSmsSendMode {
  return parseSmsSendMode(env.HAXR_SMS_SEND_MODE);
}

export type SmsGateResult =
  | { allowed: false; reason: string; mode: HaxrSmsSendMode }
  | { allowed: true; mode: HaxrSmsSendMode };

/**
 * Gate fail-closed para SMS.
 * - disabled → bloqueado
 * - sms_sandbox_or_test → permitido só com config completa (dry-run default)
 * - sms_production → BLOQUEADO por defeito neste PR (requer GO explícito futuro)
 */
export function gateSmsSend(input: {
  mode?: HaxrSmsSendMode;
  configOk?: boolean;
  env?: NodeJS.ProcessEnv;
}): SmsGateResult {
  const env = input.env ?? process.env;
  const mode = input.mode ?? getSmsSendMode(env);

  if (mode === "disabled") {
    return {
      allowed: false,
      reason: "HAXR_SMS_SEND_MODE=disabled — SMS bloqueado (fail-closed).",
      mode,
    };
  }

  if (mode === "sms_production") {
    return {
      allowed: false,
      reason:
        "HAXR_SMS_SEND_MODE=sms_production está fail-closed por defeito. Prepare número Twilio SMS dedicado (nunca +258 87 088 3428), confirme GO humano e só então active live send.",
      mode,
    };
  }

  // sms_sandbox_or_test
  if (input.configOk === false) {
    return {
      allowed: false,
      reason: "Configuração Twilio SMS incompleta — fail-closed.",
      mode,
    };
  }

  return { allowed: true, mode };
}
