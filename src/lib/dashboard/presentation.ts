import type { VendorContractStatus } from "@/lib/dashboard/types";

export const VENDOR_STATUS_STYLES: Record<VendorContractStatus, string> = {
  "Em revisão": "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  Pendente: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Assinado: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Aguardando: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const ACTION_PRIORITY_STYLES: Record<string, string> = {
  Alta: "bg-red-500/10 text-red-400 border border-red-500/20",
  Média: "bg-brand-gold/15 text-brand-gold border border-brand-gold/20",
  Baixa: "bg-zinc-400/10 text-zinc-400 border border-zinc-400/20",
};
