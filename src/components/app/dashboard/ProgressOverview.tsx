import type { DashboardProgressItem } from "@/lib/dashboard/types";
import { formatPercentage } from "@/lib/formatters";

type ProgressOverviewProps = {
  items: DashboardProgressItem[];
};

export default function ProgressOverview({ items }: ProgressOverviewProps) {
  return (
    <div className="haxr-dashboard-card flex min-h-[220px] flex-col justify-between rounded-3xl border border-brand-champagne/15 bg-[#120e0d] p-6 shadow-lg md:p-8">
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-light text-white">Progresso de Planeamento</h3>
        <p className="font-sans text-xs font-light text-zinc-400">
          Evolução detalhada por cada pilar operacional do evento.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {items.map((metric) => (
          <div key={metric.id} className="space-y-1">
            <div className="flex justify-between font-sans text-[10px] font-light text-zinc-400">
              <span className="truncate pr-1">{metric.name}</span>
              <span className="font-mono font-semibold text-brand-gold">
                {formatPercentage(metric.value)}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-brand-gold transition-all duration-500"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
