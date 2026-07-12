/** Despedida de Solteira · Rose Elegance — aligned with Edition lib/farewell/event-details.ts */
export const FAREWELL_EVENT = {
  slug: "jessicachadelingerie",
  dateIso: "2026-07-25",
  timeLabel: "11h00",
  rsvpDeadlineIso: "2026-07-20",
} as const;

export const FAREWELL_VENUE = {
  full: "Residência Muege, Matola, Moçambique",
} as const;

export function isFarewellRsvpDeadlinePassed(
  now: Date = new Date(),
  deadlineIso: string = FAREWELL_EVENT.rsvpDeadlineIso
): boolean {
  const deadline = new Date(`${deadlineIso}T23:59:59+02:00`);
  return now.getTime() > deadline.getTime();
}
