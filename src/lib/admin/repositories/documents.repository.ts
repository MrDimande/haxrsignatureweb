import type {
  AdminOperationalDocument,
  BusinessId,
  Client,
  DashboardStats,
  DocumentType,
  InvoiceDocument,
  InvoiceFormData,
} from "@/lib/admin/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
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
  saveDocumentNeon,
  updateDocumentStatusNeon,
} from "@/lib/admin/repositories/documents.neon.repository";
import {
  countPortalApprovalsPendingSupabase,
  countPortalClientResponsesSupabase,
  deleteDocumentSupabase,
  findInvoiceBySourceProformaSupabase,
  getDashboardStatsSupabase,
  getDocumentByIdSupabase,
  listDocumentsByEventIdsSupabase,
  listDocumentsForClientSupabase,
  listDocumentsSupabase,
  listOperationalDocumentsSupabase,
  listPortalDocumentsForClientSupabase,
  markClientApprovalPendingSupabase,
  markEmailSentSupabase,
  markPdfGeneratedSupabase,
  markWhatsAppSharedSupabase,
  peekDocumentNumberSupabase,
  recordClientApprovalSupabase,
  reserveDocumentNumberSupabase,
  saveDocumentSupabase,
  updateDocumentStatusSupabase,
} from "@/lib/admin/repositories/documents.supabase.repository";

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
  return shouldUseNeonServerDatabase()
    ? listOperationalDocumentsNeon()
    : listOperationalDocumentsSupabase();
}

export function listDocuments(filters?: DocumentListFilters): Promise<InvoiceDocument[]> {
  return shouldUseNeonServerDatabase()
    ? listDocumentsNeon(filters)
    : listDocumentsSupabase(filters);
}

export function listDocumentsByEventIds(eventIds: string[]): Promise<InvoiceDocument[]> {
  return shouldUseNeonServerDatabase()
    ? listDocumentsByEventIdsNeon(eventIds)
    : listDocumentsByEventIdsSupabase(eventIds);
}

export function listPortalDocumentsForClient(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  return shouldUseNeonServerDatabase()
    ? listPortalDocumentsForClientNeon(client)
    : listPortalDocumentsForClientSupabase(client);
}

export function listDocumentsForClient(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  return shouldUseNeonServerDatabase()
    ? listDocumentsForClientNeon(client)
    : listDocumentsForClientSupabase(client);
}

export function getDocumentById(id: string): Promise<InvoiceDocument | null> {
  return shouldUseNeonServerDatabase()
    ? getDocumentByIdNeon(id)
    : getDocumentByIdSupabase(id);
}

export function peekDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  return shouldUseNeonServerDatabase()
    ? peekDocumentNumberNeon(businessId, documentType)
    : peekDocumentNumberSupabase(businessId, documentType);
}

export function reserveDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  return shouldUseNeonServerDatabase()
    ? reserveDocumentNumberNeon(businessId, documentType)
    : reserveDocumentNumberSupabase(businessId, documentType);
}

export function saveDocument(
  form: InvoiceFormData,
  existingId?: string,
  options?: SaveDocumentOptions,
): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? saveDocumentNeon(form, existingId, options)
    : saveDocumentSupabase(form, existingId, options);
}

export function findInvoiceBySourceProforma(
  proformaId: string,
): Promise<InvoiceDocument | null> {
  return shouldUseNeonServerDatabase()
    ? findInvoiceBySourceProformaNeon(proformaId)
    : findInvoiceBySourceProformaSupabase(proformaId);
}

export function markEmailSent(id: string): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? markEmailSentNeon(id)
    : markEmailSentSupabase(id);
}

export function markWhatsAppShared(id: string): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? markWhatsAppSharedNeon(id)
    : markWhatsAppSharedSupabase(id);
}

export function markClientApprovalPending(id: string): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? markClientApprovalPendingNeon(id)
    : markClientApprovalPendingSupabase(id);
}

export function recordClientApproval(
  id: string,
  status: "approved" | "changes_requested",
  note?: string,
): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? recordClientApprovalNeon(id, status, note)
    : recordClientApprovalSupabase(id, status, note);
}

export function countPortalApprovalsPending(): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? countPortalApprovalsPendingNeon()
    : countPortalApprovalsPendingSupabase();
}

export function countPortalClientResponses(): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? countPortalClientResponsesNeon()
    : countPortalClientResponsesSupabase();
}

export function updateDocumentStatus(
  id: string,
  status: InvoiceDocument["status"],
): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? updateDocumentStatusNeon(id, status)
    : updateDocumentStatusSupabase(id, status);
}

export function markPdfGenerated(id: string): Promise<InvoiceDocument> {
  return shouldUseNeonServerDatabase()
    ? markPdfGeneratedNeon(id)
    : markPdfGeneratedSupabase(id);
}

export function deleteDocument(id: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? deleteDocumentNeon(id)
    : deleteDocumentSupabase(id);
}

export function getDashboardStats(): Promise<DashboardStats> {
  return shouldUseNeonServerDatabase()
    ? getDashboardStatsNeon()
    : getDashboardStatsSupabase();
}
