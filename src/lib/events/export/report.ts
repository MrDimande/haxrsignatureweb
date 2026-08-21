import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import { parsePartyName } from "@/lib/events/party-parser";
import type {
  EventGuest,
  EventSeat,
  ManagedEvent,
} from "@/lib/events/types";

/**
 * Critério canónico de elegibilidade para o Relatório de Operações de Convidados.
 * Exclui apenas convidados apagados, arquivados ou marcados como incorrectos.
 * Convidados recusados ('declined') PERMANECEM como registos válidos de RSVP.
 */
export function isGuestReportEligible(guest: EventGuest): boolean {
  return !guest.deletedAt && !guest.archivedAt && !guest.isIncorrect;
}

/**
 * Informação estruturada de acompanhante(s) de um convidado.
 * Suporta nome explícito (de notas, RSVP ou nome composto) e contagem precisa.
 */
export interface ResolvedCompanionInfo {
  count: number;
  names: string[];
  formattedLabel: string;
  hasNamedCompanions: boolean;
  totalPartySize: number; // 1 (convidado principal) + count
}

/**
 * Resolve acompanhantes de um convidado de forma determinística e estruturada.
 */
export function resolveGuestCompanionInfo(guest: EventGuest): ResolvedCompanionInfo {
  const plusOnesCount = Math.max(0, guest.plusOnes || 0);
  const names: string[] = [];

  // 1. Tentar extrair de guestNotes se houver marcação de acompanhante/cônjuge
  if (guest.guestNotes) {
    const companionMatch = guest.guestNotes.match(
      /(?:acompanhante|cônjuge|conjuge|parceir[oa]|espos[ao]|marido|mulher):\s*([^;\n\r·|]+)/i
    );
    if (companionMatch?.[1]) {
      let extracted = companionMatch[1].trim();
      extracted = extracted.replace(/\s*(?:·|\||-|\/|tel(?:efone)?|contac?to|email|whatsapp).*$/i, "").trim();
      if (extracted && !/^\+\d+$/.test(extracted)) {
        names.push(extracted);
      }
    }
  }

  // 2. Tentar extrair do nome composto via parsePartyName se houver membros nomeados
  if (names.length === 0 && guest.name) {
    const party = parsePartyName(guest.name);
    const namedMembers = party.members.filter(
      (m) => m.role !== "primary" && m.isNamed && m.label
    );
    for (const member of namedMembers) {
      if (!names.includes(member.label)) {
        names.push(member.label);
      }
    }
  }

  const hasNamed = names.length > 0;
  let formattedLabel = "—";

  if (plusOnesCount > 0 || hasNamed) {
    const effectiveCount = Math.max(plusOnesCount, names.length);
    if (hasNamed) {
      formattedLabel = `+${effectiveCount} (${names.join(", ")})`;
    } else if (effectiveCount === 1) {
      formattedLabel = "+1 acompanhante";
    } else {
      formattedLabel = `+${effectiveCount} acompanhantes`;
    }
  }

  return {
    count: plusOnesCount,
    names,
    formattedLabel,
    hasNamedCompanions: hasNamed,
    totalPartySize: 1 + plusOnesCount,
  };
}

export interface GuestTableGroup {
  tableName: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  seats: {
    seatNumber: number;
    label: string;
    guest: EventGuest | null;
    companionInfo?: ResolvedCompanionInfo | null;
  }[];
}

/**
 * Estatísticas factuais do relatório de convidados, calculadas estritamente a partir do universo elegível.
 */
