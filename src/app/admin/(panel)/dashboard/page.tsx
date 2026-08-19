import Link from "next/link";
import {
  Calendar,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AttentionRequiredPanel from "@/components/admin/dashboard/AttentionRequiredPanel";
import PortfolioHealthPanel from "@/components/admin/dashboard/PortfolioHealthPanel";
import CashSummaryPanel from "@/components/admin/dashboard/CashSummaryPanel";
import DocumentAnalyticsPanel from "@/components/admin/dashboard/DocumentAnalyticsPanel";
import EventPipelinePanel from "@/components/admin/dashboard/EventPipelinePanel";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import { getAdminDashboardSnapshot } from "@/lib/admin/services/admin-dashboard.service";
import type { InvoiceDocument } from "@/lib/admin/types";

export default async function DashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();

  const businessMap = new Map(snapshot.businesses.map((b) => [b.id, b.name]));

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
      {/* Attention Required Panel — Top priority operational action surface */}
      <div className="mb-10">
        <AttentionRequiredPanel items={snapshot.attention.items} />
      </div>

      {/* Upper Grid: Welcome Card + 4 Real KPI cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">

        {/* Welcome Card — "Executive Spotlight" (4 Columns) */}
        <div className="lg:col-span-5 admin-card p-6 md:p-7 relative overflow-hidden bg-gradient-to-br from-[#12100e] to-[#080706] border border-admin-gold/20 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {/* Glowing orbital diamond watermark in the background */}
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-[0.03] text-admin-gold pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke="currentColor" strokeWidth="0.8">
              <circle cx="50" cy="50" r="44" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="32" strokeDasharray="1.5 2.5" />
              <path d="M50 20 L68 35 L50 80 L32 35 Z" fill="currentColor" fillOpacity="0.05" />
            </svg>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
                Executive Spotlight
              </span>
              <h2 className="font-serif text-2xl font-light text-white mt-1">
                Olá, Direcção HAXR 👋
              </h2>
              <p className="text-xs text-grey-medium mt-1 leading-relaxed">
                Visão consolidada da operação, eventos e facturação da HAXR.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/60">
                Total Recebido Acumulado
              </p>
              <p className="font-serif text-3xl font-light text-admin-gold mt-1">
                {formatCurrency(snapshot.finance.totalReceived)}
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <Link
              href="/admin/cash"
              className="admin-btn-primary text-[9px] tracking-widest px-5 py-2.5 inline-flex items-center gap-2 group"
            >
              <span>Gerir Caixa</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 4 Real KPI Cards Grid (7 Columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Card 1: Eventos Activos */}
          <Link href="/admin/events" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Eventos activos
                </p>
                <p className="font-serif text-2xl font-light text-white mt-1">
                  {snapshot.eventGroups.active.length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-admin-gold group-hover:bg-admin-gold/10 group-hover:border-admin-gold/30 transition-all duration-300">
                <Calendar className="w-4 h-4" strokeWidth={1.25} />
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.eventGroups.planning.length} em planeamento
            </p>
          </Link>

          {/* Card 2: Novos Leads */}
          <Link href="/admin/leads" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Novos leads
                </p>
                <p className="font-serif text-2xl font-light text-white mt-1">
                  {snapshot.commercial.newLeads}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-admin-gold group-hover:bg-admin-gold/10 group-hover:border-admin-gold/30 transition-all duration-300">
                <FileCheck className="w-4 h-4" strokeWidth={1.25} />
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.commercial.recentInquiries.length} pedidos recentes
            </p>
          </Link>

          {/* Card 3: Facturas Emitidas */}
          <Link href="/admin/documents" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Facturas emitidas
                </p>
                <p className="font-serif text-2xl font-light text-white mt-1">
                  {snapshot.documents.totalInvoices}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-admin-gold group-hover:bg-admin-gold/10 group-hover:border-admin-gold/30 transition-all duration-300">
                <FileCheck className="w-4 h-4" strokeWidth={1.25} />
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.documents.totalProformas} proformas activas
            </p>
          </Link>

          {/* Card 4: Recibos Emitidos */}
          <Link href="/admin/documents" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Recibos emitidos
                </p>
                <p className="font-serif text-2xl font-light text-white mt-1">
                  {snapshot.documents.totalReceipts}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-admin-gold group-hover:bg-admin-gold/10 group-hover:border-admin-gold/30 transition-all duration-300">
                <FileCheck className="w-4 h-4" strokeWidth={1.25} />
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.documents.totalDraft} rascunhos em preparação
            </p>
          </Link>

        </div>
      </div>

      {/* Main Panels Section */}
      <div className="space-y-12">
        <PortfolioHealthPanel
          items={snapshot.portfolio.items}
          summary={snapshot.portfolio.summary}
          businessMap={businessMap}
        />

        <EventPipelinePanel groups={snapshot.eventGroups} businessMap={businessMap} />

        {/* Executive Inbox / Quick Leads Hub */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/50">
                Inbox Executivo
              </p>
              <h2 className="font-serif text-xl font-light text-white mt-1">
                Quick Leads Hub
              </h2>
            </div>
            <Link
              href="/admin/leads"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80"
            >
              Ver todos os leads →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {snapshot.commercial.recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="admin-card p-5 border border-white/[0.03] bg-[#0c0a09]/40 hover:border-admin-gold/25 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Micro glow on hover */}
                <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-admin-gold/5 blur-xl group-hover:bg-admin-gold/10 transition-colors duration-300" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
                    <span className="font-mono text-[9px] text-admin-gold font-medium">
                      {inquiry.projectType || "Geral"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono tracking-wider uppercase ${
                      inquiry.status === "new"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {inquiry.status === "new" ? "pendente" : "respondido"}
                    </span>
                  </div>

                  <p className="font-serif text-lg font-light text-white group-hover:text-admin-gold transition-colors truncate relative z-10">
                    {inquiry.name}
                  </p>
                  <p className="text-[10px] text-grey/65 font-mono truncate mt-1 relative z-10">
                    {inquiry.email}
                  </p>

                  <p className="text-xs text-grey-dark/85 italic line-clamp-2 mt-3 leading-relaxed relative z-10">
                    &ldquo;{inquiry.intent || inquiry.message || "Sem mensagem complementar."}&rdquo;
                  </p>
                </div>

                <div className="border-t border-white/[0.04] pt-4 mt-5 flex items-center justify-between relative z-10">
                  <span className="text-[9px] font-mono text-grey/40">
                    {new Date(inquiry.createdAt).toLocaleDateString("pt-PT")}
                  </span>

                  <div className="flex items-center gap-3">
                    <a
                      href={`mailto:${inquiry.email}?subject=Contacto HAXR Signature`}
                      className="font-mono text-[9px] tracking-wider uppercase text-grey-medium hover:text-white transition-colors"
                    >
                      Email
                    </a>
                    <a
                      href={`https://wa.me/?text=Olá ${encodeURIComponent(inquiry.name)}, agradecemos o seu contacto na HAXR Signature...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[9px] tracking-wider uppercase text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {snapshot.commercial.recentInquiries.length === 0 && (
              <div className="col-span-3 text-center p-8 border border-dashed border-white/5 rounded-xl">
                <p className="text-sm text-grey/45 italic font-mono">Sem novos leads recebidos.</p>
              </div>
            )}
          </div>
        </section>

        <CashSummaryPanel finance={snapshot.finance} />

        <DocumentAnalyticsPanel
          fiscalYear={snapshot.fiscalYear}
          revenueByBusiness={snapshot.analytics.revenueByBusiness}
          revenueByMonth={snapshot.analytics.revenueByMonth}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
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
            data={snapshot.documents.recentDocuments}
            keyExtractor={(row) => row.id}
            rowHref={(row) => `/admin/documents/${row.id}`}
            emptyMessage="Ainda não há documentos. Crie o primeiro."
          />
        </section>
      </div>
    </AdminShell>
  );
}
