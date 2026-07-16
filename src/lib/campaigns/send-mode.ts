import {
  HAXR_WHATSAPP_SEND_MODES,
  type HaxrWhatsappSendMode,
} from "@/lib/campaigns/types";
import {
  hasTwilioCredentials,
  resolveTwilioWhatsappConfig,
} from "@/lib/campaigns/provider/twilio-config";

const DEFAULT_SEND_MODE: HaxrWhatsappSendMode = "disabled";

export function parseWhatsappSendMode(
  raw: string | null | undefined
): HaxrWhatsappSendMode {
  const value = (raw ?? "").trim().toLowerCase();
  if (
    (HAXR_WHATSAPP_SEND_MODES as readonly string[]).includes(value)
  ) {
    return value as HaxrWhatsappSendMode;
  }
  // Valores legacy do MVP anterior → fail-closed
  if (value === "preview_test" || value === "production") {
    return DEFAULT_SEND_MODE;
  }
  return DEFAULT_SEND_MODE;
}

/** Lê HAXR_WHATSAPP_SEND_MODE; default fail-closed = disabled. */
export function getWhatsappSendMode(
  env: NodeJS.ProcessEnv = process.env
): HaxrWhatsappSendMode {
  return parseWhatsappSendMode(env.HAXR_WHATSAPP_SEND_MODE);
}

export function isAutomaticProviderAllowed(
  mode: HaxrWhatsappSendMode
): boolean {
  return mode === "twilio_sandbox" || mode === "twilio_production";
}

export function isManualOpsAllowed(mode: HaxrWhatsappSendMode): boolean {
  return mode === "manual";
}

export function isTwilioSandboxMode(mode: HaxrWhatsappSendMode): boolean {
  return mode === "twilio_sandbox";
}

export type ProviderGateResult =
  | { allowed: false; reason: string; mode: HaxrWhatsappSendMode }
  | { allowed: true; mode: HaxrWhatsappSendMode };

/**
 * Gate fail-closed para envio automático Twilio.
 * - disabled / manual → bloqueado
 * - twilio_production → bloqueado neste PR (número dedicado ainda não activado)
 * - twilio_sandbox → só com config completa + allowlist
 */
export function gateAutomaticProvider(input: {
  mode?: HaxrWhatsappSendMode;
  hasProviderCredentials?: boolean;
  hasConfiguredProvider?: boolean;
  env?: NodeJS.ProcessEnv;
}): ProviderGateResult {
  const env = input.env ?? process.env;
  const mode = input.mode ?? getWhatsappSendMode(env);

  if (mode === "disabled") {
    return {
      allowed: false,
      reason: "HAXR_WHATSAPP_SEND_MODE=disabled — envio automático bloqueado.",
      mode,
    };
  }

  if (mode === "manual") {
    return {
      allowed: false,
      reason:
        "Modo manual activo — apenas wa.me/copy/marcar enviado (sender HAXR Signature +258 87 088 3428); sem Twilio.",
      mode,
    };
  }

  if (mode === "twilio_production") {
    return {
      allowed: false,
      reason:
        "HAXR_WHATSAPP_SEND_MODE=twilio_production ainda não está activado. Prepare um número Twilio dedicado (nunca +258 87 088 3428) e peça GO explícito.",
      mode,
    };
  }

  // twilio_sandbox
  const resolved = resolveTwilioWhatsappConfig(env, mode);
  const credentialsOk =
    input.hasProviderCredentials ??
    (resolved.ok || hasTwilioCredentials(env));
  const providerOk = input.hasConfiguredProvider ?? resolved.ok;

  if (!providerOk || !resolved.ok) {
    return {
      allowed: false,
      reason: resolved.ok
        ? "Provider Twilio não configurado — fail-closed."
        : resolved.reason,
      mode,
    };
  }

  if (!credentialsOk) {
    return {
      allowed: false,
      reason:
        "Credenciais Twilio ausentes — fail-closed (sem inventar tokens).",
      mode,
    };
  }

  return { allowed: true, mode };
}
