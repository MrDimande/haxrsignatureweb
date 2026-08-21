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
  generatedAt?: string;
}

export async function generateGuestReportPDFBuffer(
  report: GuestEventReport,
  options?: GenerateGuestReportPDFOptions
): Promise<Buffer> {
  const business = getBusiness(report.event.businessId || "haxr-signature");
  const defaultLogoPath = resolveDocumentLogoPath(business, "editorial_ivory");
  const logoUrl = options?.logoUrl ?? (await loadLogoDataUrl(defaultLogoPath));

  const element = (
    <GuestReportPDF
      report={report}
      logoUrl={logoUrl}
      generatedAt={options?.generatedAt || report.generatedAt}
    />
  ) as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

export function guestReportPdfFilename(report: GuestEventReport): string {
  return `haxr-relatorio-${eventReportSlug(report.event)}.pdf`;
}

