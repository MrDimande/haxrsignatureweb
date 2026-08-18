import type { NormalizedEventFinancialLedger } from "./report-types";

/**
 * Formata valores monetários em formato executivo Moçambicano (MZN / MT).
 */
export function formatReportCurrency(
  amount: number | null | undefined,
  currencySymbol = "MT",
): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "0 " + currencySymbol;
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted} ${currencySymbol}`;
}

/**
 * Formata percentagens com 1 casa decimal e vírgula portuguesa.
 */
export function formatReportPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return "0,0%";
  }
  return `${value.toFixed(1).replace(".", ",")}%`;
}

/**
 * Sanitiza strings para o documento PDF, prevenindo "undefined", "null", "NaN", "Invalid Date".
 */
export function safeReportText(
  value: string | number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  if (
    str === "" ||
    str === "undefined" ||
    str === "null" ||
    str === "NaN" ||
    str === "Invalid Date" ||
    str === "[object Object]"
  ) {
    return fallback;
  }
  return str;
}

/**
 * Formata a data de emissão para exibição editorial.
 */
export function formatReportEmissionDate(dateInput?: Date | string): string {
  const date = dateInput
    ? typeof dateInput === "string"
      ? new Date(dateInput)
      : dateInput
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return "Data de emissão por registar";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${monthName} de ${year}`;
}

/**
 * Sanitiza nomes para filenames de arquivo.
 */
function sanitizeFilenameSegment(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Gera o nome de ficheiro oficial:
 * HAXR_Wedding_Financial_Report_Leila_Armando_2026-11-14.pdf
 */
export function generateWeddingFinancialReportFilename(
  ledger: NormalizedEventFinancialLedger,
): string {
  const rawNames = ledger.clientNames || ledger.eventTitle || "Client";
  const sanitizedNames = sanitizeFilenameSegment(rawNames);

  let dateSegment = "";
  if (ledger.eventDateIso) {
    const isoMatch = ledger.eventDateIso.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      dateSegment = `_${isoMatch[0]}`;
    }
  }

  return `HAXR_Wedding_Financial_Report_${sanitizedNames}${dateSegment}.pdf`;
}
