import Link from "next/link";
import {
  Calendar,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AttentionRequiredPanel from "@/components/admin/dashboard/AttentionRequiredPanel";
import PortfolioHealthPanel from "@/components/admin/dashboard/PortfolioHealthPanel";
import UpcomingOperationalAgendaPanel from "@/components/admin/dashboard/UpcomingOperationalAgendaPanel";
import ClientDecisionsPanel from "@/components/admin/dashboard/ClientDecisionsPanel";
import CommercialPipelinePanel from "@/components/admin/dashboard/CommercialPipelinePanel";
import EventPipelinePanel from "@/components/admin/dashboard/EventPipelinePanel";
import FinancialPositionPanel from "@/components/admin/dashboard/FinancialPositionPanel";
import { formatCurrency } from "@/lib/calculations";
import { getAdminDashboardSnapshot } from "@/lib/admin/services/admin-dashboard.service";

export default async function DashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();

  const businessMap = new Map(snapshot.businesses.map((b) => [b.id, b.name]));
  const { financialPosition } = snapshot;
  const totalReceivedBuckets = financialPosition.received.total;
  const thisMonthBuckets = financialPosition.received.thisMonth;

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
                Direcção HAXR
              </h2>
              <p className="text-xs text-grey-medium mt-1 leading-relaxed">
                Visão consolidada da operação, eventos e facturação da HAXR.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/60">
                {financialPosition.coverage.receivedComplete
                  ? "Total Recebido Acumulado"
                  : "Recebimentos Documentados"}
              </p>
              <p className="font-serif text-3xl font-light text-admin-gold mt-1">
                {financialPosition.coverage.receivedComplete
                  ? totalReceivedBuckets.length > 0
                    ? totalReceivedBuckets
                        .map((b) => formatCurrency(b.amount, b.currency))
                        .join(" · ")
                    : "0 MT"
                  : "Indisponível"}
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
                <p className="font-serif text-3xl font-light text-white mt-1.5">
                  {snapshot.eventGroups.active.length}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.eventGroups.planning.length} planeamento · {snapshot.eventGroups.completed.length} concluídos
            </p>
          </Link>

          {/* Card 2: Leads Novos */}
          <Link href="/admin/leads" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Leads novos
                </p>
                <p className="font-serif text-3xl font-light text-white mt-1.5">
                  {snapshot.commercial.summary.new}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              Pedidos do site aguardando resposta
            </p>
          </Link>

          {/* Card 3: Recebido (Este Mês) */}
          <Link href="/admin/cash" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Recebido este mês
                </p>
                <p className="font-serif text-[22px] md:text-2xl font-light text-white mt-1.5 truncate">
                  {financialPosition.coverage.receivedComplete
                    ? thisMonthBuckets.length > 0
                      ? thisMonthBuckets
                          .map((b) => formatCurrency(b.amount, b.currency))
                          .join(" · ")
                      : "0 MT"
                    : "Indisponível"}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              Entradas de tesouraria consolidadas
            </p>
          </Link>

          {/* Card 4: Documentos Emitidos */}
          <Link href="/admin/documents" className="admin-stat-card group relative overflow-hidden block">
            <div className="flex items-start justify-between relative z-10 mb-2">
              <div>
                <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium opacity-70">
                  Total Documentos
                </p>
                <p className="font-serif text-3xl font-light text-white mt-1.5">
                  {snapshot.documents.totalProformas + snapshot.documents.totalInvoices + snapshot.documents.totalReceipts}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-grey/50 font-mono tracking-wide relative z-10">
              {snapshot.documents.totalDraft} rascunhos em preparação
            </p>
          </Link>

        </div>
      </div>

      {/* Main Panels Section */}
      <div className="space-y-10">
        <PortfolioHealthPanel
          items={snapshot.portfolio.items}
          summary={snapshot.portfolio.summary}
          businessMap={businessMap}
        />

        <UpcomingOperationalAgendaPanel upcoming={snapshot.upcoming} />

        <ClientDecisionsPanel clientDecisions={snapshot.clientDecisions} />

        <EventPipelinePanel groups={snapshot.eventGroups} businessMap={businessMap} />

        <CommercialPipelinePanel commercial={snapshot.commercial} />

        <FinancialPositionPanel financialPosition={snapshot.financialPosition} />
      </div>
    </AdminShell>
  );
}
