import { buildGuestReportCsv } from "@/lib/events/export/csv";
import { type GuestEventReport } from "@/lib/events/export/report";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.repository";
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

function parseGuestNotesField(notes: string, label: string): string {
  const match = notes.match(new RegExp(`${label}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

export function buildEditionCombinedExportCsv(
  report: GuestEventReport,
  gifts: EditionGiftReservation[]
): string {
  const base = buildGuestReportCsv(report);
  const lines = [
    base,
    "",
    "PRESENTES RESERVADOS (EDITION)",
    row(["Presente", "Categoria", "Reservado por", "Data"]),
    ...gifts.map((gift) =>
      row([
        gift.giftName,
        gift.category,
        gift.reservedBy,
        new Date(gift.createdAt).toLocaleString("pt-MZ", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Maputo",
        }),
      ])
    ),
    "",
    "RSVP EDITION — CAMPOS EXTRA",
    row([
      "Nome",
      "Estado",
      "Mensagem",
      "Tamanho",
      "Dress code",
      "Telefone",
      "Email",
    ]),
    ...report.guests
      .filter((g) => g.guestSource === "edition_rsvp")
      .map((guest: EventGuest) =>
        row([
          guest.name,
          GUEST_STATUS_LABELS[guest.status],
          parseGuestNotesField(guest.guestNotes, "Mensagem"),
          parseGuestNotesField(guest.guestNotes, "Tamanho"),
          parseGuestNotesField(guest.guestNotes, "Dress code"),
          guest.phone,
          guest.email,
        ])
      ),
  ];

  return lines.join("\n");
}
