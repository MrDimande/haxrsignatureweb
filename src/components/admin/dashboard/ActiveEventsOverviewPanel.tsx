import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import {
  EVENT_PIPELINE_LABELS,
  type EventPipelineStatus,
} from "@/lib/events/pipeline";
import type { EventListGuestStats, ManagedEvent } from "@/lib/events/types";

type ActiveEventsOverviewPanelProps = {
  events: ManagedEvent[];
  guestStats: Record<string, EventListGuestStats>;
  businessMap: Map<string, string>;
  statuses?: EventPipelineStatus[];
};

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function ActiveEventsOverviewPanel({
  events,
  guestStats,
  businessMap,
  statuses = ["planning", "active"],
}: ActiveEventsOverviewPanelProps) {
  const filtered = events.filter((event) => {
    if (!event.isActive) return false;
    const today = new Date().toISOString().slice(0, 10);
    const pipeline: EventPipelineStatus = !event.date
      ? "planning"
      : event.date >= today
        ? "active"
        : "completed";
    return statuses.includes(pipeline);
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Eventos activos — visão global
          </h2>
          <p className="mt-2 text-sm text-grey/55">
            Todos os eventos em preparação e em curso, com KPIs de convidados.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 shrink-0"
        >
          Gerir eventos →
        </Link>
      </div>

      <div className="admin-card overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-grey-dark/80 bg-black-soft">
                  {["Evento", "Fase", "Data", "Convidados", "Alertas"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => {
                  const stats = guestStats[event.id];
                  const today = new Date().toISOString().slice(0, 10);
                  const pipeline: EventPipelineStatus = !event.date
                    ? "planning"
                    : event.date >= today
                      ? "active"
                      : "completed";

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-grey-dark/50 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-white/90 hover:text-admin-gold transition-colors"
                        >
                          {event.name}
                        </Link>
                        <p className="text-[10px] text-grey/45 mt-1">
                          {EVENT_TYPE_LABELS[event.type]}
                          {businessMap.get(event.businessId)
                            ? ` · ${businessMap.get(event.businessId)}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-grey/60">
                        {EVENT_PIPELINE_LABELS[pipeline]}
                      </td>
                      <td className="px-5 py-4 text-sm text-grey font-mono">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatEventDate(event.date)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-grey/75">
                        {stats ? (
                          <span className="inline-flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {stats.totalGuests} total · {stats.confirmed} conf. ·{" "}
                            {stats.checkedIn} presentes
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {stats && stats.unassigned > 0 ? (
                          <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-amber-300/80">
                            {stats.unassigned} sem lugar
                          </span>
                        ) : (
                          <span className="text-xs text-grey/40">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-sm text-grey/60 text-center">
            Nenhum evento activo neste momento.
          </p>
        )}
      </div>
    </section>
  );
}
