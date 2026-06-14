import { calculateLineItems, calculateTotals } from "@/lib/calculations";
import { getBusiness } from "@/lib/admin/businesses";
import { DOCUMENT_PREFIX } from "@/lib/admin/constants";
import type {
  BusinessId,
  BusinessSignature,
  Client,
  ClientFormData,
  ClientType,
  Currency,
  DocumentType,
  InvoiceDocument,
  InvoiceFormData,
  LineItem,
} from "@/lib/admin/types";

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLineItem(): LineItem {
  return {
    id: createId(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
    source: "manual",
  };
}

export function getDefaultIssueDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultExpiryDate(days = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generateDocumentNumber(
  documentType: DocumentType,
  businessId: BusinessId,
  existingDocuments: InvoiceDocument[]
): string {
  const year = new Date().getFullYear();
  const business = getBusiness(businessId);
  const typePrefix = DOCUMENT_PREFIX[documentType];
  const businessPrefix = business.invoicePrefix
    ? `${business.invoicePrefix}-`
    : "";

  const sameScope = existingDocuments.filter(
    (doc) =>
      doc.documentType === documentType &&
      doc.businessId === businessId &&
      doc.documentNumber.includes(String(year))
  );

  const sequence = String(sameScope.length + 1).padStart(4, "0");
  return `${businessPrefix}${typePrefix}-${year}-${sequence}`;
}

export function createDefaultInvoiceForm(
  documentType: DocumentType,
  existingDocuments: InvoiceDocument[] = [],
  businessId: BusinessId = "haxr-signature"
): InvoiceFormData {
  const business = getBusiness(businessId);

  return {
    documentType,
    documentNumber: generateDocumentNumber(
      documentType,
      businessId,
      existingDocuments
    ),
    businessId,
    status: documentType === "receipt" ? "paid" : "draft",
    currency: business.defaultCurrency,
    clientId: null,
    clientType: "individual",
    clientName: "",
    companyName: "",
    clientNuit: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    eventId: null,
    eventType: null,
    eventName: "",
    eventDate: null,
    eventLocation: "",
    issueDate: getDefaultIssueDate(),
    expiryDate: getDefaultExpiryDate(),
    notes: "",
    lineItems: [createEmptyLineItem()],
    includeVat: true,
    issuerSignatureId: null,
    issuerName: "",
    issuerRole: "",
    issuerSignatureImage: "",
  };
}

export function getDefaultSignatureForBusiness(
  signatures: BusinessSignature[],
  businessId: BusinessId
): BusinessSignature | undefined {
  const businessSignatures = signatures.filter((sig) => sig.businessId === businessId);
  return (
    businessSignatures.find((sig) => sig.isDefault) ?? businessSignatures[0]
  );
}

export function signatureToFormFields(
  signature: BusinessSignature
): Pick<
  InvoiceFormData,
  "issuerSignatureId" | "issuerName" | "issuerRole" | "issuerSignatureImage"
> {
  return {
    issuerSignatureId: signature.id,
    issuerName: signature.label,
    issuerRole: signature.roleTitle,
    issuerSignatureImage: signature.imageUrl,
  };
}

export function buildClient(data: ClientFormData, existing?: Client): Client {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId(),
    ...data,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function buildInvoiceDocument(
  form: InvoiceFormData,
  existing?: InvoiceDocument
): InvoiceDocument {
  const lineItems = calculateLineItems(form.lineItems);
  const totals = calculateTotals(lineItems, form.includeVat, form.currency);
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? createId(),
    documentType: form.documentType,
    documentNumber: form.documentNumber,
    businessId: form.businessId,
    status: form.status,
    currency: form.currency,
    clientId: form.clientId,
    clientType: form.clientType,
    clientName: form.clientName.trim(),
    companyName: form.companyName.trim(),
    clientNuit: form.clientNuit.trim(),
    clientEmail: form.clientEmail.trim(),
    clientPhone: form.clientPhone.trim(),
    clientAddress: form.clientAddress.trim(),
    event: {
      eventId: form.eventId,
      eventType: form.eventType,
      eventName: form.eventName.trim(),
      eventDate: form.eventDate,
      eventLocation: form.eventLocation.trim(),
    },
    issueDate: form.issueDate,
    expiryDate: form.expiryDate,
    notes: form.notes.trim(),
    lineItems,
    totals,
    issuerSignatureId: form.issuerSignatureId,
    issuerName: form.issuerName.trim(),
    issuerRole: form.issuerRole.trim(),
    issuerSignatureImage: form.issuerSignatureImage,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pdfGeneratedAt: existing?.pdfGeneratedAt ?? null,
  };
}

export function documentToForm(document: InvoiceDocument): InvoiceFormData {
  return {
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    businessId: document.businessId,
    status: document.status,
    currency: document.currency,
    clientId: document.clientId,
    clientType: document.clientType,
    clientName: document.clientName,
    companyName: document.companyName,
    clientNuit: document.clientNuit,
    clientEmail: document.clientEmail,
    clientPhone: document.clientPhone,
    clientAddress: document.clientAddress,
    eventId: document.event.eventId,
    eventType: document.event.eventType,
    eventName: document.event.eventName,
    eventDate: document.event.eventDate,
    eventLocation: document.event.eventLocation,
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    notes: document.notes,
    lineItems: document.lineItems.length
      ? document.lineItems
      : [createEmptyLineItem()],
    includeVat: document.totals.includeVat,
    issuerSignatureId: document.issuerSignatureId,
    issuerName: document.issuerName,
    issuerRole: document.issuerRole,
    issuerSignatureImage: document.issuerSignatureImage,
  };
}

export function clientToInvoiceFields(client: Client): Pick<
  InvoiceFormData,
  | "clientId"
  | "clientType"
  | "clientName"
  | "companyName"
  | "clientNuit"
  | "clientEmail"
  | "clientPhone"
  | "clientAddress"
> {
  return {
    clientId: client.id,
    clientType: client.clientType,
    clientName: client.fullName,
    companyName: client.companyName,
    clientNuit: client.nuit,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientAddress: client.address,
  };
}

export function managedEventToInvoiceFields(
  event: import("@/lib/events/types").ManagedEvent,
  client?: Client | null
): Pick<
  InvoiceFormData,
  | "eventId"
  | "eventType"
  | "eventName"
  | "eventDate"
  | "eventLocation"
  | "clientId"
  | "clientType"
  | "clientName"
  | "companyName"
  | "clientNuit"
  | "clientEmail"
  | "clientPhone"
  | "clientAddress"
> {
  const clientFields = client ? clientToInvoiceFields(client) : {
    clientId: event.clientId,
    clientType: "individual" as const,
    clientName: event.clientName ?? "",
    companyName: "",
    clientNuit: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
  };

  return {
    eventId: event.id,
    eventType: event.type,
    eventName: event.name,
    eventDate: event.date,
    eventLocation: event.location,
    ...clientFields,
  };
}

export function markPdfGenerated(document: InvoiceDocument): InvoiceDocument {
  return {
    ...document,
    pdfGeneratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getCurrencyForBusiness(businessId: BusinessId): Currency {
  return getBusiness(businessId).defaultCurrency;
}

export function resolveClientType(
  clientType: ClientType,
  companyName: string
): ClientType {
  if (clientType === "company") return "company";
  return companyName.trim() ? "company" : "individual";
}
