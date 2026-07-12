import type { DashboardData } from "@/lib/dashboard/types";
import {
  mapDbDocumentStatusToUiStatus,
  mapRpcPayloadToDocumentModuleData,
} from "@/lib/documents/client-event-documents-service";
import type {
  ClientEventDocumentsRpcItemRow,
  ClientEventDocumentsRpcPayload,
} from "@/lib/documents/client-event-documents-rpc";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";

/** Document KPIs shared by the documents module and client dashboard. */
export type ClientEventDashboardDocumentMetrics = {
  documentsTotal: number;
  pendingReviewCount: number;
  approvedCount: number;
  documentSnapshot: DashboardData["documentSnapshot"];
};

function formatSnapshotDate(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapItemToSnapshotItem(
  row: ClientEventDocumentsRpcItemRow,
): DashboardData["documentSnapshot"][number] {
  return {
    id: row.id,
    title: row.title || row.file_name,
    source: row.source,
    status: mapDbDocumentStatusToUiStatus(row.status),
    uploadedLabel: formatSnapshotDate(row.created_at),
  };
}

export function mapRpcPayloadToDashboardDocumentMetrics(
  event: ClientEventRow,
  payload: ClientEventDocumentsRpcPayload,
): ClientEventDashboardDocumentMetrics {
  const moduleData = mapRpcPayloadToDocumentModuleData(event, payload);
  const snapshot = payload.items.slice(0, 5).map(mapItemToSnapshotItem);

  return {
    documentsTotal: payload.summary.totalItems || moduleData.documents.length,
    pendingReviewCount: payload.summary.pendingReviewCount,
    approvedCount: payload.summary.approvedCount,
    documentSnapshot: snapshot,
  };
}
