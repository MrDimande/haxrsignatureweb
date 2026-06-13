"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import { upsertMonthlyTargetAction } from "@/lib/finance/actions/targets.actions";
import { formatCurrency } from "@/lib/calculations";
import type { BusinessId, Currency } from "@/lib/admin/types";
import type { CashAnalytics } from "@/lib/finance/types";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type MonthlyGoalsPanelProps = {
  analytics: CashAnalytics;
  businesses: { id: BusinessId; name: string }[];
  selectedYear: number;
};

export default function MonthlyGoalsPanel({
  analytics,
  businesses,
  selectedYear,
}: MonthlyGoalsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const now = new Date();
  const [businessId, setBusinessId] = useState<BusinessId>(
    businesses[0]?.id ?? "haxr-signature"
  );
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [targetAmount, setTargetAmount] = useState(
    String(analytics.currentMonthTarget?.targetAmount ?? "")
  );
  const [currency, setCurrency] = useState<Currency>("MZN");
  const [message, setMessage] = useState("");

  const yearTargets = analytics.monthlyTargets.filter(
    (target) => target.year === selectedYear
  );

  function handleSave() {
    const amount = Number(targetAmount);
    if (!Number.isFinite(amount) || amount < 0) return;

    startTransition(async () => {
      const result = await upsertMonthlyTargetAction({
        businessId,
        year: selectedYear,
        month,
        targetAmount: amount,
        currency,
      });
      if (result.success) {
        setMessage("Meta guardada.");
        router.refresh();
      }
    });
  }

  if (!analytics.financeExtrasEnabled) return null;

  return (
    <section className="admin-card p-6 md:p-8 space-y-6">
      <div className="flex items-start gap-3">
        <Target className="w-5 h-5 text-admin-gold/80 shrink-0 mt-0.5" />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Metas mensais
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Objectivo vs. realizado
          </h3>
        </div>
      </div>

      {analytics.currentMonthTarget ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-grey/60">
              Este mês · meta{" "}
              {formatCurrency(
                analytics.currentMonthTarget.targetAmount,
                analytics.currentMonthTarget.currency
              )}
            </span>
            <span className="font-serif text-white/90">
              {analytics.currentMonthProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-grey-dark/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-admin-gold/70 to-admin-gold/30 transition-all duration-700"
              style={{ width: `${analytics.currentMonthProgress}%` }}
            />
          </div>
          <p className="text-xs text-grey/50">
            Recebido: {formatCurrency(analytics.margin.monthReceived)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-grey/50 italic">
          Defina uma meta para acompanhar o progresso do mês.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminSelect
          label="Empresa"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value as BusinessId)}
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Mês"
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <AdminInput
          label="Meta (MZN)"
          type="number"
          min="0"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="admin-btn-secondary w-full"
          >
            {isPending ? "A guardar…" : "Guardar meta"}
          </button>
        </div>
      </div>

      {message ? <p className="text-xs text-emerald-300/80">{message}</p> : null}

      {yearTargets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {yearTargets.slice(0, 8).map((target) => (
            <div
              key={target.id}
              className="border border-grey-dark/60 px-3 py-3"
            >
              <p className="font-mono text-[8px] uppercase text-grey/45">
                {MONTHS[target.month - 1]}
              </p>
              <p className="font-serif text-base text-white/85 mt-1">
                {formatCurrency(target.targetAmount, target.currency)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
