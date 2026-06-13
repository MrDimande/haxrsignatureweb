import { buildRsvpUrl } from "@/lib/events/tokens";
import type { EventGuest, ManagedEvent } from "@/lib/events/types";

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("258")) return digits;
  if (digits.startsWith("0")) return `258${digits.slice(1)}`;
  return `258${digits}`;
}

function encodeMessage(text: string): string {
  return encodeURIComponent(text);
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeMessage(message)}`;
}

export function buildRsvpReminderMessage(
  event: ManagedEvent,
  guest: EventGuest
): string {
  const rsvpUrl = buildRsvpUrl(event.id, guest.qrToken);
  const date = event.date
    ? new Date(event.date).toLocaleDateString("pt-MZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Maputo",
      })
    : "em breve";

  return [
    `Olá ${guest.name},`,
    "",
    `Gostaríamos de confirmar a sua presença no evento *${event.name}* (${date}).`,
    event.location ? `Local: ${event.location}` : "",
    "",
    `Confirme aqui: ${rsvpUrl}`,
    "",
    "HAXR Signature",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSeatReminderMessage(
  event: ManagedEvent,
  guest: EventGuest
): string {
  const seatLine = guest.seat
    ? `A sua mesa é *${guest.seat.tableName}*, lugar *${guest.seat.label || guest.seat.seatNumber}*.`
    : "O seu lugar será confirmado na recepção.";

  const date = event.date
    ? new Date(event.date).toLocaleDateString("pt-MZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Africa/Maputo",
      })
    : "em breve";

  return [
    `Olá ${guest.name},`,
    "",
    `Lembrete do evento *${event.name}* — ${date}.`,
    event.location ? `Local: ${event.location}` : "",
    seatLine,
    "",
    "Aguardamos por si. HAXR Signature",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppLinksForGuests(
  event: ManagedEvent,
  guests: EventGuest[],
  mode: "rsvp" | "seat"
): { guestId: string; name: string; url: string | null }[] {
  return guests
    .filter((guest) => guest.phone.trim())
    .map((guest) => ({
      guestId: guest.id,
      name: guest.name,
      url: buildWhatsAppUrl(
        guest.phone,
        mode === "rsvp"
          ? buildRsvpReminderMessage(event, guest)
          : buildSeatReminderMessage(event, guest)
      ),
    }));
}
