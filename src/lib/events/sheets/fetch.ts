import {
  buildSheetCsvExportUrl,
  buildSheetGvizCsvUrl,
  parseGoogleSheetUrl,
} from "@/lib/events/sheets/parse-url";
import { mapCsvToGuestRows, analyzeSheetCsv } from "@/lib/events/sheets/parse-csv";
import type { SheetsSyncMode } from "@/lib/events/types";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; HAXRSignature/1.0)",
  Accept: "text/csv,text/plain,*/*",
};

async function fetchUrl(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: FETCH_HEADERS,
  });
}

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("accounts.google.com")
  );
}

export async function fetchSheetCsv(
  googleSheetUrl: string,
  gid?: string
): Promise<{ csv: string; method: "export" | "gviz" }> {
  const parsed = parseGoogleSheetUrl(googleSheetUrl, gid);
  const attempts = [
    { url: buildSheetCsvExportUrl(parsed), method: "export" as const },
    { url: buildSheetGvizCsvUrl(parsed), method: "gviz" as const },
  ];

  let lastError = "Não foi possível ler a folha.";

  for (const attempt of attempts) {
    try {
      const response = await fetchUrl(attempt.url);
      const text = await response.text();

      if (!response.ok || isHtmlResponse(text)) {
        lastError =
          "A folha não está acessível publicamente. Abra a partilha para leitura.";
        continue;
      }

      if (!text.trim()) {
        lastError = "A folha devolveu conteúdo vazio.";
        continue;
      }

      return { csv: text, method: attempt.method };
    } catch {
      lastError = "Falha de rede ao contactar Google Sheets.";
    }
  }

  throw new Error(lastError);
}

export async function previewSheetGuests(
  googleSheetUrl: string,
  gid?: string
): Promise<{
  totalRows: number;
  sampleNames: string[];
  method: string;
  detectedMode: SheetsSyncMode;
  analysisReasons: string[];
}> {
  const { csv, method } = await fetchSheetCsv(googleSheetUrl, gid);
  const rows = mapCsvToGuestRows(csv);
  const analysis = analyzeSheetCsv(csv);
  return {
    totalRows: rows.length,
    sampleNames: rows.slice(0, 5).map((r) => r.name),
    method,
    detectedMode: analysis.mode,
    analysisReasons: analysis.reasons,
  };
}
