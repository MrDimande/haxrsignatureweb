import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateFindSeatCode,
  isStrongFindSeatCode,
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
  it("aceita códigos legados durante a janela de compatibilidade", () => {
    assert.equal(isValidFindSeatCode("HAXR300"), true);
    assert.equal(isValidFindSeatCode("AB12"), true);
    assert.equal(isValidFindSeatCode("AB"), false);
    assert.equal(isValidFindSeatCode(""), false);
  });

  it("rejeita separadores e caracteres fora do alfabeto permitido", () => {
    assert.equal(isValidFindSeatCode("HXR 1234"), true);
    assert.equal(isValidFindSeatCode("HXR_1234"), false);
    assert.equal(isValidFindSeatCode("HXR/1234"), false);
  });
});

describe("generateFindSeatCode", () => {
  it("gera código opaco com 96 bits e sem dados do evento", () => {
    const code = generateFindSeatCode("Casamento Silva");
    assert.match(code, /^HXR-[A-F0-9]{24}$/);
    assert.equal(isStrongFindSeatCode(code), true);
    assert.equal(code.includes("CASAME"), false);
  });

  it("não repete códigos numa amostra representativa", () => {
    const codes = new Set(
      Array.from({ length: 2_000 }, () => generateFindSeatCode("Mesmo evento"))
    );
    assert.equal(codes.size, 2_000);
  });
});
