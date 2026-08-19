import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import {
  EVENT_PIPELINE_HINTS,
  EVENT_PIPELINE_LABELS,
  type EventPipelineStatus,
} from "@/lib/events/pipeline";
import type { ManagedEvent } from "@/lib/events/types";

type EventPipelinePanelProps = {
  groups: Record<EventPipelineStatus, ManagedEvent[]>;
  businessMap: Map<string, string>;
};

const PIPELINE_ORDER: EventPipelineStatus[] = [
  "planning",
  "active",
  "completed",
];

// Point 4: No blue. Planning → warm ivory/champagne; Active → HAXR gold; Completed → graphite/warm neutral
const PIPELINE_STYLES: Record<EventPipelineStatus, string> = {
  planning:
    "border-[#c8b89a]/15 bg-gradient-to-b from-[#c8b89a]/[0.025] to-[#0a0908] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
  active:
    "border-admin-gold/25 bg-gradient-to-b from-admin-gold/[0.04] to-[#0a0908] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
  completed:
    "border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-[#0a0908] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
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

export default function EventPipelinePanel({
  groups,
  businessMap,
}: EventPipelinePanelProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Pipeline de eventos
          </h2>
          {/* Point 3: updated supporting copy */}
          <p className="mt-2 text-sm text-grey/55">
            Distribuição temporal dos eventos registados.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 shrink-0 inline-flex items-center gap-1"
        >
          <span>Ver todos</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PIPELINE_ORDER.map((status) => {
          // Point 3: slice(0, 2) instead of slice(0, 5)
          const events = groups[status].slice(0, 2);
          return (
            <div
              key={status}
              className={`p-6 border transition-all duration-300 hover:border-admin-gold/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${PIPELINE_STYLES[status]}`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey-medium">
                  {EVENT_PIPELINE_LABELS[status]}
                </p>
                <span className="font-serif text-2xl font-light text-white/95">
                  {groups[status].length}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-grey/60 mb-5">
                {EVENT_PIPELINE_HINTS[status]}
              </p>

              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-grey/40 font-mono italic">
                    Nenhum evento nesta fase.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {events.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="block p-3 rounded-lg bg-white/[0.01] border border-white/[0.02] hover:border-admin-gold/20 hover:bg-white/[0.03] transition-all duration-300 group"
                      >
                        <p className="text-[13px] font-serif font-light text-white group-hover:text-admin-gold transition-colors duration-300 line-clamp-1">
                          {event.name}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p className="text-[9.5px] font-mono text-grey-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-admin-gold/50" strokeWidth={1.5} />
                            {formatEventDate(event.date)}
                          </p>
                          <p className="text-[9px] text-grey/50 font-mono tracking-wide">
                            {EVENT_TYPE_LABELS[event.type]}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
