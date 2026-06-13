"use client";

import { formatCurrency, formatDateShort } from "@/lib/calculations";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  VAT_RATE,
} from "@/lib/admin/constants";
import type { Business, InvoiceDocument } from "@/lib/admin/types";

type InvoicePreviewProps = {
  document: InvoiceDocument;
  business: Business;
};

export default function InvoicePreview({ document: doc, business }: InvoicePreviewProps) {
  const currency = doc.totals.currency;
  const bank = business.bankAccounts[0];

  return (
    <div className="admin-card p-6 md:p-8 bg-white text-black rounded-sm">
      <div className="flex flex-col md:flex-row md:justify-between gap-6 pb-6 border-b border-black/10">
        <div>
          <p className="font-serif text-xl text-black">{business.name}</p>
          <p className="text-xs text-black/50 mt-1">NUIT: {business.nuit}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl text-admin-gold">
            {DOCUMENT_TYPE_LABELS[doc.documentType]}
          </p>
          <p className="font-mono text-xs text-black/50 mt-1">
            {doc.documentNumber}
          </p>
          <div className="mt-2 flex justify-end">
            <StatusBadge status={doc.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-black/10 text-sm">
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/40 mb-2">
            Cliente
          </p>
          <p className="font-medium">{doc.clientName || "—"}</p>
          {doc.clientType === "company" && doc.companyName ? (
            <p className="text-black/60">{doc.companyName}</p>
          ) : null}
          {doc.clientPhone ? <p className="text-black/60">{doc.clientPhone}</p> : null}
          {doc.clientEmail ? <p className="text-black/60">{doc.clientEmail}</p> : null}
        </div>
        <div className="md:text-right">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/40 mb-2">
            Datas
          </p>
          <p className="text-black/70">
            Emissão: {formatDateShort(doc.issueDate)}
          </p>
          <p className="text-black/70">
            Validade: {formatDateShort(doc.expiryDate)}
          </p>
          <p className="text-black/70">Moeda: {currency}</p>
        </div>
      </div>

      {doc.event.eventType || doc.event.eventName ? (
        <div className="py-4 border-b border-black/10 text-sm">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/40 mb-2">
            Evento
          </p>
          {doc.event.eventType ? (
            <p className="text-black/70">
              {EVENT_TYPE_LABELS[doc.event.eventType]}
            </p>
          ) : null}
          {doc.event.eventName ? (
            <p className="font-medium">{doc.event.eventName}</p>
          ) : null}
          {doc.event.eventDate ? (
            <p className="text-black/60">
              Data: {formatDateShort(doc.event.eventDate)}
            </p>
          ) : null}
          {doc.event.eventLocation ? (
            <p className="text-black/60">{doc.event.eventLocation}</p>
          ) : null}
        </div>
      ) : null}

      <table className="w-full mt-6 text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="text-left py-2 font-mono text-[8px] uppercase tracking-wider text-black/40">
              Descrição
            </th>
            <th className="text-center py-2 font-mono text-[8px] uppercase tracking-wider text-black/40">
              Qtd.
            </th>
            <th className="text-right py-2 font-mono text-[8px] uppercase tracking-wider text-black/40">
              Preço
            </th>
            <th className="text-right py-2 font-mono text-[8px] uppercase tracking-wider text-black/40">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {doc.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-black/5">
              <td className="py-3 pr-4">{item.description || "—"}</td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">
                {formatCurrency(item.unitPrice, currency)}
              </td>
              <td className="py-3 text-right font-medium">
                {formatCurrency(item.total, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between text-black/70">
          <span>Subtotal</span>
          <span>{formatCurrency(doc.totals.subtotal, currency)}</span>
        </div>
        {doc.totals.includeVat ? (
          <div className="flex justify-between text-black/70">
            <span>IVA ({Math.round(VAT_RATE * 100)}%)</span>
            <span>{formatCurrency(doc.totals.vatAmount, currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-serif text-lg text-black border-t border-admin-gold/40 pt-2">
          <span>Total</span>
          <span>{formatCurrency(doc.totals.grandTotal, currency)}</span>
        </div>
      </div>

      {doc.notes ? (
        <div className="mt-6 p-4 bg-black/[0.03] rounded-sm">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/40 mb-2">
            Notas
          </p>
          <p className="text-sm text-black/70">{doc.notes}</p>
        </div>
      ) : null}

      {bank || business.mobilePayments.length > 0 ? (
        <div className="mt-6 p-4 border border-black/10 rounded-sm text-xs text-black/60 space-y-1">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/40 mb-2">
            Dados de Pagamento
          </p>
          {bank ? (
            <>
              <p>{bank.bankName}</p>
              <p>Titular: {bank.accountName}</p>
              <p>Conta: {bank.accountNumber}</p>
              <p>NIB: {bank.nib}</p>
            </>
          ) : null}
          {business.mobilePayments.map((payment) => (
            <p key={payment.provider}>
              {payment.provider}: {payment.number} · {payment.accountName}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-8 pt-6 border-t border-black/10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t border-black/20 pt-3 mt-12">
            <p className="text-xs text-black/50">Assinatura do Cliente</p>
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
          <div className="border-t border-black/20 pt-3">
            <p className="text-sm font-medium text-black">
              {doc.issuerName || business.name}
            </p>
            {doc.issuerRole ? (
              <p className="text-xs text-black/50 mt-1">{doc.issuerRole}</p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-black/40">
        Estado: {DOCUMENT_STATUS_LABELS[doc.status]}
        {doc.pdfGeneratedAt
          ? ` · PDF gerado em ${formatDateShort(doc.pdfGeneratedAt)}`
          : ""}
      </p>
    </div>
  );
}
