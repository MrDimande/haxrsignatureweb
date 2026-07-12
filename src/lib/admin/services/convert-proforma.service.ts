import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { documentToForm, getDefaultIssueDate, getDefaultExpiryDate } from "@/lib/invoice-generator";
import type { DocumentStatus, InvoiceDocument, InvoiceFormData } from "@/lib/admin/types";

export type ConvertProformaOptions = {
  status?: DocumentStatus;
};

export async function convertProformaToInvoice(
  proformaId: string,
  options?: ConvertProformaOptions
): Promise<InvoiceDocument> {
  const source = await documentsRepo.getDocumentById(proformaId);
  if (!source) {
    throw new Error("Proforma não encontrada.");
  }
  if (source.documentType !== "proforma") {
    throw new Error("Apenas proformas podem ser convertidas em factura.");
  }

  const existing = await documentsRepo.findInvoiceBySourceProforma(proformaId);
  if (existing) {
    return existing;
  }

  const base = documentToForm(source);
  const form: InvoiceFormData = {
    ...base,
    documentType: "invoice",
    documentNumber: "",
    status: options?.status ?? "draft",
    issueDate: getDefaultIssueDate(),
    expiryDate: getDefaultExpiryDate(),
    notes: [base.notes, `Convertido da proforma ${source.documentNumber}.`]
      .filter(Boolean)
      .join("\n"),
  };

  return documentsRepo.saveDocument(form, undefined, {
    convertedFromDocumentId: source.id,
  });
}
