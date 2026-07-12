/**
 * Parser puro para nomes compostos de convidados / RSVP.
 * Não cria convidados — apenas sugere estrutura para revisão humana.
 */

import { normalizeGuestName, stripPlusSuffix } from "@/lib/events/normalize";

export type PartyMemberRole =
  | "primary"
  | "spouse"
  | "named_guest"
  | "plus_one"
  | "family"
  | "unknown_companion";

export type PartyConfidence = "high" | "medium" | "low";

export interface PartyMemberSuggestion {
  label: string;
  normalizedLabel?: string;
  role: PartyMemberRole;
  count: number;
  isNamed: boolean;
  needsName?: boolean;
}

export interface PartyParseResult {
  rawInput: string;
  primaryName: string;
  normalizedPrimaryName: string;
  displayName: string;
  suggestedHeadcount: number;
  suggestedPlusOnes: number;
  confidence: PartyConfidence;
  needsReview: boolean;
  reasons: string[];
  members: PartyMemberSuggestion[];
}

const PLUS_SUFFIX_PATTERN = /\s*(\(\s*\+?\s*(\d+)\s*\)|\+\s*(\d+))\s*$/i;
const E_PLUS_END_PATTERN = /\s+e\s+\+(\d+)\s*$/i;
const COMPOUND_SEPARATOR_PATTERN = /\s+e\s+|\s*&\s*|,\s*|\s*;\s*/i;
const WHOLE_FAMILY_PATTERN = /^(fam[ií]lia|family)\s+(.+)$/i;

const SPOUSE_KEYWORDS = new Set([
  "esposa",
  "esposo",
  "marido",
  "mulher",
  "conjuge",
]);

const COMPANION_KEYWORDS = new Set([
  "acompanhante",
  "convidado",
  "convidada",
  "parceiro",
  "parceira",
]);

const FAMILY_KEYWORDS = new Set(["familia", "family"]);

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeToken(value: string): string {
  return normalizeGuestName(value);
}

function isSpouseKeyword(segment: string): boolean {
  return SPOUSE_KEYWORDS.has(normalizeToken(segment));
}

function isCompanionKeyword(segment: string): boolean {
  return COMPANION_KEYWORDS.has(normalizeToken(segment));
}

function isFamilyKeyword(segment: string): boolean {
  const token = normalizeToken(segment);
  return FAMILY_KEYWORDS.has(token) || token === "familia";
}

function extractExplicitPlus(text: string): { text: string; plus: number; reasons: string[] } {
  let working = text;
  let plus = 0;
  const reasons: string[] = [];

  const suffixMatch = working.match(PLUS_SUFFIX_PATTERN);
  if (suffixMatch) {
    plus += Number.parseInt(suffixMatch[2] ?? suffixMatch[3] ?? "1", 10) || 1;
    working = stripPlusSuffix(working);
    reasons.push("explicit_plus_suffix");
  }

  const ePlusMatch = working.match(E_PLUS_END_PATTERN);
  if (ePlusMatch) {
    plus += Number.parseInt(ePlusMatch[1] ?? "1", 10) || 1;
    working = working.replace(E_PLUS_END_PATTERN, "").trim();
    reasons.push("explicit_plus_companion");
  }

  return { text: collapseSpaces(working), plus, reasons };
}

function buildSingleGuestResult(
  rawInput: string,
  name: string,
  plusOnes: number,
  reasons: string[]
): PartyParseResult {
  const members: PartyMemberSuggestion[] = [
    { label: name, role: "primary", count: 1, isNamed: true },
  ];

  if (plusOnes > 0) {
    members.push({
      label: `+${plusOnes}`,
      role: "plus_one",
      count: plusOnes,
      isNamed: false,
    });
  }

  const headcount = 1 + plusOnes;
  const highConfidence = plusOnes > 0;

  return {
    rawInput,
    primaryName: name,
    normalizedPrimaryName: normalizeGuestName(name),
    displayName: rawInput,
    suggestedHeadcount: headcount,
    suggestedPlusOnes: plusOnes,
    confidence: highConfidence ? "high" : "high",
    needsReview: false,
    reasons: reasons.length ? reasons : ["single_guest"],
    members,
  };
}

function buildFamilyOnlyResult(rawInput: string, label: string): PartyParseResult {
  return {
    rawInput,
    primaryName: label,
    normalizedPrimaryName: normalizeGuestName(label),
    displayName: label,
    suggestedHeadcount: 1,
    suggestedPlusOnes: 0,
    confidence: "low",
    needsReview: true,
    reasons: ["family_size_unknown"],
    members: [
      {
        label,
        role: "family",
        count: 1,
        isNamed: false,
        needsName: true,
      },
    ],
  };
}

