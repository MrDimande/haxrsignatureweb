import fs from "node:fs/promises";
import path from "node:path";
import React, { type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import GuestReportPDF from "@/components/events/GuestReportPDF";
import { eventReportSlug } from "@/lib/events/export/report";
import type { GuestEventReport } from "@/lib/events/export/report";
import { getBusiness } from "@/lib/admin/businesses";
import {
  normalizePdfLogoPath,
  resolveDocumentLogoPath,
  resolvePublicAssetUrl,
} from "@/lib/admin/pdf-assets";

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

export interface GenerateGuestReportPDFOptions {
  logoUrl?: string;
  coverLogoUrl?: string;
  signatureMarkUrl?: string;
  generatedAt?: string;
}

export async function generateGuestReportPDFBuffer(
  report: GuestEventReport,
  options?: GenerateGuestReportPDFOptions
): Promise<Buffer> {
  const business = getBusiness(report.event.businessId || "haxr-signature");
  const navLogoPath = resolveDocumentLogoPath(business, "editorial_ivory");
  const coverLogoPath = resolveDocumentLogoPath(business, "maison_signature");
  const isHaxr = !business.id.includes("brainy") && business.name.toLowerCase().includes("haxr");
  const sigMarkPath = isHaxr ? "/images/brand/aldimande-signature-gold.png" : undefined;

  const logoUrl = options?.logoUrl ?? (await loadLogoDataUrl(navLogoPath));
  const coverLogoUrl = options?.coverLogoUrl ?? (await loadLogoDataUrl(coverLogoPath));
  const signatureMarkUrl = options?.signatureMarkUrl ?? (sigMarkPath ? await loadLogoDataUrl(sigMarkPath) : undefined);

  const element = (
    <GuestReportPDF
      report={report}
      logoUrl={logoUrl}
      coverLogoUrl={coverLogoUrl}
      signatureMarkUrl={signatureMarkUrl}
      businessName={business.name}
    />
  ) as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

export function guestReportPdfFilename(report: GuestEventReport): string {
  const prefix = report.event.businessId === "brainywrite" ? "brainywrite" : "haxr";
  return `${prefix}-relatorio-${eventReportSlug(report.event)}.pdf`;
}
