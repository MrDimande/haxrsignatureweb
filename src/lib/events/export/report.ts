import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type {
  EventGuest,
  EventSeat,
  EventStats,
  ManagedEvent,
} from "@/lib/events/types";

export interface GuestTableGroup {
  tableName: string;
  seats: {
    seatNumber: number;
    label: string;
    guest: EventGuest | null;
  }[];
}

export interface GuestEventReport {
  event: ManagedEvent;
  guests: EventGuest[];
  stats: EventStats;
  tableGroups: GuestTableGroup[];
  unassignedGuests: EventGuest[];
  generatedAt: string;
}

export function formatEventDate(date: string | null): string {
  if (!date) return "Data por confirmar";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export function formatGuestCheckIn(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export function formatGuestSeat(guest: EventGuest): string {
  if (!guest.seat) return "Sem lugar";
  const label = guest.seat.label ? ` (${guest.seat.label})` : "";
  return `${guest.seat.tableName} · Lugar ${guest.seat.seatNumber}${label}`;
}

export function eventReportSlug(event: ManagedEvent): string {
  const base = event.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return base || event.id.slice(0, 8);
}

export function eventReportHeader(event: ManagedEvent): string {
  const parts = [
    event.name,
    EVENT_TYPE_LABELS[event.type],
    formatEventDate(event.date),
  ];
  if (event.location) parts.push(event.location);
  return parts.join(" · ");
}

export function buildGuestEventReport(
  event: ManagedEvent,
  guests: EventGuest[],
  seats: EventSeat[],
  stats: EventStats
): GuestEventReport {
  const guestBySeatId = new Map(
    guests.filter((g) => g.seatId).map((g) => [g.seatId!, g])
  );

  const seatsByTable = new Map<string, EventSeat[]>();
  for (const seat of seats) {
    const list = seatsByTable.get(seat.tableName) ?? [];
    list.push(seat);
    seatsByTable.set(seat.tableName, list);
  }

  const tableGroups: GuestTableGroup[] = [...seatsByTable.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt"))
    .map(([tableName, tableSeats]) => ({
      tableName,
      seats: tableSeats
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .map((seat) => ({
          seatNumber: seat.seatNumber,
          label: seat.label,
          guest: guestBySeatId.get(seat.id) ?? null,
        })),
    }));

  const unassignedGuests = guests
    .filter((g) => !g.seatId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  return {
    event,
    guests: [...guests].sort((a, b) => a.name.localeCompare(b.name, "pt")),
    stats,
    tableGroups,
    unassignedGuests,
    generatedAt: new Date().toISOString(),
  };
}
