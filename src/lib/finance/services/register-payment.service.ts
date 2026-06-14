import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import {
  createEmptyLineItem,
  getDefaultExpiryDate,
  getDefaultSignatureForBusiness,
  signatureToFormFields,
} from "@/lib/invoice-generator";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type { InvoiceFormData } from "@/lib/admin/types";
import type { RegisterPaymentInput, RegisterPaymentResult } from "@/lib/finance/types";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function registerPayment(
  input: RegisterPaymentInput
): Promise<RegisterPaymentResult> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Indique um valor de pagamento válido.");
  }

  const sourceDocument = input.sourceDocumentId
    ? await documentsRepo.getDocumentById(input.sourceDocumentId)
    : null;

  if (sourceDocument && sourceDocument.status === "paid") {
    throw new Error("Este documento já está marcado como pago.");
  }

  const clientName =
    input.clientName?.trim() ||
    sourceDocument?.clientName ||
    "Cliente";

  const clientId = input.clientId ?? sourceDocument?.clientId ?? null;
  const eventId = input.eventId ?? null;

  let receipt = null;
  let receiptNumber: string | null = null;

  if (input.generateReceipt !== false) {
    const signatures = await signaturesRepo.listSignatures();
    const defaultSignature = getDefaultSignatureForBusiness(
      signatures,
      input.businessId
    );

    const description = sourceDocument
      ? `Pagamento referente a ${sourceDocument.documentNumber}`
      : "Pagamento registado na caixa";

    const lineItem = {
      ...createEmptyLineItem(),
      description,
      quantity: 1,
      unitPrice: input.amount,
      total: input.amount,
    };

    const receiptForm: InvoiceFormData = {
      documentType: "receipt",
      documentNumber: "",
      businessId: input.businessId,
      status: "paid",
      currency: input.currency,
      clientId,
      clientType: sourceDocument?.clientType ?? "individual",
      clientName,
      companyName: sourceDocument?.companyName ?? "",
      clientNuit: sourceDocument?.clientNuit ?? "",
      clientEmail: sourceDocument?.clientEmail ?? "",
      clientPhone: sourceDocument?.clientPhone ?? "",
      clientAddress: sourceDocument?.clientAddress ?? "",
      eventId: sourceDocument?.event.eventId ?? input.eventId ?? null,
      eventType: sourceDocument?.event.eventType ?? null,
      eventName: sourceDocument?.event.eventName ?? "",
      eventDate: sourceDocument?.event.eventDate ?? null,
      eventLocation: sourceDocument?.event.eventLocation ?? "",
      issueDate: (input.paidAt ?? new Date().toISOString()).slice(0, 10),
      expiryDate: getDefaultExpiryDate(),
      notes: [
        input.notes?.trim(),
        input.reference?.trim()
          ? `Referência: ${input.reference.trim()}`
          : null,
        `Método: ${PAYMENT_METHOD_LABELS[input.paymentMethod]}`,
      ]
        .filter(Boolean)
        .join("\n"),
      lineItems: [lineItem],
      includeVat: false,
      issuerSignatureId: null,
      issuerName: "",
      issuerRole: "",
      issuerSignatureImage: "",
      ...(defaultSignature ? signatureToFormFields(defaultSignature) : {}),
    };

    receipt = await documentsRepo.saveDocument(receiptForm);
    receiptNumber = receipt.documentNumber;
  }

  const payment = await paymentsRepo.createPayment({
    ...input,
    clientId,
    clientName,
    documentId: receipt?.id ?? null,
    documentNumber: receiptNumber,
    sourceDocumentNumber: sourceDocument?.documentNumber ?? null,
  });

  let sourceFullyPaid = false;

  if (sourceDocument) {
    const totalPaid = await paymentsRepo.sumPaymentsForSourceDocument(
      sourceDocument.id
    );
    sourceFullyPaid = totalPaid >= round(sourceDocument.totals.grandTotal);

    if (sourceFullyPaid) {
      await documentsRepo.updateDocumentStatus(sourceDocument.id, "paid");
    }
  }

  return {
    payment,
    receipt,
    sourceFullyPaid,
  };
}
