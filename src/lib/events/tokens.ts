import { randomBytes } from "crypto";
import { siteUrl } from "@/lib/seo";

/** Reservado para convites digitais / QR individual (futuro). */
export function generateQrToken(): string {
  return randomBytes(24).toString("base64url");
}

export function buildFindSeatPath(eventId: string): string {
  return `/event/${eventId}/find-seat`;
}

export function buildFindSeatUrl(eventId: string): string {
  return `${siteUrl}${buildFindSeatPath(eventId)}`;
}

export function buildCheckinPath(eventId: string, token: string): string {
  return `/event/${eventId}/checkin/${token}`;
}

export function buildCheckinUrl(eventId: string, token: string): string {
  return `${siteUrl}${buildCheckinPath(eventId, token)}`;
}

export function buildRsvpPath(eventId: string, token: string): string {
  return `/event/${eventId}/rsvp/${token}`;
}

export function buildRsvpUrl(eventId: string, token: string): string {
  return `${siteUrl}${buildRsvpPath(eventId, token)}`;
}
