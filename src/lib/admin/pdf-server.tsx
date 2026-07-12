import fs from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import InvoicePDFDocument from "@/components/admin/InvoicePDFDocument";
import {
  normalizePdfLogoPath,
  resolvePublicAssetUrl,
} from "@/lib/admin/pdf-assets";
import { getBusiness } from "@/lib/admin/businesses";
import type { Business, InvoiceDocument } from "@/lib/admin/types";

function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function loadLogoDataUrl(logoPath: string): Promise<string | undefined> {
  const normalized = normalizePdfLogoPath(logoPath);
  if (!normalized) return undefined;

  if (normalized.startsWith("data:")) return normalized;

  const relativePath = normalized.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    const origin = getSiteOrigin();
    return resolvePublicAssetUrl(normalized, origin);
  }
}

export async function generateInvoicePDFBuffer(
  invoiceDoc: InvoiceDocument,
  business?: Business
): Promise<Buffer> {
  const resolvedBusiness =
    business ?? getBusiness(invoiceDoc.businessId);
  const logoUrl = await loadLogoDataUrl(resolvedBusiness.logo);

  const element = (
    <InvoicePDFDocument
      document={invoiceDoc}
      business={resolvedBusiness}
      logoUrl={logoUrl}
    />
  ) as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}
