import Link from "next/link";
import { Calendar } from "lucide-react";
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

const PIPELINE_STYLES: Record<EventPipelineStatus, string> = {
  planning: "border-blue-500/20 bg-blue-500/5",
  active: "border-admin-gold/25 bg-admin-gold/5",
  completed: "border-grey-dark/80 bg-black-soft/30",
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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Pipeline de eventos
          </h2>
          <p className="mt-2 text-sm text-grey/55">
            Novos, em produção e finalizados — num relance.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 shrink-0"
        >
          Ver todos →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PIPELINE_ORDER.map((status) => {
          const events = groups[status].slice(0, 5);
          return (
            <div
              key={status}
              className={`admin-card p-5 border ${PIPELINE_STYLES[status]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/70">
                  {EVENT_PIPELINE_LABELS[status]}
                </p>
                <span className="font-serif text-2xl font-light text-white/90">
                  {groups[status].length}
                </span>
              </div>
              <p className="text-xs text-grey/45 mb-4 leading-relaxed">
                {EVENT_PIPELINE_HINTS[status]}
              </p>

              {events.length === 0 ? (
                <p className="text-xs text-grey/40 italic py-4">
                  Nenhum evento nesta fase.
                </p>
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="block group"
                      >
                        <p className="text-sm text-white/85 group-hover:text-admin-gold transition-colors line-clamp-1">
                          {event.name}
                        </p>
                        <p className="text-[10px] font-mono text-grey/45 mt-1 flex items-center gap-2">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {formatEventDate(event.date)}
                        </p>
                        <p className="text-[10px] text-grey/40 mt-0.5">
                          {EVENT_TYPE_LABELS[event.type]}
                          {businessMap.get(event.businessId)
                            ? ` · ${businessMap.get(event.businessId)}`
                            : ""}
                        </p>
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
