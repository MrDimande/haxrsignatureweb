import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSheetRowFingerprint,
  buildSheetRowFingerprintBundle,
  normalizeSheetRowForFingerprint,
} from "./fingerprint";

const EVENT_ID = "11111111-1111-1111-1111-111111111111";

describe("normalizeSheetRowForFingerprint", () => {
  it("normaliza email, telefone e nome", () => {
    const n = normalizeSheetRowForFingerprint({
      name: "  João   Dimande ",
      email: " Joao@Example.COM ",
      phone: "+258 84 123 4567",
    });
    assert.equal(n.normalizedEmail, "joao@example.com");
    assert.ok(n.normalizedPhone.length >= 8);
    assert.equal(n.normalizedName, "joao dimande");
  });
});

describe("buildSheetRowFingerprint", () => {
  const base = {
    eventId: EVENT_ID,
    source: "google_sheet" as const,
    name: "Maria Silva",
    email: "maria@example.com",
    phone: "+351912345678",
  };

  it("é determinístico para os mesmos dados", () => {
    const a = buildSheetRowFingerprint(base);
    const b = buildSheetRowFingerprint(base);
    assert.equal(a, b);
    assert.equal(a.length, 64);
  });

  it("mesmo email com espaços/maiúsculas → mesmo fingerprint", () => {
    const a = buildSheetRowFingerprint(base);
    const b = buildSheetRowFingerprint({
      ...base,
      email: "  MARIA@EXAMPLE.COM  ",
    });
    assert.equal(a, b);
  });

  it("mesmo telefone com formatação diferente → mesmo fingerprint", () => {
    const a = buildSheetRowFingerprint(base);
    const b = buildSheetRowFingerprint({
      ...base,
      phone: "+351 912 345 678",
    });
    assert.equal(a, b);
  });

  it("linha só com nome repetida → mesmo fingerprint", () => {
    const input = {
      eventId: EVENT_ID,
      source: "csv_upload" as const,
      name: "Carlos Tembe",
    };
    const a = buildSheetRowFingerprint(input);
    const b = buildSheetRowFingerprint({
      ...input,
      name: "  CARLOS   TEMBE  ",
    });
    assert.equal(a, b);
  });

  it("fontes diferentes → fingerprints diferentes", () => {
    const sheet = buildSheetRowFingerprint({
      ...base,
      source: "google_sheet",
    });
    const csv = buildSheetRowFingerprint({
      ...base,
      source: "csv_upload",
    });
    assert.notEqual(sheet, csv);
  });

  it("eventos diferentes → fingerprints diferentes", () => {
    const a = buildSheetRowFingerprint(base);
    const b = buildSheetRowFingerprint({
      ...base,
      eventId: "22222222-2222-2222-2222-222222222222",
    });
    assert.notEqual(a, b);
  });

  it("bundle expõe normalized + fingerprint coerentes", () => {
    const { fingerprint, normalized } = buildSheetRowFingerprintBundle(base);
    assert.equal(fingerprint, buildSheetRowFingerprint(base));
    assert.equal(normalized.normalizedEmail, "maria@example.com");
  });
});