function splitSegments(text: string): string[] {
  return text
    .split(/\s+e\s+|\s*&\s*|,\s*|\s*;\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveConfidence(input: {
  familyCount: number;
  companionCount: number;
  spouseCount: number;
  namedGuestCount: number;
  explicitPlus: number;
  segmentPlus: number;
  members: PartyMemberSuggestion[];
}): PartyConfidence {
  if (input.familyCount > 0 || input.companionCount > 0) return "low";
  if (
    input.members.length === 2 &&
    input.members[0]?.role === "primary" &&
    input.members[1]?.role === "plus_one"
  ) {
    return "high";
  }
  if (input.spouseCount > 0 || input.namedGuestCount > 0) return "medium";
  if ((input.explicitPlus > 0 || input.segmentPlus > 0) && input.members.length <= 2) {
    return "high";
  }
  if (input.explicitPlus > 0 || input.segmentPlus > 0) return "medium";
  return "medium";
}

/** Analisa um nome bruto de convidado / linha de folha. */
export function parsePartyName(rawInput: string): PartyParseResult {
  const trimmed = collapseSpaces(rawInput);
  if (!trimmed) {
    return {
      rawInput: "",
      primaryName: "",
      normalizedPrimaryName: "",
      displayName: "",
      suggestedHeadcount: 1,
      suggestedPlusOnes: 0,
      confidence: "low",
      needsReview: true,
      reasons: ["empty_input"],
      members: [],
    };
  }

  if (
    WHOLE_FAMILY_PATTERN.test(trimmed) &&
    !COMPOUND_SEPARATOR_PATTERN.test(trimmed)
  ) {
    return buildFamilyOnlyResult(trimmed, trimmed);
  }

  const hasCompound = COMPOUND_SEPARATOR_PATTERN.test(trimmed);

  if (!hasCompound) {
    const extracted = extractExplicitPlus(trimmed);
    return buildSingleGuestResult(
      trimmed,
      extracted.text,
      extracted.plus,
      extracted.reasons
    );
  }

  let working = trimmed;
  let explicitPlus = 0;
  const reasons: string[] = [];

  const suffixMatch = working.match(PLUS_SUFFIX_PATTERN);
  if (suffixMatch && !/\s+e\s+\+\d+\s*$/i.test(working)) {
    explicitPlus +=
      Number.parseInt(suffixMatch[2] ?? suffixMatch[3] ?? "1", 10) || 1;
    working = stripPlusSuffix(working);
    reasons.push("explicit_plus_suffix");
  }

  const segments = splitSegments(working);
  const members: PartyMemberSuggestion[] = [];
  let spouseCount = 0;
  let familyCount = 0;
  let companionCount = 0;
  let namedGuestCount = 0;
  let segmentPlus = 0;

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index] ?? "";
    const plusOnly = segment.match(/^\+(\d+)$/);
    if (plusOnly) {
      const count = Number.parseInt(plusOnly[1] ?? "1", 10) || 1;
      segmentPlus += count;
      members.push({
        label: segment,
        role: "plus_one",
        count,
        isNamed: false,
      });
      reasons.push("explicit_plus_segment");
      continue;
    }

    if (isSpouseKeyword(segment)) {
      spouseCount++;
      members.push({
        label: segment,
        role: "spouse",
        count: 1,
        isNamed: false,
        needsName: true,
      });
      reasons.push("spouse_term");
      continue;
    }

    if (isCompanionKeyword(segment)) {
      companionCount++;
      members.push({
        label: segment,
        role: "unknown_companion",
        count: 1,
        isNamed: false,
        needsName: true,
      });
      reasons.push("companion_term");
      continue;
    }

    if (isFamilyKeyword(segment)) {
      familyCount++;
      members.push({
        label: segment,
        role: "family",
        count: 1,
        isNamed: false,
        needsName: true,
      });
      reasons.push("family_size_unknown");
      continue;
    }

    if (index === 0) {
      members.push({
        label: segment,
        role: "primary",
        count: 1,
        isNamed: true,
      });
      continue;
    }

    namedGuestCount++;
    members.push({
      label: segment,
      role: "named_guest",
      count: 1,
      isNamed: true,
      normalizedLabel: normalizeGuestName(segment),
    });
    reasons.push("multiple_named_guests");
  }

  const primaryMember = members.find((member) => member.role === "primary");
  const primaryName = primaryMember?.label ?? working;

  if (familyCount > 0) {
    return {
      rawInput: trimmed,
      primaryName,
      normalizedPrimaryName: normalizeGuestName(primaryName),
      displayName: trimmed,
      suggestedHeadcount: 1,
      suggestedPlusOnes: 0,
      confidence: "low",
      needsReview: true,
      reasons: [...new Set([...reasons, "family_size_unknown"])],
      members,
    };
  }

  const headcountFromMembers = members.reduce((sum, member) => sum + member.count, 0);
  const suggestedHeadcount = Math.max(1, headcountFromMembers);
  const suggestedPlusOnes = Math.max(0, suggestedHeadcount - 1);
  const confidence = resolveConfidence({
    familyCount,
    companionCount,
    spouseCount,
    namedGuestCount,
    explicitPlus,
    segmentPlus,
    members,
  });

  const needsReview =
    confidence !== "high" ||
    spouseCount > 0 ||
    companionCount > 0 ||
    namedGuestCount > 0 ||
    (segmentPlus > 0 && spouseCount > 0);

  if (spouseCount > 0) reasons.push("spouse_needs_confirmation");
  if (companionCount > 0) reasons.push("companion_needs_confirmation");
  if (namedGuestCount > 0) reasons.push("named_guests_need_confirmation");

  return {
    rawInput: trimmed,
    primaryName,
    normalizedPrimaryName: normalizeGuestName(primaryName),
    displayName: trimmed,
    suggestedHeadcount,
    suggestedPlusOnes,
    confidence,
    needsReview,
    reasons: [...new Set(reasons)],
    members,
  };
}

/** Formata resumo legível para a fila de revisão (PT-MZ). */
export function formatPartyParseSummary(parse: PartyParseResult): string {
  const lines: string[] = [
    `Detectado: ${parse.suggestedHeadcount} pessoa${parse.suggestedHeadcount === 1 ? "" : "s"}`,
    `Principal: ${parse.primaryName}`,
  ];

  const companions = parse.members.filter((member) => member.role !== "primary");
  if (companions.length) {
    lines.push(
      `Acompanhantes: ${companions.map((member) => member.label).join(", ")}`
    );
  }

  if (parse.needsReview) {
    lines.push("Precisa revisão");
  }

  return lines.join("\n");
}
