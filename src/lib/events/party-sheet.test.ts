import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePartyName } from "@/lib/events/party-parser";
import {
  enrichSheetRowWithPartyParse,
  resolvePlusOnesFromPartyParse,
  sheetRowNeedsPartyReview,
} from "@/lib/events/party-sheet";
import { mapCsvToGuestRows } from "@/lib/events/sheets/parse-csv";

describe("party sheet integration", () => {
  it("compound sheet row marca needsReview e não força plus_ones", () => {
    const rows = mapCsvToGuestRows("Nome\nHelio e Esposa");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.rawName, "Helio e Esposa");
    assert.equal(rows[0]?.name, "Helio");
    assert.equal(rows[0]?.partyParse?.needsReview, true);
    assert.equal(rows[0]?.plusOnes, undefined);
    assert.equal(sheetRowNeedsPartyReview(rows[0]!), true);
  });

  it("explicit +N com confiança alta actualiza plus_ones com segurança", () => {
    const rows = mapCsvToGuestRows("Nome\nAna +2");
    assert.equal(rows[0]?.plusOnes, 2);
    assert.equal(rows[0]?.partyParse?.confidence, "high");
    assert.equal(rows[0]?.partyParse?.needsReview, false);
  });

  it("coluna plus prevalece quando parser é ambíguo", () => {
    const row = enrichSheetRowWithPartyParse(
      {
        name: "Helio",
        email: "",
        phone: "",
        clientType: "individual",
        rowNumber: 2,
        plusOnes: 1,
      },
      "Helio e Esposa"
    );
    assert.equal(row.plusOnes, 1);
    assert.equal(row.partyParse?.needsReview, true);
  });

  it("resolvePlusOnesFromPartyParse só aplica headcount em confiança alta", () => {
    const high = parsePartyName("Helio +1");
    const medium = parsePartyName("Helio e Esposa");
    assert.equal(resolvePlusOnesFromPartyParse(high), 1);
    assert.equal(resolvePlusOnesFromPartyParse(medium), undefined);
    assert.equal(resolvePlusOnesFromPartyParse(medium, 2), 2);
  });

  it("sugestão de party não implica criação automática de convidados extra", () => {
    const party = parsePartyName("João, Maria e Carlos");
    assert.equal(party.members.filter((m) => m.role === "named_guest").length, 2);
    assert.equal(party.needsReview, true);
    assert.equal(party.suggestedHeadcount, 3);
  });
});
