import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import {
  eventReportHeader,
  formatGuestCheckIn,
  type GuestEventReport,
} from "@/lib/events/export/report";

function escapeCsv(value: string | number): string {
  const raw = String(value);
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
    "HAXR Signature — Relatório de Convidados",
    row(["Evento", event.name]),
    row(["Tipo", eventReportHeader(event)]),
    row(["Gerado em", report.generatedAt]),
    "",
    "RESUMO",
    row(["Total convidados", stats.totalGuests]),
    row(["Convidados", stats.invited]),
    row(["Confirmados", stats.confirmed]),
    row(["Check-in", stats.checkedIn]),
    row(["Recusados", stats.declined]),
    row(["Presença prevista (c/ acomp.)", stats.expectedAttendance]),
    row(["Acompanhantes (+1)", stats.plusOnesTotal]),
    row(["Taxa de confirmação", `${stats.confirmationRate}%`]),
    row(["Com lugar", stats.assignedSeats]),
    row(["Sem lugar", stats.totalGuests - stats.assignedSeats]),
    row(["Lugares disponíveis", stats.totalSeats]),
    "",
    "LISTA COMPLETA",
    row([
      "Nome",
      "Email",
      "Telefone",
      "Tipo",
      "Estado",
      "Acompanhantes",
      "Restrições",
      "Notas",
      "Mesa",
      "Lugar",
      "Check-in",
    ]),
    ...guests.map((guest) =>
      row([
        guest.name,
        guest.email,
        guest.phone,
        CLIENT_TYPE_LABELS[guest.clientType],
        GUEST_STATUS_LABELS[guest.status],
        guest.plusOnes,
        guest.dietaryNotes,
        guest.guestNotes,
        guest.seat?.tableName ?? "",
        guest.seat?.seatNumber ?? "",
        formatGuestCheckIn(guest.checkedInAt),
      ])
    ),
    "",
    "POR MESA",
  ];

  for (const group of tableGroups) {
    lines.push("");
    lines.push(row([`Mesa: ${group.tableName}`]));
    lines.push(row(["Lugar", "Etiqueta", "Convidado", "Estado", "Check-in"]));
    for (const seat of group.seats) {
      lines.push(
        row([
          seat.seatNumber,
          seat.label,
          seat.guest?.name ?? "Vazio",
          seat.guest ? GUEST_STATUS_LABELS[seat.guest.status] : "",
          seat.guest ? formatGuestCheckIn(seat.guest.checkedInAt) : "",
        ])
      );
    }
  }

  if (unassignedGuests.length) {
    lines.push("");
    lines.push("SEM LUGAR ATRIBUÍDO");
    lines.push(row(["Nome", "Estado", "Contacto"]));
    for (const guest of unassignedGuests) {
      lines.push(
        row([
          guest.name,
          GUEST_STATUS_LABELS[guest.status],
          guest.email || guest.phone || "—",
        ])
      );
    }
  }

  return lines.join("\n");
}

export { downloadCsvFile } from "@/lib/finance/export/csv";
