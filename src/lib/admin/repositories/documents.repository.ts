import type {
  AdminOperationalDocument,
  BusinessId,
  Client,
  DashboardStats,
  DocumentType,
  InvoiceDocument,
  InvoiceFormData,
} from "@/lib/admin/types";
import {
  countPortalApprovalsPendingNeon,
  countPortalClientResponsesNeon,
  deleteDocumentNeon,
  findInvoiceBySourceProformaNeon,
  getDashboardStatsNeon,
  getDocumentByIdNeon,
  listDocumentsByEventIdsNeon,
  listDocumentsForClientNeon,
  listDocumentsNeon,
  listOperationalDocumentsNeon,
  listPortalDocumentsForClientNeon,
  markClientApprovalPendingNeon,
  markEmailSentNeon,
  markPdfGeneratedNeon,
  markWhatsAppSharedNeon,
  peekDocumentNumberNeon,
  recordClientApprovalNeon,
  reserveDocumentNumberNeon,
  updateDocumentStatusNeon,
} from "@/lib/admin/repositories/documents.neon.repository";
import { saveDocumentNeon } from "@/lib/admin/repositories/documents.neon.save.repository";

export type SaveDocumentOptions = {
  convertedFromDocumentId?: string;
  createClientIfMissing?: boolean;
};

export type DocumentListFilters = {
  documentType?: DocumentType;
  businessId?: BusinessId;
  status?: InvoiceDocument["status"];
  clientId?: string;
  eventId?: string;
  limit?: number;
};

export function listOperationalDocuments(): Promise<AdminOperationalDocument[]> {
  return listOperationalDocumentsNeon();
}

export function listDocuments(filters?: DocumentListFilters): Promise<InvoiceDocument[]> {
  return listDocumentsNeon(filters);
}

export function listDocumentsByEventIds(eventIds: string[]): Promise<InvoiceDocument[]> {
  return listDocumentsByEventIdsNeon(eventIds);
}

export function listPortalDocumentsForClient(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  return listPortalDocumentsForClientNeon(client);
}

export function listDocumentsForClient(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  return listDocumentsForClientNeon(client);
}

export function getDocumentById(id: string): Promise<InvoiceDocument | null> {
  return getDocumentByIdNeon(id);
}

export function peekDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  return peekDocumentNumberNeon(businessId, documentType);
}

export function reserveDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  return reserveDocumentNumberNeon(businessId, documentType);
}

export function saveDocument(
  form: InvoiceFormData,
  existingId?: string,
  options?: SaveDocumentOptions,
): Promise<InvoiceDocument> {
  return saveDocumentNeon(form, existingId, options);
}

export function findInvoiceBySourceProforma(
  proformaId: string,
): Promise<InvoiceDocument | null> {
  return findInvoiceBySourceProformaNeon(proformaId);
}

export function markEmailSent(id: string): Promise<InvoiceDocument> {
  return markEmailSentNeon(id);
}

export function markWhatsAppShared(id: string): Promise<InvoiceDocument> {
  return markWhatsAppSharedNeon(id);
}

export function markClientApprovalPending(id: string): Promise<InvoiceDocument> {
  return markClientApprovalPendingNeon(id);
}

export function recordClientApproval(
  id: string,
  status: "approved" | "changes_requested",
  note?: string,
): Promise<InvoiceDocument> {
  return recordClientApprovalNeon(id, status, note);
}

export function countPortalApprovalsPending(): Promise<number> {
  return countPortalApprovalsPendingNeon();
}

export function countPortalClientResponses(): Promise<number> {
  return countPortalClientResponsesNeon();
}

export function updateDocumentStatus(
  id: string,
  status: InvoiceDocument["status"],
): Promise<InvoiceDocument> {
  return updateDocumentStatusNeon(id, status);
}

export function markPdfGenerated(id: string): Promise<InvoiceDocument> {
  return markPdfGeneratedNeon(id);
}

export function deleteDocument(id: string): Promise<void> {
  return deleteDocumentNeon(id);
}

export function getDashboardStats(): Promise<DashboardStats> {
  return getDashboardStatsNeon();
}
