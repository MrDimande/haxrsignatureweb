import type { GuestStatus } from "@/lib/events/types";

export type SheetsSyncMode = "master" | "rsvp";

export interface SheetAnalysis {
  mode: SheetsSyncMode;
  hasStatusColumn: boolean;
  hasTimestampColumn: boolean;
  hasRsvpHeaders: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

const RSVP_HEADER_HINTS = [
  "timestamp",
  "carimbo de data/hora",
  "carimbo",
  "data/hora",
  "data hora",
  "rsvp",
  "confirmacao",
  "confirmação",
  "confirmo",
  "resposta",
  "presenca",
  "presença",
  "attendance",
  "response",
  "vou",
  "comparecencia",
  "comparecência",
];

const MASTER_HEADER_HINTS = ["estado", "status", "convidados", "lista"];

export function analyzeSheetHeaders(headers: string[]): SheetAnalysis {
  const normalized = headers.map((h) =>
    h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  );

  const hasTimestampColumn = normalized.some(
    (h) =>
      h.includes("timestamp") ||
      h.includes("carimbo") ||
      h === "data/hora" ||
      h.includes("data hora")
  );

  const hasRsvpHeaders = normalized.some((h) =>
    RSVP_HEADER_HINTS.some((hint) => h.includes(hint))
  );

  const hasStatusColumn = normalized.some((h) =>
    ["estado", "status"].includes(h)
  );

  const hasMasterHints = normalized.some((h) =>
    MASTER_HEADER_HINTS.some((hint) => h === hint || h.includes(hint))
  );

  const reasons: string[] = [];
  let mode: SheetsSyncMode = "master";
  let confidence: SheetAnalysis["confidence"] = "low";

  if (hasTimestampColumn) {
    reasons.push("Coluna de data/hora (típico de Google Forms)");
    mode = "rsvp";
    confidence = "high";
  }

  if (hasRsvpHeaders) {
    reasons.push("Cabeçalhos de confirmação RSVP detectados");
    mode = "rsvp";
    confidence = confidence === "high" ? "high" : "medium";
  }

  if (hasMasterHints && !hasTimestampColumn && !hasRsvpHeaders) {
    reasons.push("Estrutura de lista mestre de convidados");
    mode = "master";
    confidence = "medium";
  }

  if (mode === "master" && hasStatusColumn && !hasTimestampColumn) {
    reasons.push("Coluna Estado/Status sem carimbo de formulário");
    confidence = "medium";
  }

  if (!reasons.length) {
    reasons.push("Formato genérico — confirme o tipo de folha manualmente");
  }

  return {
    mode,
    hasStatusColumn,
    hasTimestampColumn,
    hasRsvpHeaders,
    confidence,
    reasons,
  };
}

export function isDeclinedRsvp(value: string): boolean {
  const v = value.trim().toLowerCase();
  return [
    "nao",
    "não",
    "no",
    "declined",
    "recuso",
    "nao vou",
    "não vou",
    "ausente",
    "cancelado",
  ].some((term) => v === term || v.includes(term));
}

export function resolveRsvpRowStatus(
  statusRaw: string,
  explicitStatus?: GuestStatus
): GuestStatus | "declined" {
  if (statusRaw && isDeclinedRsvp(statusRaw)) return "declined";
  if (explicitStatus === "checked_in") return "checked_in";
  if (explicitStatus === "confirmed") return "confirmed";
  if (statusRaw) {
    const lower = statusRaw.trim().toLowerCase();
    if (["sim", "yes", "vou", "confirmo", "aceito", "presente"].includes(lower)) {
      return "confirmed";
    }
  }
  return "confirmed";
}

export const SHEETS_SYNC_MODE_LABELS: Record<SheetsSyncMode, string> = {
  master: "Lista mestre",
  rsvp: "Confirmações RSVP",
};

export const SHEETS_SYNC_MODE_HINTS: Record<SheetsSyncMode, string> = {
  master: "Lista completa criada ou editada manualmente na folha.",
  rsvp: "Respostas de Google Forms — cada linha é uma confirmação de presença.",
};

export const GUEST_SOURCE_LABELS = {
  manual: "Manual",
  sheet_master: "Sheets · lista",
  sheet_rsvp: "RSVP · Sheets",
} as const;
