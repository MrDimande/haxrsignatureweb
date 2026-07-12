import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseAndValidateConciergeJson,
  validateConciergeExtraction,
} from "./validate-extraction";
import {
  isConciergeExtractionApplicable,
  isIrrelevantExtraction,
  normalizeClassifierDocumentType,
} from "./concierge-applicability";
import { normalizeClassifierExtraction } from "./provider";

describe("validateConciergeExtraction", () => {
  it("aceita vendor_proposal válida", () => {
    const result = validateConciergeExtraction({
      documentType: "vendor_proposal",
      confidence: 0.9,
      summary: "Proposta decoração",
      vendorProposal: {
        vendorName: "Flores MZ",
        serviceCategory: "Florista",
      },
    });
    assert.equal(result.ok, true);
  });

  it("rejeita vendor_proposal sem nome", () => {
    const result = validateConciergeExtraction({
      documentType: "vendor_proposal",
      confidence: 0.9,
      vendorProposal: { vendorName: "", serviceCategory: "Florista" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.errors.some((e) => e.path.includes("vendorProposal.vendorName"))
      );
    }
  });

  it("rejeita vendor_proposal sem categoria", () => {
    const result = validateConciergeExtraction({
      documentType: "vendor_proposal",
      confidence: 0.9,
      vendorProposal: { vendorName: "Flores MZ", serviceCategory: "" },
    });
    assert.equal(result.ok, false);
  });

  it("rejeita payment_receipt sem valor", () => {
    const result = validateConciergeExtraction({
      documentType: "payment_receipt",
      confidence: 0.9,
      paymentReceipt: { amount: 0, currency: "MZN", reference: "MP123" },
    });
    assert.equal(result.ok, false);
  });

  it("rejeita payment_receipt sem referência mínima", () => {
    const result = validateConciergeExtraction({
      documentType: "payment_receipt",
      confidence: 0.9,
      paymentReceipt: { amount: 1000, currency: "MZN" },
    });
    assert.equal(result.ok, false);
  });

  it("aceita payment_receipt com referência", () => {
    const result = validateConciergeExtraction({
      documentType: "payment_receipt",
      confidence: 0.9,
      paymentReceipt: {
        amount: 42500,
        currency: "MZN",
        reference: "MPESA-ABC123",
        paymentMethod: "M-Pesa",
      },
    });
    assert.equal(result.ok, true);
  });

  it("rejeita guest_list vazia", () => {
    const result = validateConciergeExtraction({
      documentType: "guest_list",
      confidence: 0.9,
      guestList: { guests: [], csvText: "" },
    });
    assert.equal(result.ok, false);
  });

  it("aceita guest_list com csvText", () => {
    const result = validateConciergeExtraction({
      documentType: "guest_list",
      confidence: 0.9,
      guestList: {
        csvText: "name,email\nAna,ana@test.com",
        guests: [],
      },
    });
    assert.equal(result.ok, true);
  });

  it("rejeita checklist sem tarefas", () => {
    const result = validateConciergeExtraction({
      documentType: "checklist",
      confidence: 0.9,
      checklist: { items: [] },
    });
    assert.equal(result.ok, false);
  });

  it("rejeita visual_reference genérica", () => {
    const result = validateConciergeExtraction({
      documentType: "visual_reference",
      confidence: 0.9,
      visualReference: {},
    });
    assert.equal(result.ok, false);
  });

  it("aceita visual_reference com título", () => {
    const result = validateConciergeExtraction({
      documentType: "visual_reference",
      confidence: 0.9,
      visualReference: { title: "Mesa champagne e dourado" },
    });
    assert.equal(result.ok, true);
  });

  it("permite contract para arquivo no moodboard", () => {
    const result = validateConciergeExtraction({
      documentType: "contract",
      confidence: 0.9,
      summary: "Contrato venue",
    });
    assert.equal(result.ok, true);
  });

  it("bloqueia other irrelevante", () => {
    const result = validateConciergeExtraction({
      documentType: "other",
      confidence: 0.9,
      rejectionReason: "not_event_related",
      summary: "CV pessoal",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.path === "documentType"));
    }
  });

  it("bloqueia confiança baixa", () => {
    const result = validateConciergeExtraction({
      documentType: "checklist",
      confidence: 0.4,
      checklist: { items: [{ title: "Confirmar DJ" }] },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.path === "confidence"));
    }
  });
});

describe("parseAndValidateConciergeJson", () => {
  it("rejeita JSON malformado", () => {
    const result = parseAndValidateConciergeJson("{ invalid");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.path === "(json)"));
    }
  });

  it("valida JSON string válido", () => {
    const result = parseAndValidateConciergeJson(
      JSON.stringify({
        documentType: "checklist",
        confidence: 0.9,
        checklist: { items: [{ title: "Confirmar DJ" }] },
      })
    );
    assert.equal(result.ok, true);
  });
});

describe("concierge-applicability", () => {
  it("detecta documento irrelevante", () => {
    assert.equal(
      isIrrelevantExtraction({
        documentType: "other",
        rejectionReason: "not_event_related",
      }),
      true
    );
    assert.equal(isConciergeExtractionApplicable({ documentType: "vendor_proposal" }), true);
    assert.equal(isConciergeExtractionApplicable({ documentType: "contract" }), true);
    assert.equal(
      isConciergeExtractionApplicable({
        documentType: "other",
        rejectionReason: "not_event_related",
      }),
      false
    );
  });

  it("normaliza irrelevant para other na BD", () => {
    const normalized = normalizeClassifierDocumentType("irrelevant");
    assert.equal(normalized.documentType, "other");
    assert.equal(normalized.rejectionReason, "not_event_related");
  });

  it("normaliza classificação da IA para storage", () => {
    const normalized = normalizeClassifierExtraction({
      documentType: "irrelevant",
      confidence: 0.95,
      summary: "Trabalho académico",
      rejectionReason: "not_event_related",
    });
    assert.equal(normalized.documentType, "other");
    assert.equal(normalized.notEventRelated, true);
  });
});
