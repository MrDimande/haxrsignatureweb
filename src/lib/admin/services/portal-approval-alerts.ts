import type { InvoiceDocument } from "@/lib/admin/types";
import type { AdminAlert } from "@/lib/admin/services/admin-alerts.service";

type BuildPortalApprovalAlertsInput = {
  documents: InvoiceDocument[];
  relativeTime: (iso: string) => string;
  limit?: number;
};

export function buildPortalApprovalAlerts({
  documents,
  relativeTime,
  limit = 4,
}: BuildPortalApprovalAlertsInput): AdminAlert[] {
  const responseDocuments = documents
    .filter(
      (document) =>
        document.documentType === "proforma" &&
        document.status === "sent" &&
        document.clientApprovedAt &&
        (document.clientApprovalStatus === "approved" ||
          document.clientApprovalStatus === "changes_requested")
    )
    .sort(
      (a, b) =>
        new Date(b.clientApprovedAt ?? 0).getTime() -
        new Date(a.clientApprovedAt ?? 0).getTime()
    )
    .slice(0, limit);

  return responseDocuments.map((document) => {
    if (document.clientApprovalStatus === "approved") {
      return {
        id: `portal-approved-${document.id}`,
        text: `${document.clientName} aprovou a proposta ${document.documentNumber}`,
        time: relativeTime(document.clientApprovedAt!),
        read: false,
        href: `/admin/documents/${document.id}`,
        priority: "high" as const,
      };
    }

    const note = document.clientApprovalNote?.trim();
    return {
      id: `portal-changes-${document.id}`,
      text: note
        ? `${document.clientName} pediu alterações em ${document.documentNumber}: ${note}`
        : `${document.clientName} pediu alterações em ${document.documentNumber}`,
      time: relativeTime(document.clientApprovedAt!),
      read: false,
      href: `/admin/documents/${document.id}`,
      priority: "high" as const,
    };
  });
}

export function countPortalApprovalsPending(
  documents: InvoiceDocument[]
): number {
  return documents.filter(
    (document) =>
      document.documentType === "proforma" &&
      document.status === "sent" &&
      document.clientApprovalStatus === "pending"
  ).length;
}

export function countPortalClientResponses(
  documents: InvoiceDocument[]
): number {
  return documents.filter(
    (document) =>
      document.documentType === "proforma" &&
      document.status === "sent" &&
      (document.clientApprovalStatus === "approved" ||
        document.clientApprovalStatus === "changes_requested")
  ).length;
}
