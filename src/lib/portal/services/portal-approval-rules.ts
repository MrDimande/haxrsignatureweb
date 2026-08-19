import type { ClientApprovalStatus, InvoiceDocument } from "@/lib/admin/types";

export type PortalApprovalDocumentInput = Pick<
  InvoiceDocument,
  "documentType" | "status" | "clientApprovalStatus"
>;

export function isPortalApprovalPending(
  document: PortalApprovalDocumentInput
): boolean {
  if (document.documentType !== "proforma") return false;
  if (document.status !== "sent") return false;
  if (document.clientApprovalStatus === "approved") return false;
  if (document.clientApprovalStatus === "changes_requested") return false;
  return true;
}

export function canPortalApproveDocument(
  document: PortalApprovalDocumentInput
): boolean {
  return isPortalApprovalPending(document);
}

export function portalApprovalLabel(
  status: ClientApprovalStatus | null
): string {
  switch (status) {
    case "pending":
      return "Aguarda aprovação";
    case "approved":
      return "Aprovada";
    case "changes_requested":
      return "Alterações pedidas";
    default:
      return "Sem aprovação";
  }
}