export interface GuestReportStats {
  /** Total de convites / entradas principais elegíveis */
  primaryGuests: number;
  /** Convites pendentes de resposta */
  invited: number;
  /** Convidados principais confirmados */
  confirmed: number;
  /** Convidados com presença registada no check-in */
  checkedIn: number;
  /** Convites recusados */
  declined: number;
  /** Total de convites respondidos (confirmed + checkedIn + declined) */
  responded: number;
  /** Taxa de resposta percentual (responded / primaryGuests * 100) */
  responseRate: number;
  /** Total de acompanhantes de todos os convidados elegíveis */
  plusOnesTotal: number;
  /** Convidados principais que estarão presentes (confirmed + checkedIn) */
  attendingPrimaryGuests: number;
  /**
   * Headcount Total de Banquete / Catering Covers.
   * (Convidados principais confirmados/check-in + acompanhantes desses convidados)
   */
  expectedAttendance: number;
  /** Convidados elegíveis com mesa e lugar atribuídos */
  assignedGuests: number;
  /** Convidados elegíveis sem lugar atribuído */
  unassignedGuests: number;
  /** Total de lugares configurados no evento */
  totalSeats: number;
  /** Número de mesas únicas configuradas */
  uniqueTables: number;
  /** Total de convidados com notas de restrição alimentar / alergias */
  dietaryCount: number;
  /** Total de convidados com notas operacionais especiais */
  notesCount: number;

  // Aliases para retrocompatibilidade
  totalGuests: number;
  assignedSeats: number;
  confirmationRate: number;
  duplicateGuests: number;
  capacityUsed: number;
  capacityAvailable: number;
  groupCount: number;
}

export interface GuestEventReport {
  event: ManagedEvent;
  guests: EventGuest[];
  stats: GuestReportStats;
  tableGroups: GuestTableGroup[];
  unassignedGuests: EventGuest[];
  generatedAt: string;
}

/**
 * Calcula todas as estatísticas a partir dos convidados elegíveis e lugares.
 */
export function calculateGuestReportStats(
  reportGuests: EventGuest[],
  seats: EventSeat[]
): GuestReportStats {
  const primaryGuests = reportGuests.length;
  const invited = reportGuests.filter((g) => g.status === "invited").length;
  const confirmed = reportGuests.filter((g) => g.status === "confirmed").length;
  const checkedIn = reportGuests.filter((g) => g.status === "checked_in").length;
  const declined = reportGuests.filter((g) => g.status === "declined").length;

  const responded = confirmed + checkedIn + declined;
  const responseRate = primaryGuests > 0 ? Math.round((responded / primaryGuests) * 100) : 0;

  const plusOnesTotal = reportGuests.reduce((sum, g) => sum + Math.max(0, g.plusOnes || 0), 0);

  const attendingPrimaryGuests = confirmed + checkedIn;
  const attendingPlusOnes = reportGuests
    .filter((g) => g.status === "confirmed" || g.status === "checked_in")
    .reduce((sum, g) => sum + Math.max(0, g.plusOnes || 0), 0);

  const expectedAttendance = attendingPrimaryGuests + attendingPlusOnes;

  const assignedGuests = reportGuests.filter((g) => Boolean(g.seatId)).length;
  const unassignedGuests = reportGuests.filter((g) => !g.seatId).length;

  const totalSeats = seats.length;
  const uniqueTables = new Set(seats.map((s) => s.tableName).filter(Boolean)).size;

  const dietaryCount = reportGuests.filter((g) => Boolean(g.dietaryNotes && g.dietaryNotes.trim())).length;
  const notesCount = reportGuests.filter((g) => Boolean(g.guestNotes && g.guestNotes.trim())).length;

  return {
    primaryGuests,
    invited,
    confirmed,
    checkedIn,
    declined,
    responded,
    responseRate,
    plusOnesTotal,
    attendingPrimaryGuests,
    expectedAttendance,
    assignedGuests,
    unassignedGuests,
    totalSeats,
    uniqueTables,
    dietaryCount,
    notesCount,

    // Aliases
    totalGuests: primaryGuests,
    assignedSeats: assignedGuests,
    confirmationRate: responseRate,
    duplicateGuests: 0,
    capacityUsed: totalSeats > 0 ? Math.round((assignedGuests / totalSeats) * 100) : 0,
    capacityAvailable: Math.max(0, totalSeats - assignedGuests),
    groupCount: 0,
  };
}

export function formatEventDate(date: string | null): string {
  if (!date) return "Data por confirmar";
  try {
    return new Date(date).toLocaleDateString("pt-MZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Maputo",
    });
  } catch {
    return date;
  }
}

export function formatGeneratedAtTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-MZ", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Maputo",
    });
  } catch {
    return iso;
  }
}

