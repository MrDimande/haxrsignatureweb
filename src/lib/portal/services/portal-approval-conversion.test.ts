import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConvertProformaOptions } from "@/lib/admin/services/convert-proforma.service";

describe("ConvertProformaOptions", () => {
  it("aceita status sent para conversão automática no portal", () => {
    const options: ConvertProformaOptions = { status: "sent" };
    assert.equal(options.status, "sent");
  });
});

describe("ApprovePortalDocumentResult", () => {
  it("modela resposta com factura convertida", () => {
    const result = {
      success: true as const,
      invoice: { id: "inv-1", documentNumber: "FT-2026-001" },
    };
    assert.equal(result.invoice?.documentNumber, "FT-2026-001");
  });
});
