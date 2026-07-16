import {
  SENDER_KINDS,
  type SenderKind,
  type SenderProvider,
  type SenderStatus,
} from "@/lib/campaigns/types";

const SENDER_KIND_SET = new Set<string>(SENDER_KINDS);

export function isAllowedSenderKind(kind: string): kind is SenderKind {
  return SENDER_KIND_SET.has(kind);
}

/** Nunca aceitar sender automático arbitrário livre. */
export function assertAllowedSenderKind(kind: string): SenderKind {
  if (!isAllowedSenderKind(kind)) {
    throw new Error(
      `Sender kind não permitido: ${kind}. Permitidos: ${SENDER_KINDS.join(", ")}.`
    );
  }
  return kind;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const visible = digits.slice(-4);
  const prefix = digits.slice(0, Math.min(3, digits.length - 4));
  return `${prefix}${"*".repeat(Math.max(2, digits.length - prefix.length - 4))}${visible}`;
}

export function defaultProviderForKind(kind: SenderKind): SenderProvider {
  switch (kind) {
    case "haxr_official":
      return "none";
    case "client_verified_business":
      return "none";
    case "manual_authenticated_whatsapp":
      return "manual_wa_me";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function normalizeSenderStatus(status: string): SenderStatus {
  switch (status) {
    case "active":
    case "inactive":
    case "pending_verification":
    case "revoked":
      return status;
    default:
      return "inactive";
  }
}

export const SENDER_KIND_LABELS: Record<SenderKind, string> = {
  haxr_official: "HAXR oficial",
  client_verified_business: "Número empresarial verificado do cliente",
  manual_authenticated_whatsapp: "Manual WhatsApp autenticado",
};
