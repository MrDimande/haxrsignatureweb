import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPartyParseSummary,
  parsePartyName,
} from "@/lib/events/party-parser";

describe("parsePartyName", () => {
  it('"Helio e Esposa" -> headcount 2, spouse', () => {
    const result = parsePartyName("Helio e Esposa");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.suggestedPlusOnes, 1);
    assert.equal(result.members.some((m) => m.role === "spouse"), true);
    assert.equal(result.members.find((m) => m.role === "primary")?.label, "Helio");
    assert.equal(result.needsReview, true);
    assert.equal(result.confidence, "medium");
  });

  it('"Helio e Esposa e +1" -> headcount 3, spouse + plus_one', () => {
    const result = parsePartyName("Helio e Esposa e +1");
    assert.equal(result.suggestedHeadcount, 3);
    assert.equal(result.suggestedPlusOnes, 2);
    assert.equal(result.members.some((m) => m.role === "spouse"), true);
    assert.equal(result.members.some((m) => m.role === "plus_one"), true);
  });

  it('"Helio e +1" -> headcount 2', () => {
    const result = parsePartyName("Helio e +1");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.suggestedPlusOnes, 1);
    assert.equal(result.confidence, "high");
    assert.equal(result.needsReview, false);
  });

  it('"Ana +2" -> headcount 3', () => {
    const result = parsePartyName("Ana +2");
    assert.equal(result.suggestedHeadcount, 3);
    assert.equal(result.suggestedPlusOnes, 2);
    assert.equal(result.confidence, "high");
  });

  it('"Sr. Manuel e esposa" -> headcount 2', () => {
    const result = parsePartyName("Sr. Manuel e esposa");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.members[0]?.label, "Sr. Manuel");
    assert.equal(result.members.some((m) => m.role === "spouse"), true);
  });

  it('"João e Maria" -> two named guests', () => {
    const result = parsePartyName("João e Maria");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.members.filter((m) => m.isNamed).length, 2);
    assert.equal(result.members.some((m) => m.role === "named_guest"), true);
    assert.equal(result.needsReview, true);
  });

  it('"João, Maria e Carlos" -> three named guests', () => {
    const result = parsePartyName("João, Maria e Carlos");
    assert.equal(result.suggestedHeadcount, 3);
    assert.equal(result.members.filter((m) => m.role === "named_guest").length, 2);
    assert.equal(result.members.find((m) => m.role === "primary")?.label, "João");
  });

  it('"Família Matola" -> needsReview true, family_size_unknown', () => {
    const result = parsePartyName("Família Matola");
    assert.equal(result.needsReview, true);
    assert.equal(result.confidence, "low");
    assert.ok(result.reasons.includes("family_size_unknown"));
    assert.equal(result.suggestedHeadcount, 1);
    assert.equal(result.members[0]?.role, "family");
  });

  it('"Helio e Família" -> needsReview true', () => {
    const result = parsePartyName("Helio e Família");
    assert.equal(result.needsReview, true);
    assert.ok(result.reasons.includes("family_size_unknown"));
    assert.equal(result.members.find((m) => m.role === "primary")?.label, "Helio");
  });

  it('"Helio e acompanhante" -> needsReview true', () => {
    const result = parsePartyName("Helio e acompanhante");
    assert.equal(result.needsReview, true);
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(
      result.members.some((m) => m.role === "unknown_companion"),
      true
    );
    assert.equal(result.confidence, "low");
  });

  it('accents/case: "HÉLIO E ESPOSA" works', () => {
    const result = parsePartyName("HÉLIO E ESPOSA");
    assert.equal(result.primaryName, "HÉLIO");
    assert.equal(result.normalizedPrimaryName, "helio");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.members.some((m) => m.role === "spouse"), true);
  });

  it("normal single name remains one person", () => {
    const result = parsePartyName("Carlos Dimande");
    assert.equal(result.suggestedHeadcount, 1);
    assert.equal(result.suggestedPlusOnes, 0);
    assert.equal(result.needsReview, false);
    assert.equal(result.confidence, "high");
    assert.equal(result.members.length, 1);
    assert.equal(result.members[0]?.role, "primary");
  });

  it('"Carlos & esposa" -> spouse via ampersand', () => {
    const result = parsePartyName("Carlos & esposa");
    assert.equal(result.suggestedHeadcount, 2);
    assert.equal(result.members.some((m) => m.role === "spouse"), true);
  });

  it("formatPartyParseSummary inclui linhas operacionais", () => {
    const summary = formatPartyParseSummary(parsePartyName("Helio e Esposa e +1"));
    assert.match(summary, /Detectado: 3 pessoas/);
    assert.match(summary, /Principal: Helio/);
    assert.match(summary, /Acompanhantes:/);
  });
});
