import { randomBytes } from "crypto";
import { siteUrl } from "@/lib/seo";

/** Reservado para convites digitais / QR individual (futuro). */
export function generateQrToken(): string {
  return randomBytes(24).toString("base64url");
}

export function buildFindSeatPath(eventId: string): string {
  return `/event/${eventId}/find-seat`;
}

export function buildFindSeatUrl(eventId: string, accessCode?: string): string {
  const base = `${siteUrl}${buildFindSeatPath(eventId)}`;
  const code = accessCode?.trim();
  if (!code) return base;
  return `${base}?code=${encodeURIComponent(code)}`;
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
