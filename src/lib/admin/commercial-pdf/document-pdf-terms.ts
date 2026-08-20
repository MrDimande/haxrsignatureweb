import {
  HAXR_PROFORMA_TERMS,
  HAXR_INVOICE_TERMS,
  HAXR_RECEIPT_TERMS,
  DEFAULT_TERMS_BRAINYWRITE,
} from "@/lib/admin/constants";
import type { DocumentType } from "@/lib/admin/types";

export interface ResolveDocumentTermsOptions {
  documentType: DocumentType;
  businessId: string;
  customTerms?: string[];
  businessTerms?: string[];
}

export function resolveDocumentTerms({
  documentType,
  businessId,
  customTerms,
  businessTerms,
}: ResolveDocumentTermsOptions): string[] {
  if (customTerms && customTerms.length > 0) {
    return customTerms;
  }

  if (businessId === "haxr-signature") {
    switch (documentType) {
      case "proforma":
        return HAXR_PROFORMA_TERMS;
      case "invoice":
        return HAXR_INVOICE_TERMS;
      case "receipt":
        return HAXR_RECEIPT_TERMS;
      default:
        return HAXR_PROFORMA_TERMS;
    }
  }

  if (businessTerms && businessTerms.length > 0) {
    return businessTerms;
  }

  return DEFAULT_TERMS_BRAINYWRITE;
}
