import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { Vendor } from "@/lib/event-modules/types";
import type { ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";
import {
  buildNormalizedFinancialLedger,
  convertNormalizedLedgerToBudgetModuleData,
} from "./normalized-financial-ledger";
import { buildOfficialWeddingLedgerWorkbook } from "@/lib/export/excel-wedding-ledger";

describe("HAXR End-to-End Wedding Financial Pipeline", () => {
  it("executes Event + Vendors + Contracts + Installments + Payments → Normalized Ledger → Private UI → XLSX", async () => {
    // 1. Event Data
    const realEvent: ClientEventRow = {
      id: "evt-prod-001",
      owner_user_id: "usr-prod-88",
      slug: "casamento-leila-armando",
      event_name: "Casamento Leila & Armando",
      event_type: "wedding",
      bride_name: "Leila",
      groom_name: "Armando",
      event_date: "2026-11-14",
      event_location: "Catembe Gallery Hotel, Maputo",
      estimated_guests: 200,
      budget_min: 1000000,
      budget_max: 1200000,
      status: "planning",
      source: "onboarding",
      services_interested: ["catering", "decor", "music"],
      phone: "+258849999999",
      operational_event_id: "op-evt-12",
      is_active: true,
      onboarding_fingerprint: "fp-prod-01",
      created_at: "2026-08-01T08:00:00Z",
      updated_at: "2026-08-01T08:00:00Z",
    };

    // 2. Vendors & Signed Contracts
    const realVendors: Vendor[] = [
      {
        id: "v-venue",
        name: "Catembe Gallery Hotel - Espaço",
        category: "local",
        contact: "+258 84 100 2000",
        location: "Catembe, Maputo",
        status: "contratado",
        contractedAmount: 350000,
        contract: { id: "ct-001", signed: true },
      },
      {
        id: "v-catering",
        name: "Gastronomia & Sabores Moçambicanos",
        category: "catering",
        contact: "+258 82 300 4000",
        location: "Maputo",
        status: "contratado",
        contractedAmount: 450000,
        contract: { id: "ct-002", signed: true },
      },
      {
        id: "v-decor",
        name: "Atelier Botânico de Maputo",
        category: "decoracao",
        contact: "+258 87 500 6000",
        location: "Maputo",
        status: "sugerido",
        contractedAmount: 0,
        proposal: { id: "prop-003", amount: 180000, receivedAt: "2026-08-10", status: "pendente" },
      },
    ];

    // 3. Payments Ledger from RPC
    const realPaymentsPayload: ClientEventPaymentsRpcPayload = {
      payments: [
        {
          id: "pay-001",
          amount: 150000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "BIM-TRF-441092",
          notes: "Sinal Reserva Catembe Hotel",
          paid_at: "2026-08-05T10:00:00Z",
          created_at: "2026-08-05T10:00:00Z",
          document: { number: "FT-2026-441", client_name: "Leila & Armando" },
        },
        {
          id: "pay-002",
          amount: 200000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "BCI-TRF-992110",
          notes: "Sinal Catering Gastronomia",
          paid_at: "2026-08-12T14:30:00Z",
          created_at: "2026-08-12T14:30:00Z",
          document: { number: "FT-2026-448", client_name: "Leila & Armando" },
        },
      ],
      summary: {
        paymentCount: 2,
        totalPayments: 350000,
        totalPaid: 350000,
        pendingAmount: 450000,
        currency: "MZN",
        budgetMin: 1000000,
        budgetMax: 1200000,
        budgetRange: "1.000.000 MT - 1.200.000 MT",
        lastPayment: {
          id: "pay-002",
          amount: 200000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "BCI-TRF-992110",
          paid_at: "2026-08-12T14:30:00Z",
        },
      },
    };

    // 4. Run Normalized Ledger
    const ledger = buildNormalizedFinancialLedger({
      event: realEvent,
      vendors: realVendors,
      paymentsPayload: realPaymentsPayload,
      todayIso: "2026-08-18",
    });

    // Verification of Normalized Ledger
    assert.equal(ledger.clientNames, "Leila & Armando");
    assert.equal(ledger.eventLocation, "Catembe Gallery Hotel, Maputo");
    assert.equal(ledger.guestCount, 200);
    assert.equal(ledger.summary.budgetCeiling, 1200000);
    // Contracted: 350.000 (Venue) + 450.000 (Catering) = 800.000 MT (Decor is not contracted)
    assert.equal(ledger.summary.contractedAmount, 800000);
    // Paid: 150.000 + 200.000 = 350.000 MT
    assert.equal(ledger.summary.paidAmount, 350000);
    // Outstanding: 800.000 - 350.000 = 450.000 MT
    assert.equal(ledger.summary.outstandingAmount, 450000);
    // Uncommitted capital: 1.200.000 - 800.000 = 400.000 MT
    assert.equal(ledger.summary.uncommittedBudget, 400000);
    // Forecast final cost: 350.000 + 450.000 + 180.000 (Decor proposal) = 980.000 MT
    assert.equal(ledger.summary.forecastFinalCost, 980000);
    // Projected variance: 1.200.000 - 980.000 = 220.000 MT surplus
    assert.equal(ledger.summary.projectedVariance, 220000);
    // Cost per guest: 980.000 / 200 = 4.900 MT/Pax
    assert.equal(ledger.summary.costPerGuest, 4900);

    // 5. Convert to Private UI data (BudgetModuleData)
    const uiData = convertNormalizedLedgerToBudgetModuleData(ledger);
    assert.equal(uiData.summary.estimated, 1200000);
    assert.equal(uiData.summary.paid, 350000);
    assert.equal(uiData.summary.pending, 450000);
    assert.equal(uiData.items.length, 3);
    assert.equal(uiData.recentPayments.length, 2);

    // 6. Generate Official XLSX Workbook
    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);

    // 7. Verify all 9 sheets in the workbook
    const sheets = [
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
    sheets.forEach((s) => assert.ok(wb.getWorksheet(s), `Sheet ${s} must exist`));

    // 8. Prove parity between Dashboard cell values and Ledger
    const wsDash = wb.getWorksheet("01 — Executive Dashboard");
    assert.ok(wsDash);
    assert.equal(wsDash.getCell("C11").value, 1200000); // Budget Ceiling
    assert.equal(wsDash.getCell("C12").value, 800000);  // Contracted
    assert.equal(wsDash.getCell("C13").value, 350000);  // Paid
    assert.equal(wsDash.getCell("C14").value, 450000);  // Outstanding
    assert.equal(wsDash.getCell("C15").value, 400000);  // Uncommitted
    assert.equal(wsDash.getCell("C16").value, 980000);  // Forecast
    assert.equal(wsDash.getCell("C17").value, 220000);  // Variance
    assert.equal(wsDash.getCell("C18").value, 4900);    // Cost/Pax
    assert.equal(wsDash.getCell("F6").value, "200 Convidados (Pax)");
    assert.equal(wsDash.getCell("C6").value, "Catembe Gallery Hotel, Maputo");

    // 9. Verify that Cash Flow sheet lists the real payments and installments
    const wsCash = wb.getWorksheet("05 — Cash Flow");
    assert.ok(wsCash);
    assert.ok(wsCash.rowCount >= 4); // Header + Venue installment + Catering installment + Payments

    // 10. Verify that Wedding Day Payments has 0 mock data
    const wsDay = wb.getWorksheet("07 — Wedding Day Payments");
    assert.ok(wsDay);
    assert.notEqual(wsDay.getCell("C2").value, 15000);
    assert.notEqual(wsDay.getCell("C2").value, 10000);
  });
});
