import {
  aggregateGuestMetrics,
} from "@/lib/dashboard/client-event-operational-kpis";
import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  EventModuleContext,
  Guest,
  GuestGroup,
  GuestModuleData,
  PortalRsvpStatus,
} from "@/lib/event-modules/types";
import type {
  ClientEventOperationalReader,
  OperationalGuestRow,
  OperationalGuestSeatRow,
} from "@/lib/portal/client-event-operational.neon.repository";
import {
  type ClientEventGuestsRpcPayload,
} from "@/lib/guests/client-event-guests-rpc";

export type ClientEventGuestsAuthClient = ClientEventDashboardAuthClient;

export type ClientEventGuestsAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: ClientEventRow }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: GuestModuleData };

export type { OperationalGuestRow, OperationalGuestSeatRow };

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapEventTypeLabel(type: ClientEventRow["event_type"]): string {
  switch (type) {
    case "wedding":
      return "Casamento";
    case "birthday":
      return "Aniversário";
    case "corporate":
      return "Corporativo";
    case "baby_shower":
      return "Baby shower";
    case "graduation":
      return "Formatura";
    case "other":
      return "Evento";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function mapGuestStatusToRsvp(
  status: string,
  checkedIn: boolean,
): PortalRsvpStatus {
  if (checkedIn || status === "checked_in" || status === "confirmed") {
    return "confirmado";
  }
  if (status === "declined") {
    return "recusado";
  }
  if (status === "invited") {
    return "pendente";
  }
  return "sem_resposta";
}

function formatTableLabel(
  seat: OperationalGuestSeatRow | null,
): string | undefined {
  if (!seat) return undefined;
  const label = seat.label?.trim();
  if (label) return label;
  return `Mesa ${seat.table_name}`;
}

export function buildGuestModuleContext(event: ClientEventRow): EventModuleContext {
  return {
    eventId: event.id,
    currency: "MT",
    eventOverview: {
      name: event.event_name,
      type: mapEventTypeLabel(event.event_type),
      date: formatEventDate(event.event_date),
      location: event.event_location || "Local por definir",
      status: event.status === "planning" ? "Em planeamento" : event.status,
      slug: event.slug,
    },
  };
}

export function mapOperationalGuestRow(row: OperationalGuestRow): Guest {
  const seat = row.seats ?? null;
  const group = row.guest_groups ?? null;
  const checkin = row.checkins ?? null;
  const checkedIn = row.status === "checked_in" || Boolean(checkin?.checkin_time);

  return {
    id: row.id,
    name: row.name,
    group: group?.name?.trim() || "Sem grupo",
    phone: row.phone?.trim() || "—",
    email: row.email?.trim() || undefined,
    rsvpStatus: mapGuestStatusToRsvp(row.status, checkedIn),
    plusOnes: row.plus_ones ?? 0,
    table: formatTableLabel(seat),
    inviteSent: row.invite_sent ?? false,
    checkedIn,
    updatedAt: row.updated_at,
  };
}

export function buildGuestGroups(guests: Guest[]): GuestGroup[] {
  const counts = new Map<string, number>();

  for (const guest of guests) {
    const name = guest.group || "Sem grupo";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, guestCount], index) => ({
      id: `group-${index + 1}`,
      name,
      guestCount,
    }))
    .sort((a, b) => b.guestCount - a.guestCount);
}

export function mapOperationalGuestsToModuleData(
  event: ClientEventRow,
  guestRows: OperationalGuestRow[],
  tablesTotal: number,
): GuestModuleData {
  const guests = guestRows.map(mapOperationalGuestRow);
  const metrics = aggregateGuestMetrics(
    guestRows.map((row) => ({
      status: row.status,
      plus_ones: row.plus_ones,
      seat_id: row.seat_id,
    })),
  );

  return {
    context: buildGuestModuleContext(event),
    summary: {
      total: metrics.guestsTotal,
      confirmed: metrics.guestsConfirmed,
      pending: metrics.guestsPending,
      declined: metrics.guestsDeclined,
      plusOnes: metrics.guestsPlusOnes,
      tablesAssigned: metrics.tablesAssigned,
      tablesTotal,
    },
    groups: buildGuestGroups(guests),
    guests,
    importSummary: {
      importedCount: 0,
    },
  };
}

export function mapRpcPayloadToModuleData(
  event: ClientEventRow,
  payload: ClientEventGuestsRpcPayload,
): GuestModuleData {
  const guests = payload.guests.map(mapOperationalGuestRow);

  return {
    context: buildGuestModuleContext(event),
    summary: {
      total: payload.summary.total,
      confirmed: payload.summary.confirmed,
      pending: payload.summary.pending,
      declined: payload.summary.declined,
      plusOnes: payload.summary.plusOnes,
      tablesAssigned: payload.summary.tablesAssigned,
      tablesTotal: payload.summary.tablesTotal,
    },
    groups: buildGuestGroups(guests),
    guests,
    importSummary: {
      importedCount: 0,
    },
  };
}

export async function getClientEventGuestsData(input: {
  authClient: ClientEventGuestsAuthClient;
  operationalReader: ClientEventOperationalReader;
  userId: string;
  eventId: string;
}): Promise<ClientEventGuestsAccessResult> {
  const access = await resolveClientEventDashboardAccess(
    input.authClient,
    input.userId,
    input.eventId,
  );

  if (access.kind === "not_found") {
    return { kind: "not_found" };
  }

  if (access.kind === "forbidden") {
    return { kind: "forbidden" };
  }

  if (!access.event.operational_event_id) {
    return { kind: "operational_not_linked", event: access.event };
  }

  try {
    const operationalData = await input.operationalReader.listGuests(
      access.event.operational_event_id,
    );

    return {
      kind: "ok",
      data: mapOperationalGuestsToModuleData(
        access.event,
        operationalData.guests,
        operationalData.tablesTotal,
      ),
    };
  } catch {
    return {
      kind: "unavailable",
      message: "Não foi possível carregar os convidados operacionais.",
    };
  }
}
