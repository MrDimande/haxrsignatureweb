"use client";

import type { PortalTimelineItem } from "@/lib/portal/portal-premium.types";

type EventOperationalTimelinePanelProps = {
  phases: PortalTimelineItem[];
};

const STATUS_LABELS: Record<PortalTimelineItem["status"], string> = {
  scheduled: "Agendado",
  done: "Concluído",
  delayed: "Atrasado",
  skipped: "Ignorado",
};

export default function EventOperationalTimelinePanel({
  phases,
}: EventOperationalTimelinePanelProps) {
  if (phases.length === 0) return null;

  return (
    <section className="admin-card p-6 mb-8 border-white/10 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Timeline operacional
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Briefing → proposta → sinal → convite → RSVP → seating → check-in → relatório
        </h3>
      </div>
      <ol className="space-y-2">
        {phases.map((phase) => (
          <li
            key={phase.id}
            className="flex items-center justify-between gap-4 border border-white/5 px-4 py-3"
          >
            <div>
              <p className="text-sm text-white/85">{phase.title}</p>
              <p className="text-[10px] text-grey/45 uppercase tracking-wider mt-1">
                {phase.category}
              </p>
            </div>
            <span className="text-xs text-admin-gold">{STATUS_LABELS[phase.status]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
