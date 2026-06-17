import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapCsvToGuestRows, parseCsvRows, stripCsvBom } from "./sheets/parse-csv";

describe("parseCsvRows", () => {
  it("remove BOM UTF-8", () => {
    const csv = "\uFEFFNome,Email\nAna,ana@test.com";
    assert.equal(stripCsvBom(csv).charCodeAt(0), "N".charCodeAt(0));
  });

  it("suporta delimitador ponto e vírgula", () => {
    const rows = parseCsvRows("Nome;Email\nJoão;j@test.com");
    assert.equal(rows[0][0], "Nome");
    assert.equal(rows[1][0], "João");
  });
});

describe("mapCsvToGuestRows", () => {
  it("extrai +1 do nome e estado recusado", () => {
    const rows = mapCsvToGuestRows(
      "Nome,Status\nCarlos Dimande +1,Não\nAna José,Confirmada"
    );
    assert.equal(rows[0].name, "Carlos Dimande");
    assert.equal(rows[0].plusOnes, 1);
    assert.equal(rows[0].status, "declined");
    assert.equal(rows[1].name, "Ana José");
    assert.equal(rows[1].status, "confirmed");
  });

  it("infere grupo familiar em «João e Maria»", () => {
    const rows = mapCsvToGuestRows("Nome\nJoão e Maria");
    assert.equal(rows[0].groupName, "João e Maria");
  });
});
