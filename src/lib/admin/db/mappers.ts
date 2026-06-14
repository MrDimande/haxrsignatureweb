import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type {
  Business,
  BusinessId,
  BusinessTheme,
  Client,
  ClientType,
  Currency,
  DocumentStatus,
  DocumentType,
  EventType,
  InvoiceDocument,
  ItemSource,
  LineItem,
  ServiceCatalogItem,
  ServiceCategory,
  BusinessSignature,
} from "@/lib/admin/types";
import { toSignatureDataUrl } from "@/lib/admin/signatures";

type BusinessRow = Tables<"businesses">;
type BankRow = Tables<"business_bank_accounts">;
type MobileRow = Tables<"business_mobile_payments">;
type ClientRow = Tables<"clients">;
type DocumentRow = Tables<"documents">;
type LineItemRow = Tables<"document_line_items">;
type CatalogRow = Tables<"service_catalog">;
type SignatureRow = Tables<"business_signatures">;

export function mapBusiness(
  row: BusinessRow,
  banks: BankRow[],
  mobiles: MobileRow[]
): Business {
  const theme = (row.theme ?? {}) as unknown as Partial<BusinessTheme>;
  const terms = (row.terms_and_conditions ?? []) as unknown as string[];

  return {
    id: row.id as BusinessId,
    name: row.name,
    logo: row.logo ?? "",
    nuit: row.nuit ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    whatsapp: row.whatsapp ?? "",
    address: row.address ?? "",
    invoicePrefix: row.invoice_prefix,
    defaultCurrency: row.default_currency as Currency,
    theme: {
      primaryColor: theme.primaryColor ?? "#C9A227",
      accentColor: theme.accentColor ?? "#c9a96e",
    },
    termsAndConditions: Array.isArray(terms) ? terms : [],
    bankAccounts: banks.map((b) => ({
      bankName: b.bank_name,
      accountName: b.account_name,
      accountNumber: b.account_number,
      nib: b.nib,
      swift: b.swift ?? undefined,
    })),
    mobilePayments: mobiles.map((m) => ({
      provider: m.provider,
      number: m.number,
      accountName: m.account_name,
    })),
  };
}

export function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    fullName: row.client_name,
    clientType: row.client_type as ClientType,
    companyName: row.company_name,
    nuit: row.nuit,
    email: row.email,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLineItem(row: LineItemRow): LineItem {
  return {
    id: row.id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    source: row.item_source as ItemSource,
    catalogServiceId: row.catalog_service_id,
  };
}

export function mapDocument(
  row: DocumentRow,
  lineItems: LineItemRow[]
): InvoiceDocument {
  return {
    id: row.id,
    documentType: row.document_type as DocumentType,
    documentNumber: row.document_number,
    businessId: row.business_id as BusinessId,
    status: row.status as DocumentStatus,
    currency: row.currency as Currency,
    clientId: row.client_id,
    clientType: row.client_type as ClientType,
    clientName: row.client_name,
    companyName: row.company_name,
    clientNuit: row.client_nuit,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientAddress: row.client_address,
    event: {
      eventId: row.event_id ?? null,
      eventType: (row.event_type as EventType | null) ?? null,
      eventName: row.event_name,
      eventDate: row.event_date,
      eventLocation: row.event_location,
    },
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    notes: row.notes,
    lineItems: lineItems
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapLineItem),
    totals: {
      subtotal: Number(row.subtotal),
      vatRate: Number(row.vat_rate),
      vatAmount: Number(row.vat_amount),
      grandTotal: Number(row.grand_total),
      includeVat: row.include_vat,
      currency: row.currency as Currency,
    },
    issuerSignatureId: row.issuer_signature_id,
    issuerName: row.issuer_name,
    issuerRole: row.issuer_role,
    issuerSignatureImage: row.issuer_signature_image ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pdfGeneratedAt: row.pdf_generated_at,
  };
}

export function mapCatalogItem(row: CatalogRow): ServiceCatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ServiceCategory,
    description: row.description ?? undefined,
    basePrice: Number(row.price),
    businessIds: row.business_id ? [row.business_id as BusinessId] : undefined,
  };
}

export function mapSignature(row: SignatureRow): BusinessSignature {
  return {
    id: row.id,
    businessId: row.business_id as BusinessId,
    label: row.label,
    roleTitle: row.role_title,
    imageUrl: toSignatureDataUrl(row.image_data, row.mime_type),
    mimeType: row.mime_type,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function clientToDbInsert(
  data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  id?: string
): TablesInsert<"clients"> {
  return {
    id,
    client_name: data.fullName,
    client_type: data.clientType,
    company_name: data.companyName,
    nuit: data.nuit,
    email: data.email,
    phone: data.phone,
    address: data.address,
  };
}
