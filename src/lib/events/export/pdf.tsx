"use client";

import { pdf } from "@react-pdf/renderer";
import GuestReportPDF from "@/components/events/GuestReportPDF";
import { eventReportSlug } from "@/lib/events/export/report";
import type { GuestEventReport } from "@/lib/events/export/report";
import { downloadPdf } from "@/lib/pdf";
import { getBusiness } from "@/lib/admin/businesses";
import { resolveDocumentLogoPath } from "@/lib/admin/pdf-assets";

export async function downloadGuestReportPdf(
  report: GuestEventReport
): Promise<void> {
  const business = getBusiness(report.event.businessId || "haxr-signature");
  const logoUrl = resolveDocumentLogoPath(business, "editorial_ivory");

  const blob = await pdf(
    <GuestReportPDF
      report={report}
      logoUrl={logoUrl}
      generatedAt={report.generatedAt}
    />
  ).toBlob();

  downloadPdf(blob, `haxr-convidados-${eventReportSlug(report.event)}.pdf`);
}

