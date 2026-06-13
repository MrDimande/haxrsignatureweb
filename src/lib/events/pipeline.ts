import type { ManagedEvent } from "@/lib/events/types";

export type EventPipelineStatus = "planning" | "active" | "completed";

export const EVENT_PIPELINE_LABELS: Record<EventPipelineStatus, string> = {
  planning: "Novos",
  active: "Em andamento",
  completed: "Finalizados",
};

export const EVENT_PIPELINE_HINTS: Record<EventPipelineStatus, string> = {
  planning: "Sem data definida — em planeamento",
  active: "Data futura ou hoje — produção activa",
  completed: "Evento realizado ou arquivado",
};

function startOfTodayMaputo(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

function parseEventDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function resolveEventPipelineStatus(
  event: ManagedEvent
): EventPipelineStatus {
  if (!event.isActive) return "completed";
  if (!event.date) return "planning";

  const today = startOfTodayMaputo();
  const eventDate = parseEventDate(event.date);

  if (eventDate < today) return "completed";
  return "active";
}

export function groupEventsByPipeline(events: ManagedEvent[]) {
  const groups: Record<EventPipelineStatus, ManagedEvent[]> = {
    planning: [],
    active: [],
    completed: [],
  };

  for (const event of events) {
    groups[resolveEventPipelineStatus(event)].push(event);
  }

  const sortByDate = (a: ManagedEvent, b: ManagedEvent) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1;
    if (!b.date) return 1;
    return b.date.localeCompare(a.date);
  };

  groups.planning.sort(sortByDate);
  groups.active.sort(sortByDate);
  groups.completed.sort(sortByDate);

  return groups;
}

export function countEventsByPipeline(events: ManagedEvent[]) {
  const groups = groupEventsByPipeline(events);
  return {
    planning: groups.planning.length,
    active: groups.active.length,
    completed: groups.completed.length,
    total: events.length,
  };
}
