import type { ManagedEvent } from "@/lib/events/types";
import type { EventStats } from "@/lib/events/types";
import { buildWhatsAppUrl } from "@/lib/events/whatsapp";

export type EventWhatsAppShortcut = {
  id: string;
  label: string;
  message: string;
  phone?: string;
};

export function buildEventWhatsAppShortcuts(input: {
  event: ManagedEvent;
  clientPhone?: string | null;
  portalUrl?: string | null;
  documentNumber?: string;
  documentAmount?: string;
}): EventWhatsAppShortcut[] {
  const { event, portalUrl, clientPhone } = input;
  const phone = clientPhone?.replace(/\D/g, "") || "";
  const shortcuts: EventWhatsAppShortcut[] = [];

  if (input.documentNumber) {
    shortcuts.push({
      id: "proposal",
      label: "Enviar proposta",
      message: `Olá! Segue a proposta ${input.documentNumber}${input.documentAmount ? ` (${input.documentAmount})` : ""} para o evento ${event.name}. Aguardamos a vossa confirmação.`,
      phone,
    });
  }

  shortcuts.push({
    id: "invoice",
    label: "Enviar factura",
    message: `Olá! Partilhamos a factura do evento ${event.name}. Por favor confirmem o pagamento ou enviem o comprovativo pelo portal HAXR.`,
    phone,
  });

  if (portalUrl) {
    shortcuts.push({
      id: "portal",
      label: "Link do portal",
      message: `Olá! Aqui está o acesso ao portal HAXR Signature do vosso evento ${event.name}: ${portalUrl}`,
      phone,
    });
  }

  if (event.location) {
    shortcuts.push({
      id: "location",
      label: "Localização",
      message: `Local do evento ${event.name}: ${event.location}`,
      phone,
    });
  }

  if (event.findSeatCode) {
    shortcuts.push({
      id: "find-seat",
      label: "Find Seat",
      message: `Encontre o vosso lugar no evento ${event.name}. Código: ${event.findSeatCode}`,
      phone,
    });
  }

  shortcuts.push({
    id: "rsvp-reminder",
    label: "Lembrete RSVP",
    message: `Olá! Gostaríamos de confirmar a vossa presença no evento ${event.name}${event.date ? ` (${event.date})` : ""}. Por favor respondam ao convite digital.`,
    phone,
  });

  return shortcuts;
}

export function whatsAppUrlForShortcut(shortcut: EventWhatsAppShortcut): string | null {
  if (!shortcut.phone) return null;
  return buildWhatsAppUrl(shortcut.phone, shortcut.message);
}

export function buildPostEventReportSummary(input: {
  event: ManagedEvent;
  stats: EventStats;
  invoiced: number;
  received: number;
  currency: string;
}): {
  title: string;
  lines: string[];
} {
  const noShows = Math.max(
    0,
    input.stats.confirmed + input.stats.checkedIn - input.stats.checkedIn
  );
  return {
    title: `Relatório pós-evento — ${input.event.name}`,
    lines: [
      `Data: ${input.event.date ?? "Por confirmar"}`,
      `Total convidados: ${input.stats.totalGuests}`,
      `Confirmados: ${input.stats.confirmed + input.stats.checkedIn}`,
      `Check-ins: ${input.stats.checkedIn}`,
      `Recusados: ${input.stats.declined}`,
      `Pendentes: ${input.stats.invited}`,
      `No-shows estimados: ${noShows}`,
      `Valor contratado: ${input.invoiced.toLocaleString("pt-MZ")} ${input.currency}`,
      `Valor recebido: ${input.received.toLocaleString("pt-MZ")} ${input.currency}`,
      `Saldo: ${Math.max(0, input.invoiced - input.received).toLocaleString("pt-MZ")} ${input.currency}`,
    ],
  };
}