export function formatGuestCheckIn(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-MZ", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Africa/Maputo",
    });
  } catch {
    return iso;
  }
}

export function formatGuestSeat(guest: EventGuest): string {
  if (!guest.seat) return "Sem lugar";
  const label = guest.seat.label ? ` (${guest.seat.label})` : "";
  return `${guest.seat.tableName} · Lugar ${guest.seat.seatNumber}${label}`;
}

export function eventReportSlug(event: ManagedEvent): string {
  const base = (event.name || "evento")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return base || (event.id ? event.id.slice(0, 8) : "evento");
}

export function eventReportHeader(event: ManagedEvent): string {
  const parts = [
    event.name,
    EVENT_TYPE_LABELS[event.type] || event.type,
    formatEventDate(event.date),
  ];
  if (event.location) parts.push(event.location);
  return parts.join(" · ");
}

export interface BuildGuestEventReportOptions {
  event: ManagedEvent;
  guests: EventGuest[];
  seats: EventSeat[];
  generatedAt?: string;
}

/**
 * Constrói o instantâneo único (Single Snapshot) do relatório de convidados.
 * Suporta tanto objecto de opções quanto parâmetros posicionais para retrocompatibilidade.
 */
export function buildGuestEventReport(
  optionsOrEvent: BuildGuestEventReportOptions | ManagedEvent,
  legacyGuests?: EventGuest[],
  legacySeats?: EventSeat[],
  _legacyStatsOrGeneratedAt?: unknown
): GuestEventReport {
  let event: ManagedEvent;
  let rawGuests: EventGuest[];
  let rawSeats: EventSeat[];
  let generatedAt: string;

  if ("event" in optionsOrEvent && "guests" in optionsOrEvent) {
    event = optionsOrEvent.event;
    rawGuests = optionsOrEvent.guests ?? [];
    rawSeats = optionsOrEvent.seats ?? [];
    generatedAt = optionsOrEvent.generatedAt || new Date().toISOString();
  } else {
    event = optionsOrEvent;
    rawGuests = legacyGuests ?? [];
    rawSeats = legacySeats ?? [];
    if (typeof _legacyStatsOrGeneratedAt === "string") {
      generatedAt = _legacyStatsOrGeneratedAt;
    } else {
      generatedAt = new Date().toISOString();
    }
  }

  // Filtragem estrita do universo canónico (sem mutação do array de entrada)
  const eligibleGuests = rawGuests.filter(isGuestReportEligible);

  // Ordenação determinística: nome em pt, depois id
  const sortedGuests = [...eligibleGuests].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, "pt");
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });

  const guestBySeatId = new Map(
    sortedGuests.filter((g) => g.seatId).map((g) => [g.seatId!, g])
  );

  const seatsByTable = new Map<string, EventSeat[]>();
  for (const seat of rawSeats) {
    const list = seatsByTable.get(seat.tableName) ?? [];
    list.push(seat);
    seatsByTable.set(seat.tableName, list);
  }

  const tableGroups: GuestTableGroup[] = [...seatsByTable.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt"))
    .map(([tableName, tableSeats]) => {
      const sortedSeats = [...tableSeats].sort((a, b) => a.seatNumber - b.seatNumber);
      const mappedSeats = sortedSeats.map((seat) => {
        const guest = guestBySeatId.get(seat.id) ?? null;
        return {
          seatNumber: seat.seatNumber,
          label: seat.label || "",
          guest,
          companionInfo: guest ? resolveGuestCompanionInfo(guest) : null,
        };
      });
      const assignedCount = mappedSeats.filter((s) => s.guest !== null).length;
      return {
        tableName,
        totalSeats: mappedSeats.length,
        assignedSeats: assignedCount,
        availableSeats: Math.max(0, mappedSeats.length - assignedCount),
        seats: mappedSeats,
      };
    });

  const unassignedGuests = sortedGuests
    .filter((g) => !g.seatId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  const stats = calculateGuestReportStats(sortedGuests, rawSeats);

  return {
    event,
    guests: sortedGuests,
    stats,
    tableGroups,
    unassignedGuests,
    generatedAt,
  };
}
