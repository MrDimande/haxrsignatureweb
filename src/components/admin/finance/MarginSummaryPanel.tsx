import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import type { CashAnalytics } from "@/lib/finance/types";

type MarginSummaryPanelProps = {
  analytics: CashAnalytics;
};

export default function MarginSummaryPanel({
  analytics,
}: MarginSummaryPanelProps) {
  const { margin } = analytics;
  const positive = margin.netMargin >= 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="admin-stat-card border-emerald-500/15">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
            Margem líquida total
          </p>
          <Scale className="w-4 h-4 text-admin-gold/60" />
        </div>
        <p
          className={`font-serif text-2xl md:text-3xl font-light ${
            positive ? "text-emerald-300/90" : "text-red-300/80"
          }`}
        >
          {formatCurrency(margin.netMargin)}
        </p>
        <p className="text-xs text-grey/45 mt-2">
          {margin.marginRate.toFixed(0)}% sobre{" "}
          {formatCurrency(margin.totalReceived)} recebidos
        </p>
      </div>

      <div className="admin-stat-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
            Despesas totais
          </p>
          <TrendingDown className="w-4 h-4 text-red-300/60" />
        </div>
        <p className="font-serif text-2xl md:text-3xl font-light text-white">
          {formatCurrency(margin.totalExpenses)}
        </p>
        <p className="text-xs text-grey/45 mt-2">
          Este mês: {formatCurrency(margin.monthExpenses)}
        </p>
      </div>

      <div className="admin-stat-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
            Margem do mês
          </p>
          <TrendingUp className="w-4 h-4 text-admin-gold/60" />
        </div>
        <p className="font-serif text-2xl md:text-3xl font-light text-white">
          {formatCurrency(margin.monthNetMargin)}
        </p>
        <p className="text-xs text-grey/45 mt-2">
          Recebido: {formatCurrency(margin.monthReceived)}
        </p>
      </div>
    </section>
  );
}
