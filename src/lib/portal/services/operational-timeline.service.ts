import type { PortalTimelineItem } from "@/lib/portal/portal-premium.types";

export type EventProgressPhase = {
  id: string;
  title: string;
  category: string;
  status: PortalTimelineItem["status"];
  percent: number;
};

export function calculateEventProgress(
  phases: PortalTimelineItem[]
): { percent: number; phases: EventProgressPhase[] } {
  if (phases.length === 0) {
    return { percent: 0, phases: [] };
  }

  const mapped = phases.map((phase) => {
    const percent =
      phase.status === "done"
        ? 100
        : phase.status === "delayed"
          ? 35
          : phase.status === "skipped"
            ? 100
            : 0;
    return {
      id: phase.id,
      title: phase.title,
      category: phase.category,
      status: phase.status,
      percent,
    };
  });

  const total = mapped.reduce((sum, phase) => sum + phase.percent, 0);
  return {
    percent: Math.round(total / mapped.length),
    phases: mapped,
  };
}

export function getNextOperationalDecision(
  phases: PortalTimelineItem[]
): PortalTimelineItem | null {
  const pending = phases
    .filter((phase) => phase.status === "scheduled" || phase.status === "delayed")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return pending[0] ?? null;
}
