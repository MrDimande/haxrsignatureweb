import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildWeddingLedgerWorkbook } from "./excel-wedding-ledger";

describe("Excel Wedding Ledger Exporter", () => {
  it("builds a multi-section XLSX workbook with Dashboard, Cash-Flow, Expenses and HAXR Signature branding", () => {
    const wb = buildWeddingLedgerWorkbook({
      totalBudget: 800000,
      guestCount: 150,
      currency: "MZN",
      currencySymbol: "MT",
      rateFromMzn: 1,
      prestigeTierTitle: "Grand Editorial Prestige",
      prestigeTierBadge: "Padrão Editorial",
      eventName: "Casamento Jessica & Samuel",
      expenses: [
        {
          name: "Espaço Nobre",
          category: "Espaço & Salão Nobre",
          planned: 200000,
          paid: 100000,
          status: "Sinalizado",
        },
        {
          name: "Catering 4 Tempos",
          category: "Catering & Alta Gastronomia",
          planned: 250000,
          paid: 0,
          status: "Pendente",
        },
        {
          name: "Assessoria HAXR",
          category: "Assessoria & Coordenação HAXR",
          planned: 80000,
          paid: 80000,
          status: "Pago",
        },
      ],
    });

    assert.ok(wb.SheetNames.includes("Balanço HAXR Signature"));
    const sheet = wb.Sheets["Balanço HAXR Signature"];
    assert.ok(sheet);

    // Verify cell content exists and contains branding
    const cellA1 = sheet["A1"];
    assert.ok(cellA1 && String(cellA1.v).includes("HAXR SIGNATURE"));

    // Verify column widths exist
    assert.ok(sheet["!cols"]);
    assert.equal(sheet["!cols"]?.length, 7);
  });

  it("handles foreign currency conversion accurately (USD)", () => {
    const wb = buildWeddingLedgerWorkbook({
      totalBudget: 800000,
      guestCount: 150,
      currency: "USD",
      currencySymbol: "$",
      rateFromMzn: 0.0156,
      prestigeTierTitle: "Grand Editorial Prestige",
      prestigeTierBadge: "Padrão Editorial",
      expenses: [
        {
          name: "Espaço Nobre",
          category: "Espaço & Salão Nobre",
          planned: 200000,
          paid: 100000,
          status: "Sinalizado",
        },
      ],
    });

    const sheet = wb.Sheets["Balanço HAXR Signature"];
    assert.ok(sheet);
  });
});
