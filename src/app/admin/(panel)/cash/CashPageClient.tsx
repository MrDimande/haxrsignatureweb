"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Layers,
  PieChart,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import EditorialBarChart from "@/components/admin/finance/EditorialBarChart";
import EditorialDonutChart from "@/components/admin/finance/EditorialDonutChart";
import PaymentsMigrationNotice from "@/components/admin/finance/PaymentsMigrationNotice";
import RegisterPaymentForm from "@/components/admin/finance/RegisterPaymentForm";
import ExpensesPanel from "@/components/admin/finance/ExpensesPanel";
import EventRevenuePanel from "@/components/admin/finance/EventRevenuePanel";
import FinanceExportPanel from "@/components/admin/finance/FinanceExportPanel";
import MarginSummaryPanel from "@/components/admin/finance/MarginSummaryPanel";
import MonthlyGoalsPanel from "@/components/admin/finance/MonthlyGoalsPanel";
import OverdueAlertsPanel from "@/components/admin/finance/OverdueAlertsPanel";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import {
  BUSINESS_CHART_COLORS,
  documentStatusLabel,
  documentTypeLabel,
  FINANCE_STATUS_STYLES,
  FINANCE_TYPE_COLORS,
  formatPercent,
  PAYMENT_METHOD_COLORS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/finance/constants";
import type { CashAnalytics, PaymentRecord } from "@/lib/finance/types";
import type { BusinessId, Client, InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";

type CashPageClientProps = {
  analytics: CashAnalytics;
  businesses: { id: BusinessId; name: string }[];
  clients: Client[];
  events: ManagedEvent[];
  openDocuments: InvoiceDocument[];
};

export default function CashPageClient({
  analytics,
  businesses,
  clients,
  events,
  openDocuments,
}: CashPageClientProps) {
  const availableYears = useMemo(
    () =>
      Object.keys(analytics.monthlyTrendByYear)
        .map(Number)
        .sort((a, b) => b - a),
    [analytics.monthlyTrendByYear]
  );

  const [selectedYear, setSelectedYear] = useState(analytics.fiscalYear);

  const businessMap = new Map(businesses.map((b) => [b.id, b.name]));
  const monthlyTrend =
    analytics.monthlyTrendByYear[selectedYear] ?? analytics.monthlyTrend;

  const yearReceived = monthlyTrend.reduce(
    (sum, point) => sum + point.received,
    0
  );

  const kpiCards = [
    {
      label: `Recebido ${selectedYear}`,
      value: formatCurrency(yearReceived),
      detail: `${monthlyTrend.reduce((sum, p) => sum + p.count, 0)} documento${monthlyTrend.reduce((sum, p) => sum + p.count, 0) === 1 ? "" : "s"} pagos`,
      icon: Wallet,
    },
    {
      label: "Este mês",
      value: formatCurrency(analytics.thisMonthReceived),
      detail: `${analytics.thisMonthReceiptsCount} recibo${analytics.thisMonthReceiptsCount === 1 ? "" : "s"}`,
      icon: Receipt,
    },
    {
      label: "Por receber",
      value: formatCurrency(
        analytics.pendingInvoicesAmount + analytics.pendingProformasAmount
      ),
      detail: `${analytics.pendingInvoicesCount} fact. · ${analytics.sentProformasCount} proformas`,
      icon: FileText,
    },
    {
      label: "Taxa de cobrança",
      value: `${analytics.collectionRate.toFixed(0)}%`,
      detail: "Recebido vs. total em aberto",
      icon: PieChart,
    },
    {
      label: "Ticket médio",
      value: formatCurrency(analytics.averageTicket),
      detail: "Valor médio por documento pago",
      icon: BarChart3,
    },
    {
      label: "IVA recolhido",
      value: formatCurrency(analytics.yearVat),
      detail: `Subtotal ${formatCurrency(analytics.yearSubtotal)}`,
      icon: Layers,
    },
  ];

  const movementColumns = [
    {
      key: "number",
      header: "Documento",
      render: (row: InvoiceDocument) => (
        <div>
          <p className="text-white font-mono text-xs">{row.documentNumber}</p>
          <p className="text-grey/50 text-[10px] mt-1">
            {DOCUMENT_TYPE_LABELS[row.documentType]}
          </p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: InvoiceDocument) => (
        <div>
          <p className="text-sm text-white/85">{row.clientName || "—"}</p>
          {row.event.eventName ? (
            <p className="text-[10px] text-grey/45 mt-0.5 line-clamp-1">
              {row.event.eventName}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "business",
      header: "Empresa",
      render: (row: InvoiceDocument) => businessMap.get(row.businessId) ?? "—",
    },
    {
      key: "date",
      header: "Data",
      render: (row: InvoiceDocument) => (
        <span className="font-mono text-xs text-grey/60">
          {new Date(row.issueDate).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Africa/Maputo",
          })}
        </span>
      ),
    },
    {
      key: "total",
      header: "Valor",
      className: "text-right",
      render: (row: InvoiceDocument) => (
        <span className="font-serif text-base text-white/90">
          {formatCurrency(row.totals.grandTotal, row.totals.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row: InvoiceDocument) => <StatusBadge status={row.status} />,
    },
  ];

  const businessSegments = analytics.byBusiness
    .filter((item) => item.received > 0)
    .map((item, index) => ({
      label: item.businessName,
      value: item.received,
      color: BUSINESS_CHART_COLORS[index % BUSINESS_CHART_COLORS.length],
    }));

  const typeSegments = analytics.byDocumentType
    .filter((item) => item.paidAmount > 0)
    .map((item) => ({
      label: documentTypeLabel(item.type),
      value: item.paidAmount,
      color: FINANCE_TYPE_COLORS[item.type],
    }));

  const methodSegments = analytics.byPaymentMethod.map((item) => ({
    label: PAYMENT_METHOD_LABELS[item.method],
    value: item.amount,
    color: PAYMENT_METHOD_COLORS[item.method],
  }));

  const paymentColumns = [
    {
      key: "date",
      header: "Data",
      render: (row: PaymentRecord) => (
        <span className="font-mono text-xs text-grey/60">
          {new Date(row.paidAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Africa/Maputo",
          })}
        </span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: PaymentRecord) => row.clientName || "—",
    },
    {
      key: "event",
      header: "Evento",
      render: (row: PaymentRecord) => row.eventName || "—",
    },
    {
      key: "method",
      header: "Método",
      render: (row: PaymentRecord) => PAYMENT_METHOD_LABELS[row.paymentMethod],
    },
    {
      key: "reference",
      header: "Referência",
      render: (row: PaymentRecord) => row.reference || "—",
    },
    {
      key: "source",
      header: "Origem",
      render: (row: PaymentRecord) => row.sourceDocumentNumber || "—",
    },
    {
      key: "receipt",
      header: "Recibo",
      render: (row: PaymentRecord) => row.documentNumber || "—",
    },
    {
      key: "amount",
      header: "Valor",
      className: "text-right",
      render: (row: PaymentRecord) => (
        <span className="font-serif text-base text-white/90">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-admin-gold mb-4">
          Controlo financeiro interno
        </p>
        <p className="text-sm text-grey/65 leading-relaxed">
          A caixa consolida receitas, pendências, IVA e desempenho por empresa —
          tudo derivado dos documentos emitidos. Cada recibo ou factura marcada
          como «Pago» alimenta automaticamente a contabilidade interna.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/documents/new?type=receipt" className="admin-btn-primary">
          <Receipt className="w-4 h-4" />
          Registar recibo
        </Link>
        <Link href="/admin/documents/new?type=invoice" className="admin-btn-secondary">
          <FileText className="w-4 h-4" />
          Nova factura
        </Link>
        <Link href="/admin/documents" className="admin-btn-secondary">
          Ver documentos
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {analytics.paymentsEnabled ? (
        <RegisterPaymentForm
          businesses={businesses}
          clients={clients}
          events={events}
          openDocuments={openDocuments}
        />
      ) : (
        <PaymentsMigrationNotice />
      )}

      <OverdueAlertsPanel analytics={analytics} />

      <MarginSummaryPanel analytics={analytics} />

      <div className="flex flex-wrap gap-2">
        {availableYears.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 border font-mono text-[9px] tracking-[0.2em] uppercase transition-colors ${
              selectedYear === year
                ? "border-admin-gold/40 bg-admin-gold/10 text-admin-gold"
                : "border-grey-dark/80 text-grey/55 hover:text-white"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <MonthlyGoalsPanel
        analytics={analytics}
        businesses={businesses}
        selectedYear={selectedYear}
      />

      <FinanceExportPanel analytics={analytics} selectedYear={selectedYear} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
                {label}
              </p>
              <Icon className="w-4 h-4 text-admin-gold/60" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-2xl md:text-3xl font-light text-white">
              {value}
            </p>
            <p className="text-xs text-grey/45 mt-2 leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>

      {analytics.monthOverMonthChange !== null ? (
        <div
          className={`admin-card px-5 py-4 flex items-center gap-3 border ${
            analytics.monthOverMonthChange >= 0
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5"
          }`}
        >
          {analytics.monthOverMonthChange >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400/90" />
          ) : (
            <TrendingDown className="w-4 h-4 text-amber-400/90" />
          )}
          <p className="text-sm text-grey/70">
            Variação face ao mês anterior:{" "}
            <span className="text-white/85 font-serif">
              {formatPercent(analytics.monthOverMonthChange)}
            </span>
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Análise mensal
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Receitas em {selectedYear}
            </h3>
          </div>
          <EditorialBarChart
            data={monthlyTrend.map((point) => ({
              label: point.label,
              value: point.received,
              hint: `${point.count} documento${point.count === 1 ? "" : "s"}`,
            }))}
            formatValue={(value) => formatCurrency(value)}
            highlightLast={selectedYear === new Date().getUTCFullYear()}
          />
        </section>

        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Por empresa
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Distribuição de receitas
            </h3>
          </div>
          <EditorialDonutChart
            segments={businessSegments}
            formatValue={(value) => formatCurrency(value)}
            centerLabel="Recebido"
            centerValue={formatCurrency(analytics.totalReceived)}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Métodos de pagamento
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Como entrou o dinheiro
            </h3>
          </div>
          {analytics.paymentsEnabled ? (
            <EditorialDonutChart
              segments={methodSegments}
              formatValue={(value) => formatCurrency(value)}
              centerLabel="Pagamentos"
            />
          ) : (
            <p className="text-sm text-grey/45 italic">
              Active a migration de pagamentos para ver a distribuição por método.
            </p>
          )}
        </section>

        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Por tipo de documento
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Proformas, facturas e recibos
            </h3>
          </div>
          <EditorialDonutChart
            segments={typeSegments}
            formatValue={(value) => formatCurrency(value)}
            centerLabel="Pagos"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {analytics.byDocumentType.map((item) => (
              <div
                key={item.type}
                className="border border-grey-dark/60 px-3 py-3"
              >
                <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45 mb-1">
                  {documentTypeLabel(item.type)}
                </p>
                <p className="font-serif text-lg text-white/85">
                  {formatCurrency(item.paidAmount)}
                </p>
                <p className="text-[10px] text-grey/45 mt-1">
                  {item.paidCount} pago{item.paidCount === 1 ? "" : "s"}
                  {item.pendingCount > 0
                    ? ` · ${item.pendingCount} pendente${item.pendingCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ExpensesPanel
        analytics={analytics}
        businesses={businesses}
        events={events}
      />

      <EventRevenuePanel analytics={analytics} />

      <section className="admin-card p-6 md:p-8 space-y-6">
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Pipeline documental
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Estado dos registos
          </h3>
        </div>
        <ul className="space-y-4">
          {analytics.byStatus.map((item) => {
            const max = Math.max(...analytics.byStatus.map((s) => s.amount), 1);
            const width = (item.amount / max) * 100;
            return (
              <li key={item.status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={FINANCE_STATUS_STYLES[item.status]}>
                    {documentStatusLabel(item.status)}
                  </span>
                  <span className="font-mono text-xs text-grey/50">
                    {item.count} doc. · {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-1.5 bg-grey-dark/80 overflow-hidden">
                  <div
                    className="h-full bg-admin-gold/50 transition-all duration-700"
                    style={{ width: `${Math.max(width, item.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="border border-grey-dark/60 px-3 py-3">
            <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
              Rascunhos
            </p>
            <p className="font-serif text-xl text-white/85">
              {analytics.draftCount}
            </p>
            <p className="text-[10px] text-grey/45">
              {formatCurrency(analytics.draftAmount)}
            </p>
          </div>
          <div className="border border-grey-dark/60 px-3 py-3">
            <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
              Cancelados
            </p>
            <p className="font-serif text-xl text-white/85">
              {analytics.cancelledCount}
            </p>
          </div>
        </div>
      </section>

      {analytics.clientBalances.length > 0 ? (
        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Saldos por cliente
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Facturado vs. recebido
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.clientBalances.map((balance) => (
              <div
                key={`${balance.clientId ?? balance.clientName}`}
                className="border border-grey-dark/60 p-4"
              >
                <p className="font-serif text-lg text-white/90 line-clamp-1">
                  {balance.clientName}
                </p>
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div>
                    <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                      Facturado
                    </p>
                    <p className="font-serif text-base text-white/80">
                      {formatCurrency(balance.invoiced)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                      Recebido
                    </p>
                    <p className="font-serif text-base text-emerald-300/90">
                      {formatCurrency(balance.received)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                      Em falta
                    </p>
                    <p className="font-serif text-base text-amber-300/90">
                      {formatCurrency(balance.outstanding)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="admin-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-admin-gold/70" />
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Principais clientes
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Maiores receitas recebidas
            </h3>
          </div>
        </div>
        {analytics.topClients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topClients.map((client, index) => (
              <div
                key={client.clientName}
                className="border border-grey-dark/60 p-4 hover:border-admin-gold/20 transition-colors"
              >
                <p className="font-mono text-[9px] text-admin-gold/60 mb-2">
                  #{String(index + 1).padStart(2, "0")}
                </p>
                <p className="font-serif text-lg text-white/90 line-clamp-1">
                  {client.clientName}
                </p>
                <p className="font-serif text-2xl font-light text-admin-gold/90 mt-2">
                  {formatCurrency(client.received)}
                </p>
                <p className="text-[10px] text-grey/45 mt-1">
                  {client.documentCount} documento
                  {client.documentCount === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-grey/45 italic">
            Ainda sem clientes com receitas registadas.
          </p>
        )}
      </section>

      {analytics.paymentsEnabled && analytics.payments.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Livro de pagamentos
          </h2>
          <DataTable
            columns={paymentColumns}
            data={analytics.payments.slice(0, 20)}
            keyExtractor={(row) => row.id}
            emptyMessage="Sem pagamentos registados."
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
          Livro de entradas — documentos pagos
        </h2>
        <DataTable
          columns={movementColumns}
          data={analytics.paidMovements.slice(0, 20)}
          keyExtractor={(row) => row.id}
          rowHref={(row) => `/admin/documents/${row.id}`}
          emptyMessage="Ainda não há entradas registadas. Marque documentos como «Pago»."
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
          Pendente de recebimento
        </h2>
        {analytics.pendingCollection.length > 0 ? (
          <DataTable
            columns={movementColumns}
            data={analytics.pendingCollection}
            keyExtractor={(row) => row.id}
            rowHref={(row) => `/admin/documents/${row.id}`}
            emptyMessage="Sem pendências."
          />
        ) : (
          <div className="admin-card p-8 text-center">
            <p className="font-serif text-lg font-light text-white/80">
              Carteira em dia
            </p>
            <p className="text-sm text-grey/55 mt-2">
              Não há facturas ou proformas enviadas à espera de pagamento.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
