"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import type {
  BusinessId,
  DashboardStats,
  DocumentType,
  InvoiceDocument,
  InvoiceFormData,
} from "@/lib/admin/types";

export async function getDocumentsAction(filters?: {
  documentType?: DocumentType;
}) {
  return runAction(() => documentsRepo.listDocuments(filters));
}

export async function getDocumentAction(id: string) {
  return runAction(() => documentsRepo.getDocumentById(id));
}

export async function getDashboardStatsAction() {
  return runAction(() => documentsRepo.getDashboardStats());
}

export async function peekDocumentNumberAction(
  businessId: BusinessId,
  documentType: DocumentType
) {
  return runAction(() =>
    documentsRepo.peekDocumentNumber(businessId, documentType)
  );
}

export async function saveDocumentAction(
  form: InvoiceFormData,
  existingId?: string
) {
  const result = await runAction(() =>
    documentsRepo.saveDocument(form, existingId)
  );
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/cash");
    if (result.data.id) {
      revalidatePath(`/admin/documents/${result.data.id}`);
    }
  }
  return result;
}

export async function markPdfGeneratedAction(id: string) {
  const result = await runAction(() => documentsRepo.markPdfGenerated(id));
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${id}`);
  }
  return result;
}

export async function deleteDocumentAction(id: string) {
  const result = await runAction(() => documentsRepo.deleteDocument(id));
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/cash");
  }
  return result;
}

export type { InvoiceDocument, DashboardStats };
