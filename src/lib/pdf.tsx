"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import { getBusiness } from "@/lib/admin/businesses";
import {
  resolvePdfLogoUrl,
  resolveDocumentLogoPath,
  getPdfFilename,
} from "@/lib/admin/pdf-assets";
import type { Business, InvoiceDocument } from "@/lib/admin/types";
import InvoicePDFDocument from "@/components/admin/InvoicePDFDocument";

export async function generateInvoicePDF(
  invoiceDoc: InvoiceDocument,
  business?: Business
): Promise<Blob> {
  const resolvedBusiness =
    business ?? getBusiness(invoiceDoc.businessId);
  const logoPath = resolveDocumentLogoPath(
    resolvedBusiness,
    invoiceDoc.pdfTemplate
  );
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const logoUrl = origin
    ? resolvePdfLogoUrl(logoPath, origin)
    : undefined;

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
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { getPdfFilename } from "@/lib/admin/pdf-assets";

export async function downloadInvoicePDF(
  invoiceDocument: InvoiceDocument,
  business?: Business
): Promise<void> {
  const blob = await generateInvoicePDF(invoiceDocument, business);
  downloadPdf(blob, getPdfFilename(invoiceDocument));
}
