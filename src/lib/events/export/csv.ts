import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import {
  eventReportHeader,
  formatGeneratedAtTimestamp,
  formatGuestCheckIn,
  resolveGuestCompanionInfo,
  type GuestEventReport,
} from "@/lib/events/export/report";

function escapeCsv(value: string | number): string {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function row(values: (string | number)[]): string {
  return values.map(escapeCsv).join(",");
}

export function buildGuestReportCsv(report: GuestEventReport): string {
  const { event, guests, stats, tableGroups, unassignedGuests } = report;

  const lines: string[] = [
    "HAXR Signature — Relatório de Operações de Convidados",
    row(["Evento", event.name]),
    row(["Tipo", eventReportHeader(event)]),
    row(["Gerado em", formatGeneratedAtTimestamp(report.generatedAt)]),
    "",
    "RESUMO EXECUTIVO & BANQUETE",
    row(["Total convidados principais (convites)", stats.primaryGuests]),
    row(["Confirmados (RSVP Sim)", stats.confirmed]),
    row(["Presença registada (Check-in)", stats.checkedIn]),
    row(["Headcount Total de Banquete (Catering Covers)", stats.expectedAttendance]),
    row(["Acompanhantes totais (+1/+2)", stats.plusOnesTotal]),
    row(["Pendentes de resposta", stats.invited]),
    row(["Recusados", stats.declined]),
    row(["Taxa de confirmação / resposta", `${stats.responseRate}%`]),
    row(["Com lugar atribuído", stats.assignedGuests]),
    row(["Sem lugar atribuído", stats.unassignedGuests]),
    row(["Lugares configurados", stats.totalSeats]),
    row(["Restrições alimentares / alergias", stats.dietaryCount]),
    "",
    "LISTA MESTRE DE CONVIDADOS",
    row([
      "Nº",
      "Convidado Principal",
      "Email",
      "Telefone",
      "Tipo",
      "Estado RSVP",
      "Acompanhantes",
      "Qtd Acompanhantes",
      "Total Couverts",
      "Restrições Alimentares / Alergias",
      "Notas Operacionais",
      "Mesa",
      "Lugar",
      "Check-in Registado",
    ]),
    ...guests.map((guest, index) => {
      const companion = resolveGuestCompanionInfo(guest);
      return row([
        index + 1,
        guest.name,
        guest.email || "—",
        guest.phone || "—",
        CLIENT_TYPE_LABELS[guest.clientType] || guest.clientType,
        GUEST_STATUS_LABELS[guest.status] || guest.status,
        companion.formattedLabel,
        guest.plusOnes > 0 ? guest.plusOnes : 0,
        companion.totalPartySize,
        guest.dietaryNotes || "—",
        guest.guestNotes || "—",
        guest.seat?.tableName ?? "Sem mesa",
        guest.seat ? `Lugar ${guest.seat.seatNumber}${guest.seat.label ? ` (${guest.seat.label})` : ""}` : "Sem lugar",
        formatGuestCheckIn(guest.checkedInAt),
      ]);
    }),
    "",
    "DISTRIBUIÇÃO POR MESA",
  ];

  for (const group of tableGroups) {
    lines.push("");
    lines.push(row([`Mesa: ${group.tableName}`, `Lugares: ${group.assignedSeats}/${group.totalSeats}`]));
    lines.push(row(["Lugar", "Etiqueta", "Convidado Alocado", "Acompanhantes", "Estado RSVP", "Check-in"]));
    for (const seat of group.seats) {
      const companion = seat.guest ? resolveGuestCompanionInfo(seat.guest) : null;
      lines.push(
        row([
          seat.seatNumber,
          seat.label || "—",
          seat.guest?.name ?? "Vazio",
          companion ? companion.formattedLabel : "—",
          seat.guest ? (GUEST_STATUS_LABELS[seat.guest.status] || seat.guest.status) : "Disponível",
          seat.guest ? formatGuestCheckIn(seat.guest.checkedInAt) : "—",
        ])
      );
    }
  }

  if (unassignedGuests.length) {
    lines.push("");
    lines.push("SEM LUGAR ATRIBUÍDO");
    lines.push(row(["Nº", "Nome", "Estado RSVP", "Acompanhantes", "Contacto"]));
    for (let i = 0; i < unassignedGuests.length; i++) {
      const guest = unassignedGuests[i];
      const companion = resolveGuestCompanionInfo(guest);
      lines.push(
        row([
          i + 1,
          guest.name,
          GUEST_STATUS_LABELS[guest.status] || guest.status,
          companion.formattedLabel,
          guest.email || guest.phone || "—",
        ])
      );
    }
  }

  return lines.join("\n");
}

export { downloadCsvFile } from "@/lib/finance/export/csv";

