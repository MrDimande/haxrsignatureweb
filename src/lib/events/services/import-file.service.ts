/**
 * Converte CSV ou Excel (.xlsx/.xls) num texto delimitado compatível com mapCsvToGuestRows.
 * Headers são detectados automaticamente pelo parser CSV (aliases PT/EN).
 */

import * as XLSX from "xlsx";

const MAX_IMPORT_ROWS = 5_000;

export function isSpreadsheetFilename(filename: string): boolean {
  const lower = filename.trim().toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls");
}

export function workbookArrayBufferToCsv(
  buffer: ArrayBuffer,
  maxRows = MAX_IMPORT_ROWS
): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("A folha Excel está vazia.");
  }

  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "," });
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (!lines.length) {
    throw new Error("A folha Excel não contém linhas legíveis.");
  }

  if (lines.length > maxRows + 1) {
    throw new Error(
      `Folha demasiado grande (${lines.length - 1} linhas). Máximo: ${maxRows}.`
    );
  }

  return lines.join("\n");
}

export async function fileToImportCsvText(file: File): Promise<string> {
  if (isSpreadsheetFilename(file.name)) {
    const buffer = await file.arrayBuffer();
    return workbookArrayBufferToCsv(buffer);
  }
  return file.text();
}

export const IMPORT_FILE_ACCEPT =
  ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
