import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_LABEL_LABELS, GUEST_STATUS_LABELS } from "@/lib/events/constants";
import { formatGuestCheckIn } from "@/lib/events/export/report";
import type { EventGuest } from "@/lib/events/types";

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

/** Formato compatível com importação Google Sheets / CSV do sistema. */
export function buildSheetExportCsv(guests: EventGuest[]): string {
  const headers = [
    "Nome",
    "Email",
    "Telefone",
    "Tipo",
    "Estado",
    "Etiqueta",
    "Acompanhantes",
    "Restrições",
    "Notas",
    "Mesa",
    "Lugar",
    "Check-in",
  ];

  const lines = [
    headers.join(","),
    ...guests.map((guest) =>
      row([
        guest.name,
        guest.email,
        guest.phone,
        CLIENT_TYPE_LABELS[guest.clientType],
        GUEST_STATUS_LABELS[guest.status],
        GUEST_LABEL_LABELS[guest.label],
        guest.plusOnes,
        guest.dietaryNotes,
        guest.guestNotes,
        guest.seat?.tableName ?? "",
        guest.seat?.seatNumber ?? "",
        formatGuestCheckIn(guest.checkedInAt),
      ])
    ),
  ];

  return lines.join("\n");
}

export function buildSelectedGuestsCsv(guests: EventGuest[]): string {
  return buildSheetExportCsv(guests);
}
