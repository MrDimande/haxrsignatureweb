import type { InquiryStatus } from "@/lib/contact/types";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Novo",
  contacted: "Contactado",
  converted: "Convertido",
  archived: "Arquivado",
};

export const INQUIRY_STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-admin-gold/15 text-admin-gold border-admin-gold/30",
  contacted: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  converted: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  archived: "bg-grey/10 text-grey/60 border-grey/20",
};
