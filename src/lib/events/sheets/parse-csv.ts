import type { ClientType } from "@/lib/admin/types";
import type { GuestStatus, GuestLabel } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";
import {
  analyzeSheetHeaders,
  type SheetAnalysis,
} from "@/lib/events/sheets/detect-mode";

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["nome", "name", "convidado", "guest", "convidados"],
  email: ["email", "e-mail", "mail"],
  phone: ["phone", "telefone", "tel", "mobile", "whatsapp", "contacto", "contato"],
  clientType: ["tipo", "client_type", "tipo cliente", "tipo de cliente"],
  status: ["status", "estado", "confirmacao", "confirmação", "rsvp", "resposta", "presenca", "presença"],
  plusOnes: ["plus", "plus ones", "acompanhantes", "plus_ones", "+1"],
  dietaryNotes: [
    "dietary",
    "dietary_notes",
    "restricoes",
    "restricoes alimentares",
    "alergias",
    "alimentar",
  ],
  label: ["etiqueta", "label", "tag", "categoria"],
  guestNotes: ["notas", "notes", "guest_notes", "observacoes", "observações"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function findColumnIndex(headers: string[], field: keyof typeof HEADER_ALIASES): number {
  const aliases = HEADER_ALIASES[field];
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function parseClientType(value: string): ClientType {
  const v = value.trim().toLowerCase();
  if (["company", "empresa", "corporate", "corporativo"].includes(v)) {
    return "company";
  }
  return "individual";
}

function parseGuestLabel(value: string): GuestLabel | undefined {
  const v = value.trim().toLowerCase();
  if (["vip"].includes(v)) return "vip";
  if (["family", "familia", "família"].includes(v)) return "family";
  if (["wedding_party", "padrinho", "madrinha", "padrinhos"].includes(v)) {
    return "wedding_party";
  }
  if (["corporate", "corporativo", "empresa"].includes(v)) return "corporate";
  if (["other", "outro", "outra"].includes(v)) return "other";
  if (["none", "—", "-", ""].includes(v)) return "none";
  return undefined;
}

function parseGuestStatus(value: string): GuestStatus | undefined {
  const v = value.trim().toLowerCase();
  if (["confirmed", "confirmado", "confirmada", "sim", "yes", "vou", "confirmo", "aceito"].includes(v)) {
    return "confirmed";
  }
  if (["checked_in", "check-in", "checkin", "presente"].includes(v)) {
    return "checked_in";
  }
  if (["invited", "convidado", "convidada", "pendente", "nao", "não", "no"].includes(v)) {
    return "invited";
  }
  return undefined;
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

export function mapCsvToGuestRows(csvText: string): SheetGuestRow[] {
  const matrix = parseCsvRows(csvText);
  if (!matrix.length) {
    throw new Error("A folha está vazia.");
  }

  const headers = matrix[0].map((h) => normalizeHeader(h));
  const nameIdx = findColumnIndex(headers, "name");
  if (nameIdx < 0) {
    throw new Error('Coluna "Nome" não encontrada na primeira linha.');
  }

  const emailIdx = findColumnIndex(headers, "email");
  const phoneIdx = findColumnIndex(headers, "phone");
  const typeIdx = findColumnIndex(headers, "clientType");
  const statusIdx = findColumnIndex(headers, "status");
  const plusIdx = findColumnIndex(headers, "plusOnes");
  const dietaryIdx = findColumnIndex(headers, "dietaryNotes");
  const notesIdx = findColumnIndex(headers, "guestNotes");
  const labelIdx = findColumnIndex(headers, "label");

  const guests: SheetGuestRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const name = (cells[nameIdx] ?? "").trim();
    if (!name) continue;

    const email = emailIdx >= 0 ? (cells[emailIdx] ?? "").trim() : "";
    const phone = phoneIdx >= 0 ? (cells[phoneIdx] ?? "").trim() : "";
    const clientType =
      typeIdx >= 0 ? parseClientType(cells[typeIdx] ?? "") : "individual";
    const statusRaw = statusIdx >= 0 ? (cells[statusIdx] ?? "").trim() : "";
    const status = statusRaw ? parseGuestStatus(statusRaw) : undefined;
    const plusRaw = plusIdx >= 0 ? (cells[plusIdx] ?? "").trim() : "";
    const plusOnes = plusRaw ? Math.max(0, Number.parseInt(plusRaw, 10) || 0) : undefined;
    const dietaryNotes =
      dietaryIdx >= 0 ? (cells[dietaryIdx] ?? "").trim() : undefined;
    const guestNotes = notesIdx >= 0 ? (cells[notesIdx] ?? "").trim() : undefined;
    const labelRaw = labelIdx >= 0 ? (cells[labelIdx] ?? "").trim() : "";
    const label = labelRaw ? parseGuestLabel(labelRaw) : undefined;

    guests.push({
      name,
      email,
      phone,
      clientType,
      status,
      statusRaw: statusRaw || undefined,
      plusOnes,
      dietaryNotes,
      guestNotes,
      label,
      rowNumber: i + 1,
    });
  }

  if (!guests.length) {
    throw new Error("Nenhum convidado válido encontrado na folha.");
  }

  return guests;
}

export function getSheetHeaders(csvText: string): string[] {
  const matrix = parseCsvRows(csvText);
  if (!matrix.length) return [];
  return matrix[0].map((h) => normalizeHeader(h));
}

export function analyzeSheetCsv(csvText: string): SheetAnalysis {
  return analyzeSheetHeaders(getSheetHeaders(csvText));
}
