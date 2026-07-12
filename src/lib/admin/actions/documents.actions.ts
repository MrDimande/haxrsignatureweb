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
  existingId?: string,
  options?: documentsRepo.SaveDocumentOptions
) {
  const result = await runAction(() =>
    documentsRepo.saveDocument(form, existingId, options)
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

export async function updateDocumentStatusAction(
  id: string,
  status: InvoiceDocument["status"]
) {
  const result = await runAction(() =>
    documentsRepo.updateDocumentStatus(id, status)
  );
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${id}`);
    revalidatePath("/admin/cash");
  }
  return result;
}

export async function sendDocumentEmailAction(id: string) {
  const result = await runAction(async () => {
    const { sendDocumentByEmail } = await import(
      "@/lib/admin/services/send-document.service"
    );
    return sendDocumentByEmail(id);
  });
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${id}`);
    revalidatePath("/admin/cash");
  }
  return result;
}

export async function convertProformaToInvoiceAction(proformaId: string) {
  const result = await runAction(async () => {
    const { convertProformaToInvoice } = await import(
      "@/lib/admin/services/convert-proforma.service"
    );
    return convertProformaToInvoice(proformaId);
  });
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/cash");
    revalidatePath(`/admin/documents/${result.data.id}`);
    revalidatePath(`/admin/documents/${proformaId}`);
  }
  return result;
}

export async function sendPaymentReminderAction(documentId: string) {
  const result = await runAction(async () => {
    const { sendPaymentReminder } = await import(
      "@/lib/admin/services/send-payment-reminder.service"
    );
    return sendPaymentReminder(documentId);
  });
  if (result.success) {
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${documentId}`);
    revalidatePath("/admin/cash");
  }
  return result;
}

export async function markWhatsAppSharedAction(id: string) {
  const result = await runAction(() => documentsRepo.markWhatsAppShared(id));
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
