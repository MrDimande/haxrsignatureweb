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

/** Formats a percentage value (0–100). */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
