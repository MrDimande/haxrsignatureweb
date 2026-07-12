import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeEmail,
  normalizePhone,
  validateEditionRsvpBody,
} from "./validate";

describe("normalizeEmail", () => {
  it("normaliza e limita comprimento", () => {
    assert.equal(normalizeEmail("  Ana@Example.COM  "), "ana@example.com");
    assert.equal(normalizeEmail(42), "");
  });
});

describe("normalizePhone", () => {
  it("trim e limita a 30 caracteres", () => {
    assert.equal(normalizePhone("  +258 84 123 4567  "), "+258 84 123 4567");
    assert.equal(normalizePhone(null), "");
  });
});

describe("validateEditionRsvpBody", () => {
  it("rejeita corpo inválido", () => {
    const result = validateEditionRsvpBody(null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Por favor, introduza o seu nome.");
    }
  });

  it("rejeita nome em falta", () => {
    const result = validateEditionRsvpBody({ attending: true, guests: 1 });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Por favor, introduza o seu nome.");
    }
  });

  it("rejeita attending em falta", () => {
    const result = validateEditionRsvpBody({ name: "Ana Silva" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Por favor, indique se irá comparecer.");
    }
  });

  it("rejeita valores coercíveis para attending", () => {
    for (const attending of ["true", "false", 1, 0, [], {}, null]) {
      const result = validateEditionRsvpBody({
        name: "Ana Silva",
        attending,
        guests: 1,
        slug: "jessicakulaya",
        email: "ana@example.com",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error, "Por favor, indique se irá comparecer.");
      }
    }
  });

  it("aceita attending=false explícito", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: false,
      slug: "jessicakulaya",
    });
    assert.equal(result.ok, true);
    if (result.ok && !result.honeypot) {
      assert.equal(result.submission.attending, false);
      assert.equal(result.submission.guests, 0);
      assert.equal(result.submission.slug, "jessicakulaya");
    }
  });

  it("rejeita slug desconhecido sem fallback", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 1,
      slug: "unknown-slug",
      email: "ana@example.com",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Convite inválido.");
    }
  });

  it("rejeita número de convidados inválido", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 0,
      email: "ana@example.com",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "O número de pessoas deve ser entre 1 e 10.");
    }
  });

  it("rejeita email inválido", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 1,
      email: "not-an-email",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Por favor, introduza um email válido.");
    }
  });

  it("exige telefone na despedida", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 1,
      slug: "jessicachadelingerie",
      email: "ana@example.com",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(
        result.error,
        "Indique o telefone para contacto (WhatsApp)."
      );
    }
  });

  it("exige email ou telefone quando confirma presença", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 1,
      slug: "jessicakulaya",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "Indique email ou telefone para contacto.");
    }
  });

  it("aceita submissão kulaya válida", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: true,
      guests: 2,
      slug: "jessicakulaya",
      email: "ana@example.com",
      phone: "+258841234567",
    });
    assert.equal(result.ok, true);
    if (result.ok && !result.honeypot) {
      assert.equal(result.submission.name, "Ana Silva");
      assert.equal(result.submission.slug, "jessicakulaya");
      assert.equal(result.submission.guests, 2);
    }
  });

  it("resolve alias de slug legacy", () => {
    const result = validateEditionRsvpBody({
      name: "Ana Silva",
      attending: false,
      slug: "jessicakhulaya",
    });
    assert.equal(result.ok, true);
    if (result.ok && !result.honeypot) {
      assert.equal(result.submission.slug, "jessicakulaya");
      assert.equal(result.submission.guests, 0);
    }
  });

  it("honeypot preenchido devolve sucesso silencioso", () => {
    const result = validateEditionRsvpBody({
      name: "Bot",
      attending: true,
      guests: 1,
      honeypot: "spam",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.honeypot, true);
    }
  });
});
