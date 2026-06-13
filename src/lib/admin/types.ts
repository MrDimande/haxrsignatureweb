export type DocumentType = "proforma" | "invoice" | "receipt";

export type DocumentStatus = "draft" | "sent" | "paid" | "cancelled";

export type Currency = "MZN" | "USD" | "ZAR";

export type BusinessId = "haxr-signature" | "brainywrite";

export type ClientType = "individual" | "company";

export type ServiceCategory =
  | "invitations"
  | "event_packages"
  | "addons"
  | "coordination"
  | "media";

export type EventType =
  | "wedding"
  | "birthday"
  | "corporate"
  | "baby_shower"
  | "graduation"
  | "other";

export type ItemSource = "catalog" | "manual";

export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  nib: string;
  swift?: string;
}

export interface MobilePayment {
  provider: string;
  number: string;
  accountName: string;
}

export interface BusinessTheme {
  primaryColor: string;
  accentColor: string;
}

export interface Business {
  id: BusinessId;
  name: string;
  logo: string;
  nuit: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  bankAccounts: BankAccount[];
  mobilePayments: MobilePayment[];
  invoicePrefix: string;
  theme: BusinessTheme;
  termsAndConditions: string[];
  defaultCurrency: Currency;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description?: string;
  basePrice: number;
  businessIds?: BusinessId[];
}

export interface Client {
  id: string;
  fullName: string;
  clientType: ClientType;
  companyName: string;
  nuit: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  source: ItemSource;
  catalogServiceId?: string | null;
}

export interface DocumentTotals {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  includeVat: boolean;
  currency: Currency;
}

export interface EventContext {
  eventType: EventType | null;
  eventName: string;
  eventDate: string | null;
  eventLocation: string;
}

export interface BusinessSignature {
  id: string;
  businessId: BusinessId;
  label: string;
  roleTitle: string;
  imageUrl: string;
  mimeType: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InvoiceDocument {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  businessId: BusinessId;
  status: DocumentStatus;
  currency: Currency;
  clientId: string | null;
  clientType: ClientType;
  clientName: string;
  companyName: string;
  clientNuit: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  event: EventContext;
  issueDate: string;
  expiryDate: string;
  notes: string;
  lineItems: LineItem[];
  totals: DocumentTotals;
  issuerSignatureId: string | null;
  issuerName: string;
  issuerRole: string;
  issuerSignatureImage: string;
  createdAt: string;
  updatedAt: string;
  pdfGeneratedAt: string | null;
}

export type ClientFormData = Omit<Client, "id" | "createdAt" | "updatedAt">;

export type InvoiceFormData = {
  documentType: DocumentType;
  documentNumber: string;
  businessId: BusinessId;
  status: DocumentStatus;
  currency: Currency;
  clientId: string | null;
  clientType: ClientType;
  clientName: string;
  companyName: string;
  clientNuit: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  eventType: EventType | null;
  eventName: string;
  eventDate: string | null;
  eventLocation: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  lineItems: LineItem[];
  includeVat: boolean;
  issuerSignatureId: string | null;
  issuerName: string;
  issuerRole: string;
  issuerSignatureImage: string;
};

export type UploadSignatureInput = {
  businessId: BusinessId;
  label: string;
  roleTitle: string;
  imageDataUrl: string;
  setAsDefault?: boolean;
};

export interface DashboardStats {
  totalProformas: number;
  totalInvoices: number;
  totalReceipts: number;
  totalDraft: number;
  totalPaid: number;
  recentDocuments: InvoiceDocument[];
}

export interface AdminProfile {
  email: string;
  name: string;
}
