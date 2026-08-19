import type { InquiryStatus, ManualInquiryStatus } from "@/lib/contact/types";

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

export const MANUAL_INQUIRY_STATUSES: readonly ManualInquiryStatus[] = [
  "new",
  "contacted",
  "archived",
] as const;

export function isManualInquiryStatus(
  status: string
): status is ManualInquiryStatus {
  return (MANUAL_INQUIRY_STATUSES as readonly string[]).includes(status);
}

export function assertManualInquiryStatus(
  status: string
): asserts status is ManualInquiryStatus {
  if (!isManualInquiryStatus(status)) {
    if (status === "converted") {
      throw new Error(
        "Use o fluxo de conversão para criar o cliente e o evento."
      );
    }
    throw new Error(`Estado de lead inválido: ${status}`);
  }
}

export function assertInquiryCanConvert(inquiry: {
  status: InquiryStatus;
}): void {
  if (inquiry.status === "converted") {
    throw new Error("Este lead já foi convertido.");
  }
}
