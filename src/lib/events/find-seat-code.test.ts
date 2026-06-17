import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateFindSeatCode,
  isValidFindSeatCode,
  normalizeFindSeatCode,
} from "./find-seat-code";

describe("normalizeFindSeatCode", () => {
  it("normaliza para maiúsculas sem espaços", () => {
    assert.equal(normalizeFindSeatCode(" haxr300 "), "HAXR300");
    assert.equal(normalizeFindSeatCode("jessica2027"), "JESSICA2027");
  });
});

describe("isValidFindSeatCode", () => {
  it("aceita códigos alfanuméricos de 4–20 caracteres", () => {
    assert.equal(isValidFindSeatCode("HAXR300"), true);
    assert.equal(isValidFindSeatCode("AB12"), true);
    assert.equal(isValidFindSeatCode("AB"), false);
    assert.equal(isValidFindSeatCode(""), false);
  });
});

describe("generateFindSeatCode", () => {
  it("gera código com base no nome do evento", () => {
    const code = generateFindSeatCode("Casamento Silva");
    assert.match(code, /^CASAME[A-Z0-9]+$/);
    assert.ok(code.length >= 8);
  });
});
