import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferFamilyGroupName,
  namesAreEquivalent,
  normalizeGuestName,
  parseGuestNameInput,
  rankNameMatch,
  stripPlusSuffix,
} from "./normalize";

describe("normalizeGuestName", () => {
  it("ignora maiúsculas, acentos e espaços", () => {
    assert.equal(normalizeGuestName("  João   Dimande "), "joao dimande");
    assert.equal(normalizeGuestName("JOÃO DIMANDE"), "joao dimande");
    assert.equal(normalizeGuestName("Joao Dimande"), "joao dimande");
    assert.equal(normalizeGuestName("Maria José Tembe"), "maria jose tembe");
  });

  it("ignora sufixo +1 na deduplicação", () => {
    assert.equal(
      normalizeGuestName("Carlos Dimande +1"),
      normalizeGuestName("Carlos Dimande")
    );
  });
});

describe("parseGuestNameInput", () => {
  it("extrai acompanhantes do nome", () => {
    const parsed = parseGuestNameInput("Carlos Dimande +1");
    assert.equal(parsed.name, "Carlos Dimande");
    assert.equal(parsed.plusOnes, 1);
  });

  it("detecta unidade familiar", () => {
    assert.equal(inferFamilyGroupName("João e Maria"), "João e Maria");
    assert.equal(inferFamilyGroupName("João Dimande"), null);
  });

  it("limpa sufixo entre parênteses", () => {
    assert.equal(stripPlusSuffix("Ana (+2)"), "Ana");
  });
});

describe("namesAreEquivalent", () => {
  it("deteta nomes equivalentes", () => {
    assert.equal(namesAreEquivalent("João Dimande", "JOÃO DIMANDE"), true);
    assert.equal(namesAreEquivalent("Maria José", "Maria Jose"), true);
    assert.equal(namesAreEquivalent("João", "Maria"), false);
  });
});

describe("rankNameMatch", () => {
  it("prioriza correspondência exacta", () => {
    const exact = rankNameMatch("Rabeca Come", "Rabeca Come");
    const partial = rankNameMatch("Rabeca Come Silva", "Rabeca");
    assert.ok(exact && partial);
    assert.ok(exact.score > partial.score);
  });

  it("encontra por parte do nome sem acentos", () => {
    const match = rankNameMatch("José Alberto", "jose");
    assert.ok(match);
    assert.equal(match.kind, "starts_with");
  });

  it("encontra substring no meio do nome", () => {
    const match = rankNameMatch("Rabeca Come", "Come");
    assert.ok(match);
    assert.equal(match.kind, "contains");
  });
});
