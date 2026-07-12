/**
 * Integração party parser → linhas de folha / CSV.
 */

import { parsePartyName, type PartyParseResult } from "@/lib/events/party-parser";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export function resolvePlusOnesFromPartyParse(
  party: PartyParseResult,
  columnPlusOnes = 0
): number | undefined {
  if (party.confidence === "high") {
    const value = Math.max(party.suggestedPlusOnes, columnPlusOnes);
    return value > 0 ? value : undefined;
  }
  return columnPlusOnes > 0 ? columnPlusOnes : undefined;
}

export function enrichSheetRowWithPartyParse(
  row: Omit<SheetGuestRow, "partyParse" | "rawName"> & {
    rawName?: string;
    partyParse?: PartyParseResult;
  },
  rawName: string
): SheetGuestRow {
  const party = parsePartyName(rawName);
  const columnPlus =
    typeof row.plusOnes === "number" && row.plusOnes > 0 ? row.plusOnes : 0;
  const plusOnes = resolvePlusOnesFromPartyParse(party, columnPlus);

  return {
    ...row,
    rawName,
    name: party.primaryName || rawName.trim(),
    plusOnes,
    partyParse: party,
    groupName: party.needsReview ? row.groupName : row.groupName,
  };
}

/** Indica se a linha deve gerar item de revisão de grupo. */
export function sheetRowNeedsPartyReview(row: SheetGuestRow): boolean {
  return Boolean(row.partyParse?.needsReview);
}
