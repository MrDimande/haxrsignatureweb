import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import {
  EVENT_PIPELINE_LABELS,
  resolveEventPipelineStatus,
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
    const pipeline = resolveEventPipelineStatus(event);
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

      <div className="admin-card overflow-hidden border border-admin-gold/15 bg-gradient-to-b from-[#12100e] to-[#080706] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                  {["Evento", "Fase", "Data", "Ocupação & Convidados", "Estado / Alertas"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filtered.map((event) => {
                  const stats = guestStats[event.id];
                  const pipeline = resolveEventPipelineStatus(event);

                  // Calcular percentagem de RSVP confirmado
                  const total = stats?.totalGuests || 0;
                  const confirmed = stats?.confirmed || 0;
                  const confirmedPct = total > 0 ? (confirmed / total) * 100 : 0;

                  return (
                    <tr
                      key={event.id}
                      className="group transition-all duration-300 hover:bg-white/[0.02]"
                    >
                      {/* Evento */}
                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-[13.5px] font-serif font-light text-white group-hover:text-admin-gold transition-colors duration-300"
                        >
                          {event.name}
                        </Link>
                        <p className="text-[10px] font-mono tracking-[0.05em] text-grey-medium mt-1">
                          {EVENT_TYPE_LABELS[event.type]}
                          {businessMap.get(event.businessId)
                            ? ` · ${businessMap.get(event.businessId)}`
                            : ""}
                        </p>
                      </td>

                      {/* Fase */}
                      <td className="px-6 py-5">
                        {pipeline === "active" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono tracking-wider uppercase bg-gold/10 text-admin-gold border border-gold/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                            Em curso
                          </span>
                        ) : pipeline === "planning" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Planeamento
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono tracking-wider uppercase bg-white/[0.04] text-white/50 border border-white/[0.06]">
                            Concluído
                          </span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 font-mono text-xs text-grey-dark/85">
                          <Calendar className="w-3.5 h-3.5 text-admin-gold/70" strokeWidth={1.5} />
                          {formatEventDate(event.date)}
                        </span>
                      </td>

                      {/* Ocupação & Convidados */}
                      <td className="px-6 py-5">
                        {stats ? (
                          <div className="space-y-2 max-w-[220px]">
                            <div className="flex items-center justify-between text-[11px] text-grey-dark/70 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-grey-medium" />
                                {stats.totalGuests} convidados
                              </span>
                              <span>{stats.confirmed} conf.</span>
                            </div>
                            {/* Barra de progresso premium dourada */}
                            <div className="h-[3px] w-full bg-white/[0.05] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-admin-gold-dim to-admin-gold rounded-full transition-all duration-500"
                                style={{ width: `${confirmedPct}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-grey/60 font-mono tracking-wide">
                              {stats.checkedIn} presentes no local
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-grey/40 font-mono">—</span>
                        )}
                      </td>

                      {/* Estado / Alertas */}
                      <td className="px-6 py-5">
                        {stats && stats.unassigned > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9.5px] font-mono tracking-[0.08em] uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_2px_10px_rgba(245,158,11,0.05)] animate-pulse">
                            ⚠️ {stats.unassigned} sem lugar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9.5px] font-mono tracking-[0.08em] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_2px_10px_rgba(16,185,129,0.05)]">
                            ✓ Sem pendências de lugares
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Calendar className="w-8 h-8 mx-auto text-grey/40 mb-3" strokeWidth={1} />
            <p className="font-serif text-base font-light text-white/80">
              Nenhum evento activo neste momento.
            </p>
            <p className="text-xs text-grey/50 mt-1">
              Todos os seus eventos finalizados ou inactivos aparecem no arquivo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
