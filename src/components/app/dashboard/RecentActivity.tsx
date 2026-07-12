import type { DashboardRecentActivity } from "@/lib/dashboard/types";

type RecentActivityProps = {
  items: DashboardRecentActivity[];
};

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-champagne/10 bg-white/5 p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-serif text-lg font-light text-white">Actividade</h3>
        <span className="font-mono text-[9px] uppercase text-zinc-500">Recente</span>
      </div>

      {items.length === 0 ? (
        <p className="font-sans text-xs font-light text-zinc-500">Sem actividade recente.</p>
      ) : (
        <div className="space-y-4">
          {items.map((activity) => (
            <div key={activity.id} className="space-y-1 text-left text-xs">
              <p className="font-sans font-light leading-snug text-zinc-200">
                {activity.description ?? activity.title}
              </p>
              <p className="font-mono text-[9px] text-zinc-500">{activity.relativeLabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
