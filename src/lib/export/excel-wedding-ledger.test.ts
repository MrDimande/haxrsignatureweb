import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOfficialWeddingLedgerWorkbook, sanitizeWorkbookFilename } from "./excel-wedding-ledger";
import { buildNormalizedFinancialLedger } from "@/lib/finance/normalized-financial-ledger";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";

describe("Official Excel Wedding Financial Book Exporter (ExcelJS)", () => {
  const baseEvent: ClientEventRow = {
    id: "evt-uuid-1",
    owner_user_id: "user-1",
    slug: "casamento-vanessa-mauro",
    event_name: "Casamento Vanessa & Mauro",
    event_type: "wedding",
    bride_name: "Vanessa",
    groom_name: "Mauro",
    event_date: "2026-08-20",
    event_location: "Polana Serena Hotel, Maputo",
    estimated_guests: 180,
    budget_min: 800000,
    budget_max: 950000,
    status: "planning",
    source: "onboarding",
    services_interested: ["catering", "decor"],
    phone: "+258840000000",
    operational_event_id: "op-1",
    is_active: true,
    onboarding_fingerprint: "fp-1",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
  };

  it("sanitizes workbook filename properly", () => {
    const filename = sanitizeWorkbookFilename("Casamento Vanessa & Mauro", "2026-08-20");
    assert.equal(filename, "HAXR_Wedding_Ledger_Casamento_Vanessa_Mauro_2026-08-20.xlsx");
  });

  it("builds a multi-tab 9-sheet Excel workbook with styled dashboard, master budget and schedules", async () => {
    const ledger = buildNormalizedFinancialLedger({
      event: baseEvent,
      vendors: [
        {
          id: "v-1",
          name: "Espaço Nobre & Salão",
          category: "local",
          contact: "+258 84 123 4567",
          location: "Maputo",
          status: "contratado",
          contractedAmount: 250000,
          nextAction: "Assinatura de Termo",
        },
      ],
      paymentsPayload: {
        payments: [
          {
            id: "pay-1",
            amount: 100000,
            currency: "MZN",
            payment_method: "bank_transfer",
            reference: "TRF-9921",
            notes: "Sinal Espaço Nobre",
            paid_at: "2026-08-05T12:00:00Z",
            created_at: "2026-08-05T12:00:00Z",
            document: { number: "FT-2026-009", client_name: "Vanessa & Mauro" },
          },
        ],
        summary: {
          paymentCount: 1,
          totalPayments: 100000,
          totalPaid: 100000,
          pendingAmount: 150000,
          currency: "MZN",
          budgetMin: 800000,
          budgetMax: 950000,
          budgetRange: "800.000 MT - 950.000 MT",
          lastPayment: null,
        },
      },
    });

    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);

    // Verify all 9 luxury sheets exist
    const expectedSheets = [
      "01 — Executive Dashboard",
      "02 — Master Budget",
      "03 — Payment Schedule",
      "04 — Vendors & Contracts",
      "05 — Cash Flow",
      "06 — Variations & Extras",
      "07 — Wedding Day Payments",
      "08 — Savings & Negotiations",
      "09 — Financial Notes",
    ];

    expectedSheets.forEach((sheetName) => {
      const sheet = wb.getWorksheet(sheetName);
      assert.ok(sheet, `Expected sheet ${sheetName} to exist`);
    });

    // Check Executive Dashboard header cell
    const wsDash = wb.getWorksheet("01 — Executive Dashboard");
    assert.ok(wsDash);
    const titleCell = wsDash.getCell("B2");
    assert.ok(String(titleCell.value).includes("HAXR SIGNATURE"));
  });
});
