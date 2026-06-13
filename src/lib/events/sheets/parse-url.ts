import type { ParsedSheetUrl } from "@/lib/events/sheets/types";

const SHEET_URL_PATTERNS = [
  /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  /docs\.google\.com\/spreadsheets\/u\/\d+\/d\/([a-zA-Z0-9-_]+)/,
];

export function parseGoogleSheetUrl(
  input: string,
  gidOverride?: string
): ParsedSheetUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Indique o URL da Google Sheet.");
  }

  let spreadsheetId: string | null = null;
  for (const pattern of SHEET_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      spreadsheetId = match[1];
      break;
    }
  }

  if (!spreadsheetId) {
    throw new Error("URL da Google Sheet inválido.");
  }

  let gid = gidOverride?.trim() || "0";
  const gidMatch = trimmed.match(/[?&#]gid=(\d+)/);
  if (!gidOverride && gidMatch?.[1]) {
    gid = gidMatch[1];
  }

  return { spreadsheetId, gid };
}

export function buildSheetCsvExportUrl(parsed: ParsedSheetUrl): string {
  return `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/export?format=csv&gid=${parsed.gid}`;
}

export function buildSheetGvizCsvUrl(parsed: ParsedSheetUrl): string {
  return `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${parsed.gid}`;
}

export function formatSheetConnectionLabel(url: string): string {
  if (!url.trim()) return "";
  try {
    const parsed = parseGoogleSheetUrl(url);
    return `…${parsed.spreadsheetId.slice(-8)} · gid ${parsed.gid}`;
  } catch {
    return "URL guardado";
  }
}
