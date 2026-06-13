"use client";

import { pdf } from "@react-pdf/renderer";
import { getBusiness } from "@/lib/admin/businesses";
import type { Business } from "@/lib/admin/types";
import type { InvoiceDocument } from "@/lib/admin/types";
import InvoicePDFDocument from "@/components/admin/InvoicePDFDocument";

export async function generateInvoicePDF(
  invoiceDoc: InvoiceDocument,
  business?: Business
): Promise<Blob> {
  const resolvedBusiness =
    business ?? getBusiness(invoiceDoc.businessId);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const logoUrl = `${origin}${resolvedBusiness.logo}`;

  return pdf(
    <InvoicePDFDocument
      document={invoiceDoc}
      business={resolvedBusiness}
      logoUrl={logoUrl}
    />
  ).toBlob();
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getPdfFilename(invoiceDoc: InvoiceDocument): string {
  return `${invoiceDoc.documentNumber.replace(/\//g, "-")}.pdf`;
}

export async function downloadInvoicePDF(
  invoiceDocument: InvoiceDocument,
  business?: Business
): Promise<void> {
  const blob = await generateInvoicePDF(invoiceDocument, business);
  downloadPdf(blob, getPdfFilename(invoiceDocument));
}
