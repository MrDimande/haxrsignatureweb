import type {
  ConciergeDestination,
  ConciergeIntakeSource,
  ConciergeItemStatus,
  ConciergeItemType,
  ConciergePriority,
} from "./types";

export const CONCIERGE_STATUS_LABELS: Record<ConciergeItemStatus, string> = {
  novo: "Novo",
  por_classificar: "Por classificar",
  classificado: "Classificado",
  aguardando_validacao: "Aguardando validação",
  validado: "Validado",
  enviado_para_modulo: "Enviado para módulo",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

export const CONCIERGE_STATUS_STYLES: Record<ConciergeItemStatus, string> = {
  novo: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  por_classificar: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  classificado: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  aguardando_validacao: "bg-orange-500/20 text-orange-200 border-orange-500/30",
  validado: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  enviado_para_modulo: "bg-brand-gold/20 text-brand-gold border-brand-gold/30",
  rejeitado: "bg-red-500/20 text-red-200 border-red-500/30",
  arquivado: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
};

export const CONCIERGE_SOURCE_LABELS: Record<ConciergeIntakeSource, string> = {
  upload: "Upload",
  manual_note: "Nota manual",
  forwarded_email_future: "Email (futuro)",
  web_clip: "Link guardado",
  whatsapp_future: "WhatsApp (futuro)",
  system: "Sistema",
};

export const CONCIERGE_TYPE_LABELS: Record<ConciergeItemType, string> = {
  proposta: "Proposta",
  contrato: "Contrato",
  recibo: "Recibo",
  comprovativo_pagamento: "Comprovativo",
  lista_convidados: "Lista convidados",
  inspiracao: "Inspiração",
  programa_evento: "Programa",
  nota_operacional: "Nota operacional",
  link_fornecedor: "Link fornecedor",
  produto_ou_presente: "Presente/produto",
  outro: "Outro",
};

export const CONCIERGE_DESTINATION_LABELS: Record<ConciergeDestination, string> = {
  fornecedores: "Fornecedores",
  financeiro: "Financeiro",
  convidados: "Convidados",
  documentos: "Documentos",
  moodboard: "Moodboard",
  checklist: "Checklist",
  contratos: "Contratos",
  rsvp: "RSVP",
  presentes: "Presentes",
  dashboard: "Dashboard",
};

export const CONCIERGE_PRIORITY_LABELS: Record<ConciergePriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export function formatConfidence(value?: number): string {
  if (value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatConciergeDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
