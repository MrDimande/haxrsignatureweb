import type { MessagingRecipient } from "@/lib/messaging/types";

/**
 * Fallback WhatsApp → SMS.
 * NÃO é automático por defeito.
 * Requer acção humana explícita: "Enviar SMS aos que falharam".
 * Nunca duplica se WhatsApp já entregou.
 */

export const SMS_FALLBACK_CONFIRM_ACTION = "Enviar SMS aos que falharam" as const;

export type WhatsappToSmsFallbackCandidate = {
  recipient: MessagingRecipient;
  whatsappStatus: string;
  eligible: boolean;
  skipReason?: string;
};

export type WhatsappToSmsFallbackPlan = {
  /** Sem confirmação humana → nunca executar. */
  requiresHumanConfirmation: true;
  confirmActionLabel: typeof SMS_FALLBACK_CONFIRM_ACTION;
  automatic: false;
  candidates: WhatsappToSmsFallbackCandidate[];
  eligibleCount: number;
  skippedDeliveredWhatsapp: number;
};

/**
 * Constrói plano de fallback. Sem confirmação → lista apenas.
 */
export function planWhatsappToSmsFallback(
  recipients: Array<{
    recipient: MessagingRecipient;
    whatsappStatus: string;
  }>
): WhatsappToSmsFallbackPlan {
  let skippedDeliveredWhatsapp = 0;
  const candidates: WhatsappToSmsFallbackCandidate[] = recipients.map(
    ({ recipient, whatsappStatus }) => {
      if (recipient.whatsappDelivered || whatsappStatus === "delivered") {
        skippedDeliveredWhatsapp += 1;
        return {
          recipient,
          whatsappStatus,
          eligible: false,
          skipReason: "WhatsApp já entregue — não duplicar SMS.",
        };
      }
      if (recipient.optedOut) {
        return {
          recipient,
          whatsappStatus,
          eligible: false,
          skipReason: "Destinatário com opt-out.",
        };
      }
      const failed =
        whatsappStatus === "failed" ||
        whatsappStatus === "undelivered" ||
        whatsappStatus === "blocked";
      if (!failed) {
        return {
          recipient,
          whatsappStatus,
          eligible: false,
          skipReason: `Estado WhatsApp "${whatsappStatus}" não é falha.`,
        };
      }
      return {
        recipient,
        whatsappStatus,
        eligible: true,
      };
    }
  );

  return {
    requiresHumanConfirmation: true,
    confirmActionLabel: SMS_FALLBACK_CONFIRM_ACTION,
    automatic: false,
    candidates,
    eligibleCount: candidates.filter((c) => c.eligible).length,
    skippedDeliveredWhatsapp,
  };
}

export type ConfirmFallbackInput = {
  plan: WhatsappToSmsFallbackPlan;
  /** Deve ser exactamente a label da acção humana. */
  confirmedAction: string;
  confirmedBy: string;
};

export type ConfirmFallbackResult =
  | {
      ok: true;
      recipients: MessagingRecipient[];
      confirmedBy: string;
    }
  | { ok: false; reason: string };

/**
 * Só devolve destinatários elegíveis após confirmação humana exacta.
 */
export function confirmWhatsappToSmsFallback(
  input: ConfirmFallbackInput
): ConfirmFallbackResult {
  if (input.confirmedAction !== SMS_FALLBACK_CONFIRM_ACTION) {
    return {
      ok: false,
      reason: `Confirmação inválida. Acção requerida: "${SMS_FALLBACK_CONFIRM_ACTION}". Fallback não é automático.`,
    };
  }
  if (!input.confirmedBy.trim()) {
    return { ok: false, reason: "confirmedBy é obrigatório (operador humano)." };
  }
  if (input.plan.automatic) {
    return { ok: false, reason: "Fallback automático é proibido." };
  }

  return {
    ok: true,
    recipients: input.plan.candidates
      .filter((c) => c.eligible)
      .map((c) => c.recipient),
    confirmedBy: input.confirmedBy.trim(),
  };
}
