import Link from "next/link";
import { ArrowUpRight, Calendar, Clock, AlertCircle } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import { formatDateTimePtMZ } from "@/lib/formatters";
import type { PortalTimelineCategory } from "@/lib/portal/portal-premium.types";
import type { AdminUpcomingAgenda } from "@/lib/admin/services/admin-upcoming-agenda.service";

export const TIMELINE_CATEGORY_LABELS: Record<PortalTimelineCategory, string> = {
  briefing: "Briefing",
  proposal: "Proposta",
  deposit: "Sinal",
  invite: "Convite",
  rsvp: "RSVP",
  seating: "Seating",
  checkin: "Check-in",
  report: "Relatório",
  milestone: "Marco",
  meeting: "Reunião",
  delivery: "Entrega",
  event_day: "Dia-D",
  other: "Outro",
};

export const AGENDA_STATUS_LABELS: Record<"scheduled" | "delayed", string> = {
  scheduled: "Agendado",
  delayed: "Atrasado",
};

type UpcomingOperationalAgendaPanelProps = {
  upcoming: AdminUpcomingAgenda;
  maxVisible?: number;
};

export default function UpcomingOperationalAgendaPanel({
  upcoming,
  maxVisible = 8,
}: UpcomingOperationalAgendaPanelProps) {
  const { available, items } = upcoming;
  const visibleItems = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase text-admin-gold">
              Agenda Operacional
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey/50">
              Timeline Master
            </span>
          </div>
          <h2 className="font-serif text-2xl font-light text-white mt-1">
            Próximos 14 dias
          </h2>
          <p className="mt-1 text-xs text-grey-medium leading-relaxed">
            Marcos registados na timeline operacional dos projectos.
          </p>
        </div>

        {available && items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-grey/50 tracking-wider uppercase">
              {items.length} {items.length === 1 ? "marco previsto" : "marcos previstos"}
            </span>
            <Link
              href="/admin/events"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 ml-2 inline-flex items-center gap-1 shrink-0"
            >
              <span>Ver eventos</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="admin-card overflow-hidden border border-admin-gold/15 bg-gradient-to-b from-[#12100e] to-[#080706] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {!available ? (
          /* Unavailable State */
          <div className="text-center py-12 px-6">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-white font-light">
              Timeline operacional indisponível neste ambiente.
            </h3>
            <p className="text-xs text-grey-medium mt-1 font-mono">
              Não foi possível aceder aos marcos temporais dos eventos.
            </p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-6">
            <Clock className="w-8 h-8 text-grey/30 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-white font-light">
              Sem marcos registados para os próximos 14 dias.
            </h3>
            <p className="text-xs text-grey-medium mt-1 font-mono">
              A agenda reflecte apenas itens existentes na timeline operacional.
            </p>
          </div>
        ) : (
          /* Populated Table Surface */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                  <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                    Data & Hora
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                    Marco Operacional
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                    Projecto
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                    Categoria & Estado
                  </th>
                  <th className="px-6 py-4 text-right font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                    Acção
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {visibleItems.map((item) => {
                  const isDelayed = item.status === "delayed";
                  const categoryLabel =
                    TIMELINE_CATEGORY_LABELS[item.category] || item.category;
                  const statusLabel =
                    AGENDA_STATUS_LABELS[item.status] || item.status;

                  return (
                    <tr
                      key={item.id}
                      className="group transition-all duration-300 hover:bg-white/[0.02]"
                    >
                      {/* Data & Hora */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-grey-dark/90">
                          <Calendar
                            className="w-3.5 h-3.5 text-admin-gold/70 shrink-0"
                            strokeWidth={1.5}
                          />
                          <span>{formatDateTimePtMZ(item.startsAt)}</span>
                        </div>
                      </td>

                      {/* Marco Operacional */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-serif font-light text-white group-hover:text-admin-gold transition-colors duration-300">
                              {item.title}
                            </span>
                            {item.visibility === "internal" && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                                Interno
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[10.5px] text-grey/50 font-mono line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Projecto */}
                      <td className="px-6 py-4.5">
                        <Link
                          href={item.href}
                          className="text-xs font-serif font-light text-white/90 hover:text-admin-gold transition-colors block"
                        >
                          {item.eventName}
                        </Link>
                        <p className="text-[10px] font-mono text-grey/50 mt-0.5">
                          {EVENT_TYPE_LABELS[item.eventType] || item.eventType}
                        </p>
                      </td>

                      {/* Categoria & Estado */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[8.5px] font-mono tracking-wider uppercase bg-white/[0.04] text-grey-medium border border-white/[0.08]">
                            {categoryLabel}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] font-mono tracking-wider uppercase flex items-center gap-1 ${
                              isDelayed
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                                : "bg-admin-gold/10 text-admin-gold border border-admin-gold/20"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isDelayed ? "bg-amber-400" : "bg-admin-gold"
                              }`}
                            />
                            {statusLabel}
                          </span>
                        </div>
                      </td>

                      {/* Acção */}
                      <td className="px-6 py-4.5 text-right whitespace-nowrap">
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase text-admin-gold border border-admin-gold/20 bg-admin-gold/5 hover:bg-admin-gold/15 hover:border-admin-gold/40 transition-all duration-200"
                        >
                          <span>Abrir projecto</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer when items exceed display limit */}
        {available && hasMore && (
          <div className="border-t border-white/[0.04] px-6 py-3.5 bg-white/[0.01] flex items-center justify-between">
            <span className="text-[10px] font-mono text-grey/50">
              A mostrar {visibleItems.length} de {items.length} marcos
            </span>
            <Link
              href="/admin/events"
              className="text-[10px] font-mono text-admin-gold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver eventos</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
