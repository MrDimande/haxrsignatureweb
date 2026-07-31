const MZN_FORMATTER = new Intl.NumberFormat("pt-MZ", {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-MZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Formats a monetary value in Meticais (e.g. 250000 → "250.000 MT"). */
export function formatCurrencyMZN(value: number, currency = "MT"): string {
  return `${MZN_FORMATTER.format(value)} ${currency}`;
}

/** Formats a date for pt-MZ locale. */
export function formatDatePtMZ(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return date.toString();
  return DATE_FORMATTER.format(parsed);
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-MZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Maputo",
});

/** Formats a date and time for pt-MZ locale in Africa/Maputo timezone. Returns "—" for null/undefined/invalid. */
export function formatDateTimePtMZ(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const parsed = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return "—";
  try {
    return DATE_TIME_FORMATTER.format(parsed);
  } catch {
    return "—";
  }
}

/** Formats a percentage value (0–100). */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
