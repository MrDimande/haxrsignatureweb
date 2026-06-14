import Link from "next/link";
import {
  Calendar,
  FileCheck,
  FileText,
  Inbox,
  Receipt,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ActiveEventsOverviewPanel from "@/components/admin/dashboard/ActiveEventsOverviewPanel";
import CashSummaryPanel from "@/components/admin/dashboard/CashSummaryPanel";
import EventPipelinePanel from "@/components/admin/dashboard/EventPipelinePanel";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import { groupEventsByPipeline } from "@/lib/events/pipeline";
import * as financeRepo from "@/lib/finance/repositories/overview.repository";
import type { InvoiceDocument } from "@/lib/admin/types";

export default async function DashboardPage() {
  const [stats, businesses, events, finance, newLeads] = await Promise.all([
    documentsRepo.getDashboardStats(),
    businessesRepo.listBusinesses(),
    eventsRepo.listAllEvents(),
    financeRepo.getFinanceOverview(),
    inquiriesRepo.countNewInquiries(),
  ]);

  const businessMap = new Map(businesses.map((b) => [b.id, b.name]));
  const eventGroups = groupEventsByPipeline(events);
  const guestStats = await guestsRepo.listGuestStatsByEventIds(
    events.map((event) => event.id)
  );

  const overviewCards = [
    {
      label: "Eventos activos",
      value: eventGroups.active.length,
      hint: `${eventGroups.planning.length} novos · ${eventGroups.completed.length} finalizados`,
      icon: Calendar,
      href: "/admin/events",
    },
    {
      label: "Leads novos",
      value: newLeads,
      hint: "Pedidos do site por responder",
      icon: Inbox,
      href: "/admin/leads",
    },
    {
      label: "Recebido",
      value: formatCurrency(finance.thisMonthReceived),
      hint: "Entradas deste mês",
      icon: Receipt,
      href: "/admin/cash",
    },
    {
      label: "Documentos",
      value: stats.totalProformas + stats.totalInvoices + stats.totalReceipts,
      hint: `${stats.totalDraft} rascunho${stats.totalDraft === 1 ? "" : "s"}`,
      icon: FileText,
      href: "/admin/documents",
    },
  ];

  const columns = [
    {
      key: "number",
      header: "Documento",
      render: (row: InvoiceDocument) => (
        <div>
          <p className="text-white font-mono text-xs">{row.documentNumber}</p>
          <p className="text-grey/50 text-xs mt-1">
            {DOCUMENT_TYPE_LABELS[row.documentType]}
          </p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: InvoiceDocument) => row.clientName || "—",
    },
    {
      key: "business",
      header: "Empresa",
      render: (row: InvoiceDocument) => businessMap.get(row.businessId) ?? "—",
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row: InvoiceDocument) =>
        formatCurrency(row.totals.grandTotal, row.totals.currency),
    },
    {
      key: "status",
      header: "Estado",
      render: (row: InvoiceDocument) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Operações, eventos e finanças num relance"
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/documents/new?type=receipt" className="admin-btn-secondary">
            <FileCheck className="w-4 h-4" />
            Novo recibo
          </Link>
          <Link href="/admin/events" className="admin-btn-primary">
            <Calendar className="w-4 h-4" strokeWidth={1.25} />
            Ver eventos
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {overviewCards.map(({ label, value, hint, icon: Icon, href }) => (
          <Link key={label} href={href} className="admin-stat-card group">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
                {label}
              </p>
              <Icon
                className="w-4 h-4 text-admin-gold/60 group-hover:text-admin-gold transition-colors"
                strokeWidth={1.25}
              />
            </div>
            <p className="font-serif text-2xl md:text-3xl font-light text-white">
              {value}
            </p>
            <p className="text-xs text-grey/45 mt-2">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-12">
        <ActiveEventsOverviewPanel
          events={events}
          guestStats={guestStats}
          businessMap={businessMap}
        />

        <EventPipelinePanel groups={eventGroups} businessMap={businessMap} />

        <CashSummaryPanel finance={finance} />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
              Documentos recentes
            </h2>
            <Link
              href="/admin/documents"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80"
            >
              Ver todos →
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={stats.recentDocuments}
            keyExtractor={(row) => row.id}
            rowHref={(row) => `/admin/documents/${row.id}`}
            emptyMessage="Ainda não há documentos. Crie o primeiro."
          />
        </section>
      </div>
    </AdminShell>
  );
}
