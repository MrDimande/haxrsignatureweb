import type { DashboardFinanceSnapshot } from "@/lib/dashboard/types";
import { formatCurrencyMZN } from "@/lib/formatters";
import { Wallet } from "lucide-react";

type FinanceSnapshotProps = {
  finance: DashboardFinanceSnapshot;
};

export default function FinanceSnapshotCard({ finance }: FinanceSnapshotProps) {
  const { currency } = finance;

  return (
    <div className="haxr-dashboard-card flex flex-1 flex-col justify-between rounded-3xl border border-brand-champagne/10 bg-white/5 p-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="font-serif text-sm text-white">Financeiro</h4>
        <Wallet className="h-4 w-4 text-brand-gold" />
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 font-sans text-xs">
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Estimado</p>
          <p className="font-medium text-white">
            {formatCurrencyMZN(finance.budgetEstimated, currency)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Registado</p>
          <p className="font-medium text-white">
            {formatCurrencyMZN(finance.budgetRegistered, currency)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Pago</p>
          <p className="font-medium text-emerald-400">
            {formatCurrencyMZN(finance.paidAmount, currency)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Pendente</p>
          <p className="font-medium text-brand-gold">
            {formatCurrencyMZN(finance.pendingAmount, currency)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-left text-[10px]">
        <span className="font-mono text-[8px] uppercase text-zinc-500">Próximo Vencimento</span>
        <p className="mt-1 truncate font-medium text-white">{finance.nextPayment.vendorName}</p>
        <div className="mt-1 flex justify-between text-[9px] text-zinc-400">
          <span>{finance.nextPayment.dueDate}</span>
          <span className="font-semibold text-brand-gold">
            {formatCurrencyMZN(finance.nextPayment.amount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
