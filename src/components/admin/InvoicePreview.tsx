"use client";

import StatusBadge from "@/components/admin/StatusBadge";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_PDF_TEMPLATE_LABELS,
  VAT_RATE,
} from "@/lib/admin/constants";
import type { Business, InvoiceDocument } from "@/lib/admin/types";
import { resolveDocumentContactProfile } from "@/lib/admin/commercial-pdf/document-pdf-contact";
import { resolveCommercialPaymentDetails } from "@/lib/admin/commercial-pdf/document-pdf-payment";
import { resolveDocumentTerms } from "@/lib/admin/commercial-pdf/document-pdf-terms";
import {
  formatDocumentCategory,
  formatEventTypeLabel,
  formatPdfCurrency,
  formatPdfDate,
  resolveDocumentDateMeta,
} from "@/lib/admin/commercial-pdf/document-pdf-formatters";

type InvoicePreviewProps = {
  document: InvoiceDocument;
  business: Business;
};

export default function InvoicePreview({
  document: doc,
  business,
}: InvoicePreviewProps) {
  const currency = doc.totals.currency;
  const template = doc.pdfTemplate ?? "editorial_ivory";

  const contactProfile = resolveDocumentContactProfile({
    business,
    contactChannel: doc.contactChannel,
  });

  const paymentDetails = resolveCommercialPaymentDetails(business);
  const primaryBank = paymentDetails.bankAccounts[0];

  const dateMeta = resolveDocumentDateMeta(doc);

  const terms = resolveDocumentTerms({
    documentType: doc.documentType,
    businessId: business.id,
    businessTerms: business.termsAndConditions,
  });

  const isNoir = template === "signature_noir";
  const isExecutive = template === "executive";
  const isAtelier = template === "atelier_blanc";
  const isMaison = template === "maison_signature";

  const containerClasses = isNoir
    ? "admin-card p-6 md:p-8 bg-[#0D0C0A] text-[#F5F0E8] border border-[#26231E] rounded-sm shadow-xl"
    : isExecutive
      ? "admin-card p-6 md:p-8 bg-white text-[#111111] border border-[#DDDDDD] rounded-sm shadow-sm"
      : isAtelier
        ? "admin-card p-6 md:p-8 bg-white text-[#141311] border border-[#E6E2D8] rounded-sm shadow-sm"
        : isMaison
          ? "admin-card p-6 md:p-8 bg-[#FAF7F2] text-[#181614] border border-[#DED6C8] rounded-sm shadow-md"
          : "admin-card p-6 md:p-8 bg-[#FCFAF7] text-[#1C1A17] border border-[#EAE4D9] rounded-sm shadow-md";

  const borderClass = isNoir
    ? "border-[#26231E]"
    : isExecutive
      ? "border-[#E5E5E5]"
      : isAtelier
        ? "border-[#E6E2D8]"
        : isMaison
          ? "border-[#DED6C8]"
          : "border-[#EAE4D9]";

  const subtleTextClass = isNoir
    ? "text-[#C4BEB4]"
    : isExecutive
      ? "text-[#555555]"
      : isAtelier
        ? "text-[#5C574F]"
        : isMaison
          ? "text-[#544E46]"
          : "text-[#5A554E]";

  const cardBoxClass = isNoir
    ? "bg-[#141311] border border-[#26231E]"
    : isExecutive
      ? "bg-[#F8F8F8] border border-[#E5E5E5]"
      : isAtelier
        ? "bg-transparent border-l-2 border-[#A37B24]"
        : isMaison
          ? "bg-[#F2EDE4] border border-[#DED6C8]"
          : "bg-[#F7F1E8] border border-[#EAE4D9]";

  const tableHeaderClass = isNoir
    ? "bg-[#181714] border-b border-admin-gold/40"
    : isExecutive
      ? "bg-[#EFEFEF] border-b border-[#CCCCCC]"
      : isAtelier
        ? "bg-white border-b border-[#141311]"
        : isMaison
          ? "bg-[#EBE4D8] border-b border-[#C59F45]"
          : "bg-[#F2EBE0] border-b border-[#B88A2A]/40";

  return (
    <div className={containerClasses}>
      {/* Template Badge Indicator */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-dashed border-current/10">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-admin-gold">
          {formatDocumentCategory(doc.documentType, contactProfile.isHaxr)}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-admin-gold/80 px-2 py-0.5 rounded bg-admin-gold/10">
          Modelo: {DOCUMENT_PDF_TEMPLATE_LABELS[template]}
        </span>
      </div>

      {/* Header: Brand & Document Meta */}
      <div
        className={`flex flex-col md:flex-row md:justify-between gap-6 pb-6 border-b ${borderClass}`}
      >
        <div>
          <p
            className={`text-xl font-medium ${
              isExecutive ? "font-sans font-bold" : "font-serif"
            }`}
          >
            {business.name}
          </p>
          <p className={`text-xs mt-1 ${subtleTextClass}`}>
            NUIT: {contactProfile.nuit} · {contactProfile.location}
          </p>
          <p className="text-xs text-admin-gold/90 mt-1 font-mono">
            {contactProfile.email} · {contactProfile.phone}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl text-admin-gold ${
              isExecutive ? "font-sans font-bold" : "font-serif"
            }`}
          >
            {DOCUMENT_TYPE_LABELS[doc.documentType]}
          </p>
          <p className={`font-mono text-xs mt-1 ${subtleTextClass}`}>
            {doc.documentNumber}
          </p>
          <div className="mt-2 flex justify-end">
            <StatusBadge status={doc.status} />
          </div>
        </div>
      </div>

      {/* Client & Date Info */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b ${borderClass} text-sm`}
      >
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Cliente
          </p>
          <p className="font-medium">{doc.clientName || "—"}</p>
          {doc.clientType === "company" && doc.companyName ? (
            <p className={subtleTextClass}>{doc.companyName}</p>
          ) : null}
          {doc.clientNuit ? (
            <p className={`text-xs ${subtleTextClass}`}>
              NUIT: {doc.clientNuit}
            </p>
          ) : null}
          {doc.clientPhone ? (
            <p className={subtleTextClass}>{doc.clientPhone}</p>
          ) : null}
          {doc.clientEmail ? (
            <p className={subtleTextClass}>{doc.clientEmail}</p>
          ) : null}
          {doc.clientAddress ? (
            <p className={`text-xs ${subtleTextClass}`}>
              {doc.clientAddress}
            </p>
          ) : null}
        </div>
        <div className="md:text-right">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Datas & Moeda
          </p>
          <p className={subtleTextClass}>
            {dateMeta.issueDateLabel}: {dateMeta.issueDateFormatted}
          </p>
          {dateMeta.secondaryDateLabel && dateMeta.secondaryDateFormatted ? (
            <p className={subtleTextClass}>
              {dateMeta.secondaryDateLabel}: {dateMeta.secondaryDateFormatted}
            </p>
          ) : null}
          <p className={subtleTextClass}>Moeda: {dateMeta.currency}</p>
        </div>
      </div>

      {/* Event Details (if applicable) */}
      {doc.event.eventType ||
      doc.event.eventName ||
      doc.event.eventDate ||
      doc.event.eventLocation ? (
        <div className={`py-4 border-b ${borderClass} text-sm`}>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Evento
          </p>
          {doc.event.eventName ? (
            <p className="font-medium">{doc.event.eventName}</p>
          ) : null}
          {doc.event.eventType ? (
            <p className={subtleTextClass}>
              {formatEventTypeLabel(doc.event.eventType)}
            </p>
          ) : null}
          {doc.event.eventDate ? (
            <p className={subtleTextClass}>
              Data: {formatPdfDate(doc.event.eventDate)}
            </p>
          ) : null}
          {doc.event.eventLocation ? (
            <p className={subtleTextClass}>{doc.event.eventLocation}</p>
          ) : null}
        </div>
      ) : null}

      {/* Services Table */}
      <div className="mt-6 overflow-hidden rounded-sm border border-current/10">
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="text-left py-2.5 px-3 font-mono text-[8px] uppercase tracking-wider text-admin-gold">
                Descrição
              </th>
              <th className="text-center py-2.5 px-2 font-mono text-[8px] uppercase tracking-wider text-admin-gold">
                Qtd.
              </th>
              <th className="text-right py-2.5 px-3 font-mono text-[8px] uppercase tracking-wider text-admin-gold">
                Preço
              </th>
              <th className="text-right py-2.5 px-3 font-mono text-[8px] uppercase tracking-wider text-admin-gold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {doc.lineItems.map((item, index) => (
              <tr
                key={item.id ?? index}
                className={`border-b border-current/5 ${
                  index % 2 !== 0
                    ? isNoir
                      ? "bg-white/[0.02]"
                      : "bg-black/[0.02]"
                    : ""
                }`}
              >
                <td className="py-3 px-3 pr-4">{item.description || "—"}</td>
                <td className="py-3 px-2 text-center">{item.quantity}</td>
                <td className={`py-3 px-3 text-right ${subtleTextClass}`}>
                  {formatPdfCurrency(item.unitPrice, currency)}
                </td>
                <td className="py-3 px-3 text-right font-medium text-admin-gold">
                  {formatPdfCurrency(item.total, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
        <div className={`flex justify-between ${subtleTextClass}`}>
          <span>Subtotal</span>
          <span>{formatPdfCurrency(doc.totals.subtotal, currency)}</span>
        </div>
        {doc.totals.includeVat ? (
          <div className={`flex justify-between ${subtleTextClass}`}>
            <span>IVA ({Math.round(VAT_RATE * 100)}%)</span>
            <span>{formatPdfCurrency(doc.totals.vatAmount, currency)}</span>
          </div>
        ) : null}
        <div
          className={`flex justify-between text-lg border-t border-admin-gold/40 pt-2 ${
            isExecutive ? "font-sans font-bold" : "font-serif"
          }`}
        >
          <span>Total</span>
          <span className="text-admin-gold font-medium">
            {formatPdfCurrency(doc.totals.grandTotal, currency)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {doc.notes ? (
        <div className={`mt-6 p-4 rounded-sm ${cardBoxClass}`}>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Observações
          </p>
          <p className={`text-sm ${subtleTextClass}`}>{doc.notes}</p>
        </div>
      ) : null}

      {/* Payment Details (e-Mola only for HAXR, no M-Pesa) */}
      {primaryBank || paymentDetails.mobilePayments.length > 0 ? (
        <div className={`mt-6 p-4 rounded-sm text-xs space-y-1.5 ${cardBoxClass}`}>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Dados de Pagamento
          </p>
          {primaryBank ? (
            <div className="space-y-0.5">
              <p className="font-medium">{primaryBank.bankName}</p>
              <p className={subtleTextClass}>Titular: {primaryBank.accountName}</p>
              <p className={subtleTextClass}>Conta: {primaryBank.accountNumber}</p>
              <p className={subtleTextClass}>NIB: {primaryBank.nib}</p>
              {primaryBank.swift ? (
                <p className={subtleTextClass}>SWIFT: {primaryBank.swift}</p>
              ) : null}
            </div>
          ) : null}
          {paymentDetails.mobilePayments.map((payment) => (
            <p key={payment.provider} className={subtleTextClass}>
              {payment.provider}: {payment.number} · {payment.accountName}
            </p>
          ))}
        </div>
      ) : null}

      {/* Commercial Terms */}
      {terms.length > 0 ? (
        <div className={`mt-6 p-4 rounded-sm text-xs space-y-1 ${cardBoxClass}`}>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold/80 mb-2">
            Condições Comerciais
          </p>
          {terms.map((term, index) => (
            <p key={index} className={`text-[11px] ${subtleTextClass}`}>
              · {term}
            </p>
          ))}
        </div>
      ) : null}

      {/* Signatures */}
      <div
        className={`mt-8 pt-6 border-t ${borderClass} grid grid-cols-1 md:grid-cols-2 gap-8`}
      >
        <div className="text-center">
          <div className="border-t border-current/20 pt-3 mt-12">
            <p className={`text-xs ${subtleTextClass}`}>
              Assinatura do Cliente
            </p>
          </div>
        </div>
        <div className="text-center">
          {doc.issuerSignatureImage ? (
            <img
              src={doc.issuerSignatureImage}
              alt={doc.issuerName || business.name}
              className="mx-auto h-14 max-w-[180px] object-contain mb-2"
            />
          ) : (
            <div className="h-14" />
          )}
          <div className="border-t border-current/20 pt-3">
            <p className="text-sm font-medium">
              {doc.issuerName || business.name}
            </p>
            {doc.issuerRole ? (
              <p className={`text-xs mt-1 ${subtleTextClass}`}>
                {doc.issuerRole}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p className={`mt-4 text-[10px] ${subtleTextClass}`}>
        Estado: {DOCUMENT_STATUS_LABELS[doc.status]}
        {doc.pdfGeneratedAt
          ? ` · PDF gerado em ${formatPdfDate(doc.pdfGeneratedAt)}`
          : ""}
      </p>
    </div>
  );
}
