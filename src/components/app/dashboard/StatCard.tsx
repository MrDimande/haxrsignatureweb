import type { DashboardStatCard } from "@/lib/dashboard/types";
import { formatCurrencyMZN } from "@/lib/formatters";

type StatCardProps = {
  stat: DashboardStatCard;
  currency?: string;
};

function formatStatValue(stat: DashboardStatCard, currency: string): string | number {
  if (stat.valueType === "currency" && typeof stat.value === "number") {
    return formatCurrencyMZN(stat.value, currency);
  }
  return stat.value;
}

export default function StatCard({ stat, currency = "MT" }: StatCardProps) {
  return (
    <div className="haxr-dashboard-card flex flex-col justify-between rounded-2xl border border-brand-champagne/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-gold/35">
      <p className="font-sans text-[10px] leading-tight text-zinc-500">{stat.label}</p>
      <p className="my-2.5 font-serif text-xl font-light text-white sm:text-2xl">
        {formatStatValue(stat, currency)}
      </p>
      <p className="truncate font-sans text-[9px] text-brand-gold/70">{stat.detail}</p>
    </div>
  );
}
