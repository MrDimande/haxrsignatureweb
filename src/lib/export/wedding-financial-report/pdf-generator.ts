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

/**
 * Gera um Buffer Node.js contendo o documento PDF oficial.
 */
export async function generateWeddingFinancialReportBuffer(
  ledger: NormalizedEventFinancialLedger,
  options?: WeddingFinancialReportOptions,
): Promise<Buffer> {
  const element = React.createElement(WeddingFinancialReportDocument, {
    ledger,
    options,
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

