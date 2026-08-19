import type { AdminOperationalDocument, InvoiceDocument } from "@/lib/admin/types";
import type { AdminAlert } from "@/lib/admin/services/admin-alerts.service";

type BuildPortalApprovalAlertsInput = {
  documents: readonly AdminOperationalDocument[];
  relativeTime: (iso: string) => string;
  limit?: number;
};

export function buildPortalApprovalAlerts({
  documents,
  relativeTime,
  limit,
}: BuildPortalApprovalAlertsInput): AdminAlert[] {
  const convertedProformaIds = new Set(
    documents
      .filter((d) => d.convertedFromDocumentId)
      .map((d) => d.convertedFromDocumentId!)
  );

  const sortedDocuments = documents
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
    );

  const responseDocuments =
    typeof limit === "number" ? sortedDocuments.slice(0, limit) : sortedDocuments;

  return responseDocuments.map((document) => {
    if (document.clientApprovalStatus === "approved") {
      const isConverted = convertedProformaIds.has(document.id);
      return {
        id: `portal-approved-${document.id}`,
        text: `${document.clientName} aprovou a proposta ${document.documentNumber}`,
        time: relativeTime(document.clientApprovedAt!),
        read: false,
        href: `/admin/documents/${document.id}`,
        priority: "high" as const,
        source: "portal" as const,
        requiresAction: !isConverted,
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
      source: "portal" as const,
      requiresAction: true,
    };
  });
}

export function countPortalApprovalsPending(
  documents: readonly AdminOperationalDocument[]
): number {
  return documents.filter(
    (document) =>
      document.documentType === "proforma" &&
      document.status === "sent" &&
      document.clientApprovalStatus === "pending"
  ).length;
}

export function countPortalClientResponses(
  documents: readonly AdminOperationalDocument[]
): number {
  return documents.filter(
    (document) =>
      document.documentType === "proforma" &&
      document.status === "sent" &&
      (document.clientApprovalStatus === "approved" ||
        document.clientApprovalStatus === "changes_requested")
  ).length;
}
