"use client";

import { pdf } from "@react-pdf/renderer";
import FinanceReportPDF from "@/components/admin/finance/FinanceReportPDF";
import { downloadPdf } from "@/lib/pdf";
import type { CashAnalytics } from "@/lib/finance/types";

export async function downloadFinanceReportPdf(
  analytics: CashAnalytics,
  year: number
): Promise<void> {
  const generatedAt = new Date().toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const blob = await pdf(
    <FinanceReportPDF
      analytics={analytics}
      year={year}
      generatedAt={generatedAt}
    />
  ).toBlob();

  downloadPdf(blob, `haxr-financeiro-${year}.pdf`);
}
