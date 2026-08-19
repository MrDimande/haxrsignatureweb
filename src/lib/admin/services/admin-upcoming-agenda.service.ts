import type { ManagedEvent } from "@/lib/events/types";
import type { BusinessId, EventType } from "@/lib/admin/types";
import type {
  PortalTimelineCategory,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
import { resolveEventPipelineStatus } from "@/lib/events/pipeline";

export type AdminUpcomingAgendaItem = {
  id: string;
  eventId: string;
  eventName: string;
  eventType: EventType;
  businessId: BusinessId;

  title: string;
  description: string | null;

  startsAt: string;
  endsAt: string | null;

  category: PortalTimelineCategory;
  visibility: "client" | "internal";
  status: "scheduled" | "delayed";

  href: string;
};

export type AdminUpcomingAgenda = {
  available: boolean;
  items: AdminUpcomingAgendaItem[];
};

export type BuildAdminUpcomingAgendaSource = {
  events: ManagedEvent[];
  timeline: {
    available: boolean;
    items: PortalTimelineItem[];
  };
};

export type BuildAdminUpcomingAgendaOptions = {
  now?: Date;
  days?: number;
};

/**
 * Pure builder that interprets raw operational timelines into a deterministic
 * master operational agenda for the upcoming window (default: 14 days).
 *
 * Free of side-effects and database queries.
 * Evaluates exact timestamps relative to an injected `now`.
 */
export function buildAdminUpcomingAgenda(
  source: BuildAdminUpcomingAgendaSource,
  options?: BuildAdminUpcomingAgendaOptions
): AdminUpcomingAgenda {
  if (!source.timeline.available) {
    return {
      available: false,
      items: [],
    };
  }

  const now = options?.now ?? new Date();
  const days = options?.days ?? 14;

  const windowStartTime = now.getTime();
  const windowEndTime = windowStartTime + days * 24 * 60 * 60 * 1000;

  const operationalEventsMap = new Map<string, ManagedEvent>();
  for (const event of source.events) {
    const pipeline = resolveEventPipelineStatus(event, now);
    if (pipeline === "planning" || pipeline === "active") {
      operationalEventsMap.set(event.id, event);
    }
  }

  const items: AdminUpcomingAgendaItem[] = [];

  for (const item of source.timeline.items) {
    const event = operationalEventsMap.get(item.eventId);
    if (!event) {
      continue;
    }

    if (item.status !== "scheduled" && item.status !== "delayed") {
      continue;
    }

    const startDate = new Date(item.startsAt);
    const startTime = startDate.getTime();

    if (Number.isNaN(startTime)) {
      continue;
    }

    if (startTime < windowStartTime || startTime > windowEndTime) {
      continue;
    }

    items.push({
      id: item.id,
      eventId: event.id,
      eventName: event.name,
      eventType: event.type,
      businessId: event.businessId,
      title: item.title,
      description: item.description,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      category: item.category,
      visibility: item.visibility,
      status: item.status,
      href: `/admin/events/${event.id}`,
    });
  }

  // Deterministic sorting:
  // 1. startsAt ascending (earliest milestone first)
  // 2. eventName ascending
  // 3. title ascending
  // 4. id tie-breaker
  items.sort((a, b) => {
    const timeDiff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (timeDiff !== 0) return timeDiff;

    const nameDiff = a.eventName.localeCompare(b.eventName);
    if (nameDiff !== 0) return nameDiff;

    const titleDiff = a.title.localeCompare(b.title);
    if (titleDiff !== 0) return titleDiff;

    return a.id.localeCompare(b.id);
  });

  return {
    available: true,
    items,
  };
}
