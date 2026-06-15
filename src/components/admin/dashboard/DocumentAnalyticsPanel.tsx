import Link from "next/link";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";

type DocumentAnalyticsPanelProps = {
  fiscalYear: number;
  revenueByBusiness: { businessId: string; businessName: string; total: number }[];
  revenueByMonth: { month: number; total: number; count: number }[];
};

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function DocumentAnalyticsPanel({
  fiscalYear,
  revenueByBusiness,
  revenueByMonth,
}: DocumentAnalyticsPanelProps) {
  const yearTotal = revenueByBusiness.reduce((sum, row) => sum + row.total, 0);
  const maxMonthTotal = Math.max(...revenueByMonth.map((row) => row.total), 1);
  const documentCount = revenueByMonth.reduce((sum, row) => sum + row.count, 0);

  if (yearTotal === 0 && documentCount === 0) {
    return (
      <section className="admin-card p-8 text-center">
        <BarChart3 className="w-5 h-5 text-admin-gold/50 mx-auto mb-4" />
        <p className="font-serif text-lg font-light text-white/80">
          Análise documental
        </p>
        <p className="text-sm text-grey/55 mt-2 max-w-md mx-auto">
          Quando emitir facturas ou recibos pagos, os totais por empresa e mês
          aparecem aqui automaticamente.
        </p>
        <Link
          href="/admin/documents/new?type=invoice"
          className="admin-btn-primary inline-flex mt-6"
        >
          Criar documento
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Análise documental · {fiscalYear}
          </h2>
          <p className="mt-2 text-sm text-grey/55 max-w-xl">
            Receita consolidada a partir da view{" "}
            <span className="font-mono text-xs text-grey/70">document_analytics</span>{" "}
            — documentos pagos por empresa e mês fiscal.
          </p>
        </div>
        <Link href="/admin/documents" className="admin-btn-secondary">
          Ver documentos
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-stat-card">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 mb-3">
            Receita {fiscalYear}
          </p>
          <p className="font-serif text-2xl md:text-3xl font-light text-white">
            {formatCurrency(yearTotal)}
          </p>
          <p className="text-xs text-grey/45 mt-2">Documentos pagos no ano</p>
        </div>
        <div className="admin-stat-card">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 mb-3">
            Documentos
          </p>
          <p className="font-serif text-2xl md:text-3xl font-light text-white">
            {documentCount}
          </p>
          <p className="text-xs text-grey/45 mt-2">Com movimento fiscal registado</p>
        </div>
        <div className="admin-stat-card">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 mb-3">
            Empresas
          </p>
          <p className="font-serif text-2xl md:text-3xl font-light text-white">
            {revenueByBusiness.length}
          </p>
          <p className="text-xs text-grey/45 mt-2">Com receita no período</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-5">
          <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/45 mb-4">
            Por empresa
          </h3>
          <ul className="space-y-3">
            {revenueByBusiness.map((row) => {
              const share = yearTotal > 0 ? (row.total / yearTotal) * 100 : 0;
              return (
                <li key={row.businessId}>
                  <div className="flex items-center justify-between gap-4 text-sm mb-1.5">
                    <span className="text-white/80">{row.businessName}</span>
                    <span className="font-mono text-xs text-grey/60 shrink-0">
                      {formatCurrency(row.total)}
                    </span>
                  </div>
                  <div className="h-1 bg-grey-dark/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-admin-gold/60 rounded-full"
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="admin-card p-5">
          <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/45 mb-4">
            Por mês
          </h3>
          {revenueByMonth.length > 0 ? (
            <ul className="space-y-3">
              {revenueByMonth.map((row) => {
                const width = (row.total / maxMonthTotal) * 100;
                return (
                  <li key={row.month}>
                    <div className="flex items-center justify-between gap-4 text-sm mb-1.5">
                      <span className="text-white/80 w-8">
                        {MONTH_LABELS[row.month - 1] ?? row.month}
                      </span>
                      <span className="font-mono text-xs text-grey/60 shrink-0">
                        {formatCurrency(row.total)} · {row.count} doc
                        {row.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-1 bg-grey-dark/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/25 rounded-full"
                        style={{ width: `${Math.max(width, 4)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-grey/55">Sem movimento mensal registado.</p>
          )}
        </div>
      </div>
    </section>
  );
}
