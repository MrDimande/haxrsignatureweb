import * as XLSX from "xlsx";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_TEXT_CHARS = 50_000;
const MAX_SPREADSHEET_ROWS = 500;

export type ParsedFileContent = {
  text: string;
  imageBase64?: string;
};

function isSpreadsheet(mimeType: string, fileName: string): boolean {
  return (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType.includes("spreadsheet") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  );
}

function isDocx(mimeType: string, fileName: string): boolean {
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  );
}

function isLegacyDoc(mimeType: string, fileName: string): boolean {
  return mimeType === "application/msword" || fileName.endsWith(".doc");
}

/** Converte a primeira folha de um workbook Excel para texto CSV-like. */
export function workbookBufferToDelimitedText(
  buffer: Buffer,
  maxRows = MAX_SPREADSHEET_ROWS
): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return "";

  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "," });
  const lines = csv.split(/\r?\n/).filter((line) => line.length > 0);
  const truncated = lines.slice(0, maxRows + 1);
  const suffix =
    lines.length > maxRows + 1
      ? `\n[... ${lines.length - maxRows - 1} linhas omitidas]`
      : "";
  return truncated.join("\n") + suffix;
}

async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").slice(0, MAX_TEXT_CHARS);
}

function parseLegacyDocBuffer(buffer: Buffer): string {
  const cleaned = buffer
    .toString("utf-8")
    .replace(/[^\x20-\x7E\n\r\tÀ-ÿ]/g, " ")
    .slice(0, MAX_TEXT_CHARS);
  return `[Aviso: ficheiro .doc legado — preferir .docx ou PDF para melhor extracção]\n${cleaned}`;
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text || "").slice(0, MAX_TEXT_CHARS);
  } finally {
    await parser.destroy();
  }
}

export async function parseFileContent(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedFileContent> {
  const normalizedMime = mimeType || "application/octet-stream";

  if (normalizedMime.startsWith("text/") || normalizedMime === "application/csv") {
    return { text: buffer.toString("utf-8").slice(0, MAX_TEXT_CHARS) };
  }

  if (isSpreadsheet(normalizedMime, fileName)) {
    const text = workbookBufferToDelimitedText(buffer);
    return {
      text: text || "[Folha Excel vazia ou ilegível]",
    };
  }

  if (normalizedMime === "application/pdf") {
    const text = await parsePdfBuffer(buffer);
    return { text: text || "[PDF sem texto extraível]" };
  }

  if (IMAGE_MIME.has(normalizedMime)) {
    return {
      text: `[Imagem: ${fileName}]`,
      imageBase64: buffer.toString("base64"),
    };
  }

  if (isDocx(normalizedMime, fileName)) {
    return { text: await parseDocxBuffer(buffer) };
  }

  if (isLegacyDoc(normalizedMime, fileName)) {
    return { text: parseLegacyDocBuffer(buffer) };
  }

  if (normalizedMime.includes("word")) {
    return { text: parseLegacyDocBuffer(buffer) };
  }

  return { text: buffer.toString("utf-8").slice(0, MAX_TEXT_CHARS) };
}

export function guestsToCsv(
  guests: Array<{
    name: string;
    email?: string;
    phone?: string;
    groupName?: string;
    plusOnes?: number;
    notes?: string;
  }>
): string {
  const header = "name,email,phone,group,plus_ones,notes";
  const rows = guests.map((g) => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      escape(g.name),
      escape(g.email ?? ""),
      escape(g.phone ?? ""),
      escape(g.groupName ?? ""),
      String(g.plusOnes ?? 0),
      escape(g.notes ?? ""),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
