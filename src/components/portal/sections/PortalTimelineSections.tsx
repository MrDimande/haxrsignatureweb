import type { PortalDashboardData } from "@/lib/portal/services/portal-dashboard.service";
import type { PortalTimelineEntry } from "@/lib/portal/services/portal-timeline.service";

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

type PortalProjectTimelineProps = {
  timeline: PortalTimelineEntry[];
};

export function PortalProjectTimeline({ timeline }: PortalProjectTimelineProps) {
  if (timeline.length === 0) {
    return <p className="text-sm text-grey/50">Sem actividade registada ainda.</p>;
  }

  return (
    <ol className="border-l border-white/10 ml-2 space-y-4">
      {timeline.map((entry) => (
        <li key={entry.id} className="pl-5 relative">
          <span className="absolute -left-[0.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-admin-gold" />
          <p className="text-sm text-white/90">{entry.title}</p>
          {entry.description ? (
            <p className="text-xs text-grey/50 mt-1">{entry.description}</p>
          ) : null}
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-grey/40 mt-2">
            {formatWhen(entry.occurredAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

type PortalOperationalTimelineProps = {
  phases: PortalDashboardData["operationalTimeline"];
};

export function PortalOperationalTimeline({ phases }: PortalOperationalTimelineProps) {
  if (phases.length === 0) {
    return (
      <p className="text-sm text-grey/50">
        O cronograma operacional será publicado pela equipa HAXR.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {phases.map((phase) => (
        <li
          key={phase.id}
          className="flex items-center justify-between gap-4 border border-white/5 px-4 py-3 rounded-sm"
        >
          <div>
            <p className="text-sm text-white/85">{phase.title}</p>
            <p className="text-[10px] text-grey/45 uppercase tracking-wider mt-1">
              {phase.category}
            </p>
          </div>
          <span className="text-xs text-admin-gold uppercase tracking-wider">
            {phase.status === "done"
              ? "Concluído"
              : phase.status === "delayed"
                ? "Atrasado"
                : phase.status === "skipped"
                  ? "Ignorado"
                  : "Agendado"}
          </span>
        </li>
      ))}
    </ol>
  );
}
