import type {
  VendorStatus,
  PaymentStatus,
  DocumentStatus,
  ChecklistStatus,
  ChecklistPriority,
  ConciergeClassificationStatus,
  PortalRsvpStatus,
} from "@/lib/event-modules/types";

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  sugerido: "Sugerido",
  em_análise: "Em análise",
  aprovado: "Aprovado",
  contratado: "Contratado",
  rejeitado: "Rejeitado",
  concluído: "Concluído",
};

export const VENDOR_STATUS_STYLES: Record<VendorStatus, string> = {
  sugerido: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  em_análise: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  aprovado: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  contratado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejeitado: "text-red-400 bg-red-500/10 border-red-500/20",
  concluído: "text-zinc-300 bg-white/5 border-white/10",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pago: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  parcial: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pendente: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  atrasado: "text-red-400 bg-red-500/10 border-red-500/20",
  planeado: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const RSVP_STATUS_STYLES: Record<PortalRsvpStatus, string> = {
  confirmado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pendente: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  recusado: "text-red-400 bg-red-500/10 border-red-500/20",
  sem_resposta: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  por_validar: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  validado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  arquivado: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  rejeitado: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const CHECKLIST_STATUS_STYLES: Record<ChecklistStatus, string> = {
  aberta: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  em_curso: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  concluída: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  atrasada: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const CHECKLIST_PRIORITY_STYLES: Record<ChecklistPriority, string> = {
  alta: "text-red-400 bg-red-500/10 border-red-500/20",
  média: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  baixa: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const CONCIERGE_STATUS_STYLES: Record<ConciergeClassificationStatus, string> = {
  por_classificar: "text-brand-gold bg-brand-gold/15 border-brand-gold/20",
  classificado: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  aguardando_validação: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  enviado_para_módulo: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejeitado: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const CONCIERGE_STATUS_LABELS: Record<ConciergeClassificationStatus, string> = {
  por_classificar: "Por classificar",
  classificado: "Classificado",
  aguardando_validação: "Aguardando validação",
  enviado_para_módulo: "Enviado para módulo",
  rejeitado: "Rejeitado",
};
