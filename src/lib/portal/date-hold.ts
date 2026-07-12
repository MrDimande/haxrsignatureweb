export function isDateHoldActive(holdUntil: string | null | undefined): boolean {
  if (!holdUntil) return false;
  return new Date(holdUntil).getTime() > Date.now();
}

export function formatDateHoldUntil(holdUntil: string): string {
  return new Date(holdUntil).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export function daysUntilDateHold(holdUntil: string): number {
  const ms = new Date(holdUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
