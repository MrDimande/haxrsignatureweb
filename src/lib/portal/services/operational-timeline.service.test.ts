import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateEventProgress } from "@/lib/portal/services/operational-timeline.service";
import { buildConciergeDetectionMessage } from "@/lib/portal/services/concierge-detection-messages";

describe("calculateEventProgress", () => {
  it("calcula percentagem média das fases", () => {
    const result = calculateEventProgress([
      {
        id: "1",
        eventId: "e1",
        clientId: null,
        title: "Briefing",
        description: null,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: null,
        category: "briefing",
        visibility: "client",
        status: "done",
        sortOrder: 10,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        eventId: "e1",
        clientId: null,
        title: "Proposta",
        description: null,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: null,
        category: "proposal",
        visibility: "client",
        status: "scheduled",
        sortOrder: 20,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    assert.equal(result.percent, 50);
    assert.equal(result.phases.length, 2);
  });
});

describe("buildConciergeDetectionMessage", () => {
  it("gera mensagem Detectámos para contrato", () => {
    const message = buildConciergeDetectionMessage("contrato", "fornecedor.pdf");
    assert.match(message, /Detectámos um contrato/);
    assert.match(message, /fornecedor\.pdf/);
  });
});
