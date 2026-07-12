import type { ConciergeDocType } from "@/lib/concierge/types";

export const CONCIERGE_DOC_LABELS: Record<ConciergeDocType, string> = {
  vendor_proposal: "Proposta de fornecedor",
  payment_receipt: "Recibo / pagamento",
  guest_list: "Lista de convidados",
  visual_reference: "Referência visual",
  checklist: "Checklist",
  contract: "Contrato",
  other: "Outro",
};

export const CONCIERGE_STATUS_LABELS: Record<string, string> = {
  pending_review: "Por rever",
  approved: "Aprovado",
  rejected: "Rejeitado",
  failed: "Falhou",
  processing: "A processar",
  uploaded: "Carregado",
};

export const CONCIERGE_SUB_TAB_LABELS = {
  fila: "Fila",
  fornecedores: "Fornecedores",
  checklist: "Checklist",
  moodboard: "Moodboard",
} as const;
