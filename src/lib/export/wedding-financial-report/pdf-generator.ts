import React, { type ReactElement } from "react";
import {
  pdf,
  renderToBuffer,
  renderToStream,
  type DocumentProps,
} from "@react-pdf/renderer";
import type {
  NormalizedEventFinancialLedger,
  WeddingFinancialReportOptions,
} from "./report-types";
import { WeddingFinancialReportDocument } from "./WeddingFinancialReportDocument";

import path from "node:path";
import fs from "node:fs";

function resolveOfficialLogoSrc(explicitLogo?: string): string | undefined {
  if (explicitLogo) return explicitLogo;
  try {
    const defaultLogoPath = path.join(process.cwd(), "public", "images", "brand", "logo-horizontal-gold.png");
    if (fs.existsSync(defaultLogoPath)) {
      const buffer = fs.readFileSync(defaultLogoPath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch {
    // Non-node or restricted environment fallback
  }
  return undefined;
}

/**
 * Gera um Buffer Node.js contendo o documento PDF oficial.
 */
export async function generateWeddingFinancialReportBuffer(
  ledger: NormalizedEventFinancialLedger,
  options?: WeddingFinancialReportOptions,
): Promise<Buffer> {
  const resolvedOptions: WeddingFinancialReportOptions = {
    ...options,
    logoSrc: resolveOfficialLogoSrc(options?.logoSrc),
  };

  const element = React.createElement(WeddingFinancialReportDocument, {
    ledger,
    options: resolvedOptions,
  }) as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

/**
 * Gera um Stream Node.js contendo o documento PDF oficial.
 */
export async function generateWeddingFinancialReportStream(
  ledger: NormalizedEventFinancialLedger,
  options?: WeddingFinancialReportOptions,
): Promise<NodeJS.ReadableStream> {
  const element = React.createElement(WeddingFinancialReportDocument, {
    ledger,
    options,
  }) as ReactElement<DocumentProps>;

  return renderToStream(element);
}

/**
 * Gera um Blob no browser contendo o documento PDF oficial.
 */
export async function generateWeddingFinancialReportBlob(
  ledger: NormalizedEventFinancialLedger,
  options?: WeddingFinancialReportOptions,
): Promise<Blob> {
  const element = React.createElement(WeddingFinancialReportDocument, {
    ledger,
    options,
  }) as ReactElement<DocumentProps>;

  return pdf(element).toBlob();
}

