"use client";

import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Plus,
  User,
  Wallet,
} from "lucide-react";
import type { InvoiceDocument } from "@/lib/admin/types";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatCurrency } from "@/lib/calculations";
import type { ManagedEvent } from "@/lib/events/types";

type EventCommercialShortcutsPanelProps = {
  event: ManagedEvent;
  documents: InvoiceDocument[];
  clientPortalUrl?: string | null;
};

export default function EventCommercialShortcutsPanel({
  event,
  documents,
  clientPortalUrl = null,
}: EventCommercialShortcutsPanelProps) {
  const clientQuery = event.clientId
    ? `clientId=${encodeURIComponent(event.clientId)}`
    : "";
  const eventQuery = `eventId=${encodeURIComponent(event.id)}`;
  const querySuffix = [clientQuery, eventQuery].filter(Boolean).join("&");

  const openDocuments = documents.filter(
    (doc) =>
      (doc.documentType === "invoice" || doc.documentType === "proforma") &&
      doc.status === "sent"
  );

  return (
    <section className="admin-card p-6 mb-8 border-admin-gold/10 space-y-5">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Comercial
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Atalhos para {event.clientName || "este evento"}
        </h3>
        <p className="text-sm text-grey/55 mt-2">
          Documentos, cobranças e portal do cliente sem sair do evento.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {event.clientId ? (
          <Link
            href={`/admin/clients/${event.clientId}`}
            className="admin-btn-secondary"
          >
            <User className="w-4 h-4" />
            Vista 360º do cliente
          </Link>
        ) : null}
        <Link
          href={`/admin/documents/new?type=proforma&${querySuffix}`}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nova proforma
        </Link>
        <Link
          href={`/admin/documents/new?type=invoice&${querySuffix}`}
          className="admin-btn-secondary"
        >
          <FileText className="w-4 h-4" />
          Nova factura
        </Link>
        <Link href="/admin/cash" className="admin-btn-secondary">
          <Wallet className="w-4 h-4" />
          Registar pagamento
        </Link>
        {clientPortalUrl ? (
          <a
            href={clientPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary"
          >
            <ExternalLink className="w-4 h-4" />
            Portal do cliente
          </a>
        ) : null}
      </div>

      {documents.length > 0 ? (
        <div className="border-t border-white/5 pt-5 space-y-3">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45">
            Documentos deste evento
          </p>
          <ul className="space-y-2">
            {documents.slice(0, 6).map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 border border-white/5 hover:border-admin-gold/20 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white/85 font-mono">
                      {doc.documentNumber}
                    </p>
                    <p className="text-xs text-grey/50 mt-1">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]} ·{" "}
                      {DOCUMENT_STATUS_LABELS[doc.status]}
                    </p>
                  </div>
                  <p className="font-serif text-base text-white/90">
                    {formatCurrency(doc.totals.grandTotal, doc.totals.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {openDocuments.length > 0 ? (
            <p className="text-xs text-amber-300/80">
              {openDocuments.length} documento(s) enviado(s) aguardam cobrança.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-grey/50 border-t border-white/5 pt-5">
          Ainda não há documentos comerciais ligados a este evento.
        </p>
      )}
    </section>
  );
}
