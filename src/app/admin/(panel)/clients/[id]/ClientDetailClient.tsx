"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Plus, Wallet } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/calculations";
import {
  CLIENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from "@/lib/admin/constants";
import type { Client, ClientCommercialStats, InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";

type ClientDetailClientProps = {
  client: Client;
  events: ManagedEvent[];
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
  stats: ClientCommercialStats;
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function ClientDetailClient({
  client,
  events,
  documents,
  payments,
  stats,
}: ClientDetailClientProps) {
  return (
    <AdminShell
      title={client.fullName}
      subtitle={
        client.companyName
          ? `${client.companyName} · ${CLIENT_TYPE_LABELS[client.clientType]}`
          : CLIENT_TYPE_LABELS[client.clientType]
      }
      actions={
        <Link href="/admin/clients" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Eventos", value: stats.eventCount },
          {
            label: "Valor facturado",
            value: formatCurrency(stats.invoicedTotal, stats.currency),
          },
          {
            label: "Valor recebido",
            value: formatCurrency(stats.receivedTotal, stats.currency),
          },
          {
            label: "Saldo pendente",
            value: formatCurrency(stats.pendingBalance, stats.currency),
          },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              {item.label}
            </p>
            <p className="font-serif text-2xl font-light text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href={`/admin/events?create=1&clientId=${client.id}`}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo evento
        </Link>
        <Link
          href={`/admin/documents/new?type=proforma&clientId=${client.id}`}
          className="admin-btn-secondary"
        >
          <FileText className="w-4 h-4" />
          Nova proforma
        </Link>
        <Link href="/admin/cash" className="admin-btn-secondary">
          <Wallet className="w-4 h-4" />
          Registar pagamento
        </Link>
      </div>

      <section className="admin-card p-6 mb-8 space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Contacto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-grey/70">
          <p>Telefone: {client.phone || "—"}</p>
          <p>Email: {client.email || "—"}</p>
          <p>NUIT: {client.nuit || "—"}</p>
          <p>Morada: {client.address || "—"}</p>
        </div>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Eventos
        </h2>
        <DataTable
          columns={[
            {
              key: "name",
              header: "Evento",
              render: (row: ManagedEvent) => (
                <div>
                  <p>{row.name}</p>
                  <p className="text-[10px] font-mono text-grey/40 mt-0.5">
                    {EVENT_TYPE_LABELS[row.type]}
                  </p>
                </div>
              ),
            },
            {
              key: "date",
              header: "Data",
              render: (row: ManagedEvent) => formatDate(row.date),
            },
            {
              key: "location",
              header: "Local",
              render: (row: ManagedEvent) => row.location || "—",
            },
          ]}
          data={events}
          keyExtractor={(row) => row.id}
          rowHref={(row) => `/admin/events/${row.id}`}
          emptyMessage="Nenhum evento associado a este cliente."
        />
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Documentos
        </h2>
        <DataTable
          columns={[
            {
              key: "number",
              header: "Número",
              render: (row: InvoiceDocument) => row.documentNumber,
            },
            {
              key: "type",
              header: "Tipo",
              render: (row: InvoiceDocument) =>
                DOCUMENT_TYPE_LABELS[row.documentType],
            },
            {
              key: "status",
              header: "Estado",
              render: (row: InvoiceDocument) =>
                DOCUMENT_STATUS_LABELS[row.status],
            },
            {
              key: "total",
              header: "Total",
              render: (row: InvoiceDocument) =>
                formatCurrency(row.totals.grandTotal, row.totals.currency),
            },
          ]}
          data={documents}
          keyExtractor={(row) => row.id}
          rowHref={(row) => `/admin/documents/${row.id}`}
          emptyMessage="Nenhum documento para este cliente."
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Pagamentos
        </h2>
        <DataTable
          columns={[
            {
              key: "date",
              header: "Data",
              render: (row: PaymentRecord) => formatDate(row.paidAt.slice(0, 10)),
            },
            {
              key: "amount",
              header: "Valor",
              render: (row: PaymentRecord) =>
                formatCurrency(row.amount, row.currency),
            },
            {
              key: "event",
              header: "Evento",
              render: (row: PaymentRecord) => row.eventName || "—",
            },
            {
              key: "document",
              header: "Documento",
              render: (row: PaymentRecord) =>
                row.sourceDocumentNumber || row.documentNumber || "—",
            },
          ]}
          data={payments}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhum pagamento registado."
        />
      </section>
    </AdminShell>
  );
}
