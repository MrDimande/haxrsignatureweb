import {
  HAXR_WHATSAPP_SEND_MODES,
  type HaxrWhatsappSendMode,
} from "@/lib/campaigns/types";

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
  return mode === "preview_test" || mode === "production";
}

export function isManualOpsAllowed(mode: HaxrWhatsappSendMode): boolean {
  return mode === "manual";
}

export type ProviderGateResult =
  | { allowed: false; reason: string; mode: HaxrWhatsappSendMode }
  | { allowed: true; mode: HaxrWhatsappSendMode };

/**
 * Gate fail-closed para qualquer envio automático.
 * Sem credenciais/provider configurados → sempre bloqueado.
 */
export function gateAutomaticProvider(input: {
  mode?: HaxrWhatsappSendMode;
  hasProviderCredentials?: boolean;
  hasConfiguredProvider?: boolean;
}): ProviderGateResult {
  const mode = input.mode ?? getWhatsappSendMode();

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
        "Modo manual activo — apenas wa.me/copy/marcar enviado; sem provider automático.",
      mode,
    };
  }

  if (!input.hasConfiguredProvider) {
    return {
      allowed: false,
      reason:
        "Provider WhatsApp não configurado — fail-closed (sem envio automático).",
      mode,
    };
  }

  if (!input.hasProviderCredentials) {
    return {
      allowed: false,
      reason:
        "Credenciais de provider ausentes — fail-closed (sem inventar tokens).",
      mode,
    };
  }

  // MVP: mesmo com preview_test/production, não activamos provider real.
  return {
    allowed: false,
    reason:
      "Provider automático não activado neste MVP — fail-closed até integração explícita.",
    mode,
  };
}
