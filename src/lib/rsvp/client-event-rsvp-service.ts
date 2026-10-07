import type { ModuleDataResult, RSVPModuleData, RSVPResponse } from "@/lib/event-modules/types";
import {
  getClientEventGuestsData,
  type ClientEventGuestsAccessResult,
  type ClientEventGuestsAuthClient,
} from "@/lib/guests/client-event-guests-service";
import type { ClientEventOperationalReader } from "@/lib/portal/client-event-operational.neon.repository";

export type ClientEventRsvpAuthClient = ClientEventGuestsAuthClient;
export type ClientEventRsvpAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: NonNullable<Extract<ClientEventGuestsAccessResult, { kind: "operational_not_linked" }>["event"]> }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: RSVPModuleData };

function formatResponseLabel(value: string | undefined): string {
  if (!value) return "Actualizado recentemente";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Actualizado recentemente";
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildRsvpData(
  guestData: Extract<ClientEventGuestsAccessResult, { kind: "ok" }>["data"],
): RSVPModuleData {
  const responses: RSVPResponse[] = guestData.guests
    .filter((guest) => guest.rsvpStatus === "confirmado" || guest.rsvpStatus === "recusado")
    .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""))
    .slice(0, 10)
    .map((guest) => ({
      id: guest.id,
      guestName: guest.name,
      status: guest.rsvpStatus,
      plusOnes: guest.plusOnes,
      respondedAt: guest.updatedAt ?? "",
      respondedLabel: formatResponseLabel(guest.updatedAt),
    }));
  const responded = guestData.summary.confirmed + guestData.summary.declined;
  const total = guestData.summary.total;

  return {
    context: guestData.context,
    stats: {
      activeInvites: guestData.guests.filter((guest) => guest.inviteSent).length,
      confirmed: guestData.summary.confirmed,
      pending: guestData.summary.pending,
      declined: guestData.summary.declined,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
    },
    settings: {
      allowPlusOne: guestData.guests.some((guest) => guest.plusOnes > 0),
      askDietaryRestrictions: false,
      askPhoneNumber: guestData.guests.some((guest) => guest.phone !== "—"),
      closingDate: guestData.context.eventOverview.date,
      customConfirmationMessage: "Obrigado por confirmarem a vossa presença.",
      publicUrl: `/event/${guestData.context.eventOverview.slug}/rsvp`,
    },
    recentResponses: responses,
  };
}

export async function getClientEventRsvpData(input: {
  authClient: ClientEventRsvpAuthClient;
  operationalReader: ClientEventOperationalReader;
  userId: string;
  eventId: string;
}): Promise<ClientEventRsvpAccessResult> {
  const guestsResult = await getClientEventGuestsData(input);
  if (guestsResult.kind !== "ok") return guestsResult;

  return {
    kind: "ok",
    data: buildRsvpData(guestsResult.data),
  };
}

export function toRsvpModuleResult(
  result: ClientEventRsvpAccessResult,
): ModuleDataResult<RSVPModuleData> {
  if (result.kind === "ok") return { ok: true, data: result.data };
  return {
    ok: false,
    error: result.kind,
    message:
      result.kind === "not_found"
        ? "Evento não encontrado."
        : result.kind === "forbidden"
          ? "Não tem permissão para aceder a este evento."
          : result.kind === "operational_not_linked"
            ? "O evento operacional ainda não está ligado."
            : result.message,
  };
}
