import type { ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import GuestReportPDF from "@/components/events/GuestReportPDF";
import { eventReportSlug } from "@/lib/events/export/report";
import type { GuestEventReport } from "@/lib/events/export/report";

export async function generateGuestReportPDFBuffer(
  report: GuestEventReport
): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const element = (
    <GuestReportPDF report={report} generatedAt={generatedAt} />
  ) as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

export function guestReportPdfFilename(report: GuestEventReport): string {
  return `haxr-relatorio-${eventReportSlug(report.event)}.pdf`;
}
