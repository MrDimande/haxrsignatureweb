"use client";

import { pdf } from "@react-pdf/renderer";
import GuestReportPDF from "@/components/events/GuestReportPDF";
import { eventReportSlug } from "@/lib/events/export/report";
import type { GuestEventReport } from "@/lib/events/export/report";
import { downloadPdf } from "@/lib/pdf";

export async function downloadGuestReportPdf(
  report: GuestEventReport
): Promise<void> {
  const generatedAt = new Date().toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const blob = await pdf(
    <GuestReportPDF report={report} generatedAt={generatedAt} />
  ).toBlob();

  downloadPdf(blob, `haxr-convidados-${eventReportSlug(report.event)}.pdf`);
}
