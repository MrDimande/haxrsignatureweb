import type { PortalDashboardData } from "@/lib/portal/services/portal-dashboard.service";
import DateHoldBadge from "@/components/shared/DateHoldBadge";

type PortalEventsGridProps = {
  events: PortalDashboardData["events"];
};

function formatDate(date: string | null): string {
  if (!date) return "Data por confirmar";
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function PortalEventsGrid({ events }: PortalEventsGridProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-grey/50">Ainda não há eventos associados à vossa conta.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => (
        <article
          key={event.id}
          className="border border-white/10 rounded-sm p-5 bg-white/[0.02]"
        >
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45">
            {event.typeLabel}
          </p>
          <h3 className="font-serif text-2xl mt-2">{event.name}</h3>
          <div className="mt-2">
            <DateHoldBadge holdUntil={event.dateHoldUntil} variant="portal" />
          </div>
          <p className="text-sm text-grey/55 mt-2">
            {formatDate(event.date)} · {event.location || "Local por confirmar"}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            <div>
              <p className="font-serif text-xl text-admin-gold">
                {event.stats.confirmed + event.stats.checkedIn}
              </p>
              <p className="text-[10px] text-grey/45 uppercase tracking-wider mt-1">
                Confirmados
              </p>
            </div>
            <div>
              <p className="font-serif text-xl">{event.stats.invited}</p>
              <p className="text-[10px] text-grey/45 uppercase tracking-wider mt-1">
                Pendentes
              </p>
            </div>
            <div>
              <p className="font-serif text-xl">{event.stats.declined}</p>
              <p className="text-[10px] text-grey/45 uppercase tracking-wider mt-1">
                Recusados
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-admin-gold"
              style={{ width: `${event.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-grey/45 mt-2">
            Progresso operacional: {event.progressPercent}%
          </p>
        </article>
      ))}
    </div>
  );
}
