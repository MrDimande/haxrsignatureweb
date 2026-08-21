import type {
  EventGuest,
  EventSeat,
  ManagedEvent,
} from "@/lib/events/types";

export const HUMAN_EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Casamento",
  birthday: "Aniversário",
  corporate: "Evento Corporativo",
  baby_shower: "Chá de Bebé",
  graduation: "Graduação",
  other: "Banquete & Recepção",
  conference: "Conferência",
  summit: "Cimeira Corporativa",
  gala: "Gala de Alta Distinção",
  launch: "Lançamento de Marca",
};

export const HUMAN_RSVP_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  checked_in: "Check-in",
  invited: "Aguarda Confirmação",
  declined: "Recusado",
};

/**
 * Normaliza o nome da mesa evitando duplicações do prefixo "Mesa" (ex: "Mesa Mesa 1" -> "Mesa 1").
 */
export function formatTableName(rawName: string | null | undefined): string {
  if (!rawName || !rawName.trim()) return "Mesa Geral";
  const trimmed = rawName.trim();
  if (/^mesa\b/i.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return `Mesa ${trimmed}`;
}

/**
 * Resolve o contacto preferencial para impressão operacional (Telefone prioritário, Email como secundário).
 */
export function formatGuestContact(guest: EventGuest): string {
  if (guest.phone && guest.phone.trim()) {
    return guest.phone.trim();
  }
  if (guest.email && guest.email.trim()) {
    return guest.email.trim();
  }
  return "—";
}

/**
 * Formata o título e cabeçalho institucional com base na empresa responsável.
 */
export function formatReportBrandTitle(businessName?: string | null): string {
  const raw = (businessName || "").trim();
  if (!raw) return "HAXR SIGNATURE · EVENT OPERATIONS";
  if (raw.toLowerCase().includes("haxr")) return "HAXR SIGNATURE · EVENT OPERATIONS";
  return `${raw.toUpperCase()} · EVENT OPERATIONS`;
}

/**
 * Formata a localização de lugar/mesa com base no tipo de evento e regras de protocolo.
 */
export function formatGuestSeatDisplay(
  guest: EventGuest,
  isSocial: boolean = true,
  exactSeat: boolean = false
): string {
  if (!guest.seat) return "Por distribuir";
  const formattedTable = formatTableName(guest.seat.tableName);
  if (isSocial && !exactSeat) {
    return formattedTable;
  }
  const label = guest.seat.label ? ` · ${guest.seat.label}` : "";
  return `${formattedTable} · Lugar ${guest.seat.seatNumber}${label}`;
}

/**
 * Critério canónico de elegibilidade para o Relatório de Operações de Convidados.
 * Exclui apenas convidados apagados, arquivados ou marcados como incorrectos.
 * Convidados recusados ('declined') PERMANECEM como registos válidos de RSVP.
 */
export function isGuestReportEligible(guest: EventGuest): boolean {
  return !guest.deletedAt && !guest.archivedAt && !guest.isIncorrect;
}

/**
 * Formatação canónica e factual de acompanhantes:
 * - 0 -> "—"
 * - 1 -> "+1 acompanhante"
 * - N -> "+N acompanhantes"
 */
export function formatGuestPlusOnes(plusOnes: number | null | undefined): string {
  const count = Math.max(0, plusOnes || 0);
  if (count === 0) return "—";
  if (count === 1) return "+1 acompanhante";
  return `+${count} acompanhantes`;
}

/**
 * Informação estruturada e factual de acompanhantes de um convidado.
 */
export interface ResolvedCompanionInfo {
  count: number;
  formattedLabel: string;
  totalPartySize: number; // 1 (convidado principal) + count
}

/**
 * Resolve acompanhantes de um convidado de forma estritamente factual baseada em plusOnes.
 */
export function resolveGuestCompanionInfo(guest: EventGuest): ResolvedCompanionInfo {
  const count = Math.max(0, guest.plusOnes || 0);
  return {
    count,
    formattedLabel: formatGuestPlusOnes(count),
    totalPartySize: 1 + count,
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

export type EventSocialClass = "social" | "corporate" | "protocol";

/**
 * Classifica a natureza operacional do evento para adaptar colunas e visualizações.
 */
export function getEventSocialClass(eventType: string | null | undefined): EventSocialClass {
  const type = (eventType || "").toLowerCase();
  const corporateTypes = [
    "corporate",
    "conference",
    "workshop",
    "launch",
    "gala_corporate",
    "summit",
    "forum",
    "seminar",
  ];
  const protocolTypes = [
    "state_dinner",
    "diplomatic",
    "board_meeting",
    "protocol",
    "formal_dinner",
  ];

  if (corporateTypes.includes(type)) return "corporate";
  if (protocolTypes.includes(type)) return "protocol";
  return "social"; // wedding, birthday, lobolo, anniversary, bridal, private, party, baptism, etc.
}

/**
 * Determina se a apresentação deve exibir o número exacto de lugar (ex: "Lugar 7")
 * ou se deve operar a nível de mesa ("Mesa Imperial").
 * Para eventos sociais padrão, opera a nível de Mesa a menos que haja configuração
 * explícita de lugares protocolados ou etiquetas individuais específicas.
 */
export function shouldReportExactSeat(event: ManagedEvent, seats: EventSeat[]): boolean {
  if (getEventSocialClass(event.type) === "protocol") return true;
  // Verifica se existem lugares com etiquetas distintivas nominais ou de protocolo
  const hasDistinctiveLabels = seats.some(
    (s) =>
      s.label &&
      s.label.trim().length > 0 &&
      !["normal", "standard", "lugar", "cadeira"].includes(s.label.trim().toLowerCase())
  );
  return hasDistinctiveLabels;
}

/**
 * Extrai votos e mensagens afetivas enviadas pelos convidados (separando da operação de cozinha).
 */
export function extractGuestMessage(guest: EventGuest): string | null {
  if (!guest.guestNotes) return null;
  const raw = guest.guestNotes.trim();
  if (!raw) return null;

  // 1. Padrão estruturado "Mensagem: ..."
  const msgMatch = raw.match(/Mensagem:\s*([^\n\r]+)/i);
  if (msgMatch?.[1]) {
    const extracted = msgMatch[1].trim();
    if (extracted.length > 0) return extracted;
  }

  // 2. Texto que não seja metadados de sistema ou notas técnicas
  if (
    !raw.startsWith("edition ·") &&
    !raw.startsWith("Tamanho:") &&
    !raw.startsWith("Dress code:") &&
    !raw.startsWith("Acompanhante:") &&
    !raw.startsWith("Cônjuge:")
  ) {
    // Se contém termos de felicitações ou texto pessoal de celebração
    const isGreeting =
      /felicidades|parab[eé]ns|deus aben[cç]oe|com amor|abra[cç]o|viva|honra|alegria|presen[cç]a/i.test(
        raw
      );
    if (isGreeting) return raw;
  }

  return null;
}

/**
 * Extrai notas operacionais de logística/recepção (ex: chegada tardia, cadeira de rodas, VIP).
 */
export function extractGuestOperationalNotes(guest: EventGuest): string | null {
  if (!guest.guestNotes) return null;
  const raw = guest.guestNotes.trim();
  if (!raw) return null;

  // Remove linhas de sistema / mensagens / tamanho / dress code
  const lines = raw
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (l.startsWith("edition ·")) return false;
      if (l.startsWith("Mensagem:")) return false;
      if (l.startsWith("Tamanho:")) return false;
      if (l.startsWith("Dress code:")) return false;
      return true;
    });

  if (lines.length === 0) return null;
  return lines.join(" · ");
}

export type SeatingReadinessState = "not_configured" | "partial" | "complete";

export interface GuestReportReadiness {
  hasGuests: boolean;
  hasSeating: boolean; // totalSeats > 0 || assignedGuests > 0
  seatingState: SeatingReadinessState;
  hasDietaryRequirements: boolean; // dietaryCount > 0
  hasOperationalNotes: boolean; // guests com notas logísticas
  hasGuestMessages: boolean; // guests com mensagens/votos
  hasCheckIns: boolean; // checkedIn > 0
  isSocialEvent: boolean;
  shouldReportExactSeat: boolean;
  operationalStatus: {
    rsvp: string;
    seating: string;
    kitchen: string;
    checkIn: string;
  };
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
  /** Acompanhantes dos convidados que estarão presentes */
  attendingPlusOnes: number;
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
  /** Total de convidados com mensagens / votos */
  guestMessagesCount: number;

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
  readiness: GuestReportReadiness;
  dietaryGuests: EventGuest[];
  messageGuests: { guest: EventGuest; message: string }[];
  operationalNotesGuests: { guest: EventGuest; note: string }[];
  tableGroups: GuestTableGroup[];
  unassignedGuests: EventGuest[];
  plannerNotes?: string | null;
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
  const guestMessagesCount = reportGuests.filter((g) => Boolean(extractGuestMessage(g))).length;

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
    attendingPlusOnes,
    expectedAttendance,
    assignedGuests,
    unassignedGuests,
    totalSeats,
    uniqueTables,
    dietaryCount,
    notesCount,
    guestMessagesCount,

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

/**
 * Deriva o modelo de prontidão e estado operacional adaptativo.
 */
export function computeGuestReportReadiness(
  reportGuests: EventGuest[],
  seats: EventSeat[],
  stats: GuestReportStats,
  event: ManagedEvent
): GuestReportReadiness {
  const hasGuests = reportGuests.length > 0;
  const hasSeating = stats.totalSeats > 0 || stats.assignedGuests > 0;

  let seatingState: SeatingReadinessState = "not_configured";
  if (hasSeating) {
    if (stats.unassignedGuests === 0 && stats.assignedGuests > 0) {
      seatingState = "complete";
    } else {
      seatingState = "partial";
    }
  }

  const hasDietaryRequirements = stats.dietaryCount > 0;
  const hasOperationalNotes = reportGuests.some((g) => Boolean(extractGuestOperationalNotes(g)));
  const hasGuestMessages = stats.guestMessagesCount > 0;
  const hasCheckIns = stats.checkedIn > 0;
  const isSocialEvent = getEventSocialClass(event.type) === "social";
  const exactSeat = shouldReportExactSeat(event, seats);

  // Derivação do strip de estado operacional
  let rsvpStatus = "A aguardar respostas";
  if (stats.responseRate === 100) {
    rsvpStatus = "Concluído (100%)";
  } else if (stats.responseRate > 0) {
    rsvpStatus = `Em curso (${stats.responseRate}%)`;
  }

  let seatingStatus = "Não iniciado";
  if (seatingState === "complete") {
    seatingStatus = `Concluído (${stats.uniqueTables} mesas)`;
  } else if (seatingState === "partial") {
    seatingStatus = `Parcial (${stats.assignedGuests} de ${stats.primaryGuests} distribuídos)`;
  }

  const kitchenStatus = hasDietaryRequirements
    ? `${stats.dietaryCount} ${stats.dietaryCount === 1 ? "restrição registada" : "restrições registadas"}`
    : "Sem restrições registadas";

  let checkInStatus = "A aguardar evento";
  if (hasCheckIns) {
    if (stats.checkedIn >= stats.confirmed && stats.confirmed > 0) {
      checkInStatus = `Concluído (${stats.checkedIn} no evento)`;
    } else {
      checkInStatus = `Em curso (${stats.checkedIn} registados)`;
    }
  }

  return {
    hasGuests,
    hasSeating,
    seatingState,
    hasDietaryRequirements,
    hasOperationalNotes,
    hasGuestMessages,
    hasCheckIns,
    isSocialEvent,
    shouldReportExactSeat: exactSeat,
    operationalStatus: {
      rsvp: rsvpStatus,
      seating: seatingStatus,
      kitchen: kitchenStatus,
      checkIn: checkInStatus,
    },
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
  if (!guest.seat) return "Por distribuir";
  const tableName = formatTableName(guest.seat.tableName);
  const label = guest.seat.label ? ` (${guest.seat.label})` : "";
  return `${tableName} · Lugar ${guest.seat.seatNumber}${label}`;
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
  const humanType = HUMAN_EVENT_TYPE_LABELS[event.type] || event.type || "Evento";
  const parts = [
    event.name,
    humanType,
    formatEventDate(event.date),
  ];
  if (event.location) parts.push(event.location);
  return parts.join(" · ");
}

export interface BuildGuestEventReportOptions {
  event: ManagedEvent;
  guests: EventGuest[];
  seats: EventSeat[];
  plannerNotes?: string | null;
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
  let plannerNotes: string | null = null;

  if ("event" in optionsOrEvent && "guests" in optionsOrEvent) {
    event = optionsOrEvent.event;
    rawGuests = optionsOrEvent.guests ?? [];
    rawSeats = optionsOrEvent.seats ?? [];
    plannerNotes = optionsOrEvent.plannerNotes ?? null;
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
    const normTableName = formatTableName(seat.tableName);
    const list = seatsByTable.get(normTableName) ?? [];
    list.push(seat);
    seatsByTable.set(normTableName, list);
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
  const readiness = computeGuestReportReadiness(sortedGuests, rawSeats, stats, event);

  // Filtragens estruturadas de apoio operacional
  const dietaryGuests = sortedGuests.filter(
    (g) => Boolean(g.dietaryNotes && g.dietaryNotes.trim().length > 0)
  );

  const messageGuests: { guest: EventGuest; message: string }[] = sortedGuests
    .map((g) => {
      const msg = extractGuestMessage(g);
      return msg ? { guest: g, message: msg } : null;
    })
    .filter((item): item is { guest: EventGuest; message: string } => item !== null);

  const operationalNotesGuests: { guest: EventGuest; note: string }[] = sortedGuests
    .map((g) => {
      const note = extractGuestOperationalNotes(g);
      return note ? { guest: g, note } : null;
    })
    .filter((item): item is { guest: EventGuest; note: string } => item !== null);

  return {
    event,
    guests: sortedGuests,
    stats,
    readiness,
    dietaryGuests,
    messageGuests,
    operationalNotesGuests,
    tableGroups,
    unassignedGuests,
    plannerNotes,
    generatedAt,
  };
}
