import type { ConciergeItemType } from "@/lib/concierge/portal/types";

const DETECTION_MESSAGES: Record<string, string> = {
  contrato: "Detectámos um contrato de fornecedor",
  proposta: "Detectámos uma proposta comercial",
  recibo: "Detectámos um comprovativo de pagamento",
  comprovativo_pagamento: "Detectámos um comprovativo de pagamento",
  lista_convidados: "Detectámos uma lista de convidados",
  referencia_visual: "Detectámos uma referência visual",
  checklist: "Detectámos tarefas de planeamento",
  contract: "Detectámos um contrato",
  vendor_proposal: "Detectámos uma proposta de fornecedor",
  payment_receipt: "Detectámos um pagamento",
  guest_list: "Detectámos uma lista de convidados",
  visual_reference: "Detectámos uma referência visual",
};

export function buildConciergeDetectionMessage(
  detectedType: string,
  fileName?: string | null
): string {
  const base =
    DETECTION_MESSAGES[detectedType] ??
    "Detectámos um documento relevante para o vosso evento";
  if (fileName?.trim()) {
    return `${base}: ${fileName.trim()}`;
  }
  return base;
}

export function mapClassifierTypeToPortalType(
  documentType: string
): ConciergeItemType {
  switch (documentType) {
    case "contract":
      return "contrato";
    case "vendor_proposal":
      return "proposta";
    case "payment_receipt":
      return "comprovativo_pagamento";
    case "guest_list":
      return "lista_convidados";
    case "checklist":
      return "nota_operacional";
    case "visual_reference":
      return "inspiracao";
    default:
      return "outro";
  }
}
