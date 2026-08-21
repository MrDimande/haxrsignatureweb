import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { buildPostEventReportSummary } from "@/lib/admin/services/event-whatsapp-shortcuts.service";
import type { Client, Currency } from "@/lib/admin/types";
import { buildBrandEmailHtml } from "@/lib/email/brand-shell";
import { isResendConfigured, sendHaxrEmail } from "@/lib/email/resend";
import {
  buildGuestEventReport,
  eventReportHeader,
} from "@/lib/events/export/report";
import {
  generateGuestReportPDFBuffer,
  guestReportPdfFilename,
} from "@/lib/events/export/pdf-server";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import type { ManagedEvent } from "@/lib/events/types";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import { portalPath } from "@/lib/portal/portal-routes";

export type PostEventReportBatchResult = {
  scanned: number;
  sent: number;
  skipped: number;
  errors: Array<{ eventId: string; error: string }>;
};

function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function eventFinancialTotals(
  clientId: string,
  eventId: string,
  documents: Awaited<ReturnType<typeof documentsRepo.listDocumentsForClient>>,
  payments: Awaited<ReturnType<typeof paymentsRepo.listPaymentsByClientId>>,
  fallbackCurrency: Currency
): { invoiced: number; received: number; currency: Currency } {
  const eventDocs = documents.filter((doc) => doc.event.eventId === eventId);
  const currency = eventDocs[0]?.totals.currency ?? fallbackCurrency;
  const invoiced = eventDocs
    .filter((doc) => doc.documentType === "invoice" || doc.documentType === "proforma")
    .reduce((sum, doc) => sum + doc.totals.grandTotal, 0);
  const received = payments
    .filter((payment) => payment.eventId === eventId)
    .reduce((sum, payment) => sum + payment.amount, 0);

  return { invoiced, received, currency };
}

function buildPostEventReportEmailHtml(input: {
  client: Client;
  event: ManagedEvent;
  summaryLines: string[];
  portalUrl: string | null;
}): string {
  const rows = input.summaryLines
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;"><tr>
        <td style="padding:8px 0;border-bottom:1px solid #2a2418;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8478;vertical-align:top;width:42%;">${label}</td>
        <td style="padding:8px 0 8px 12px;border-bottom:1px solid #2a2418;color:#e8e4dc;">${value}</td>
      </tr></table>`;
    })
    .join("");

  return buildBrandEmailHtml({
    title: `Relatório pós-evento — ${input.event.name}`,
    editionTag: "Portal cliente",
    preheader: `Resumo de convidados e presenças do evento ${input.event.name}.`,
    body: `<p style="margin:0 0 20px;color:#8a8478;">Olá ${input.client.fullName}, segue o relatório final do vosso evento. O PDF completo está em anexo.</p>${rows}`,
    cta: input.portalUrl
      ? {
          label: "Abrir portal do cliente",
          href: input.portalUrl,
        }
      : undefined,
  });
}

export async function sendPostEventReportForEvent(
  event: ManagedEvent
): Promise<{ sent: boolean; error?: string }> {
  if (!event.clientId) {
    return { sent: false, error: "Evento sem cliente associado." };
  }

  const client = await clientsRepo.getClientById(event.clientId);
  if (!client) {
    return { sent: false, error: "Cliente não encontrado." };
  }

  const email = client.email.trim();
  if (!email) {
    return { sent: false, error: "Cliente sem email." };
  }

  if (!isResendConfigured()) {
    return { sent: false, error: "RESEND_API_KEY não configurada." };
  }

  const [guests, seats, stats, documents, payments] = await Promise.all([
    guestsRepo.listGuestsByEvent(event.id),
    seatsRepo.listSeatsByEvent(event.id),
    guestsRepo.getEventStats(event.id),
    documentsRepo.listDocumentsForClient(client),
    paymentsRepo.listPaymentsByClientId(client.id),
  ]);

  const report = buildGuestEventReport({ event, guests, seats });
  const pdfBuffer = await generateGuestReportPDFBuffer(report);
  const financials = eventFinancialTotals(
    client.id,
    event.id,
    documents,
    payments,
    "MZN"
  );
  const summary = buildPostEventReportSummary({
    event,
    stats,
    invoiced: financials.invoiced,
    received: financials.received,
    currency: financials.currency,
  });

  const portalUrl = client.portalToken
    ? `${siteBaseUrl()}${portalPath(client.portalToken)}`
    : null;

  const result = await sendHaxrEmail({
    channel: "financeiro",
    to: email,
    subject: `[HAXR Signature] Relatório pós-evento — ${event.name}`,
    html: buildPostEventReportEmailHtml({
      client,
      event,
      summaryLines: summary.lines,
      portalUrl,
    }),
    attachments: [
      {
        filename: guestReportPdfFilename(report),
        content: pdfBuffer,
      },
    ],
  });

  if (!result.ok) {
    return { sent: false, error: result.error ?? "Falha ao enviar email." };
  }

  await eventsRepo.markPostEventReportSent(event.id);
  await portalPremiumRepo.markTimelineCategoryDone(event.id, "report");

  return { sent: true };
}

export async function processPostEventReports(
  limit = 20
): Promise<PostEventReportBatchResult> {
  const events = await eventsRepo.listEventsPendingPostEventReport(limit);
  const result: PostEventReportBatchResult = {
    scanned: events.length,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const event of events) {
    const outcome = await sendPostEventReportForEvent(event);
    if (outcome.sent) {
      result.sent += 1;
    } else if (outcome.error) {
      if (
        outcome.error.includes("sem email") ||
        outcome.error.includes("RESEND")
      ) {
        result.skipped += 1;
      } else {
        result.errors.push({ eventId: event.id, error: outcome.error });
      }
    }
  }

  return result;
}

export function buildPostEventReportPreviewSubject(event: ManagedEvent): string {
  return `[HAXR Signature] Relatório pós-evento — ${event.name}`;
}

export function buildPostEventReportPreviewHeader(event: ManagedEvent): string {
  return eventReportHeader(event);
}
