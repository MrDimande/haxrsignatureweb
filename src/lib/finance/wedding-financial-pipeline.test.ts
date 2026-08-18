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

describe("HAXR Canonical Wedding Financial Pipeline & Parity", () => {
  // 1. Base Canonical Fixture: Leila & Armando
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
        vendor_id: "v-venue",
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
        vendor_id: "v-catering",
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

  it("proves EXACT parity: Normalized Ledger === Private UI Data === XLSX Workbook", async () => {
    // Build Canonical Ledger
    const ledger = buildNormalizedFinancialLedger({
      event: realEvent,
      vendors: realVendors,
      paymentsPayload: realPaymentsPayload,
      todayIso: "2026-08-18",
    });

    // 1. Verify Canonical Ledger Values
    assert.equal(ledger.clientNames, "Leila & Armando");
    assert.equal(ledger.eventTitle, "Casamento Leila & Armando");
    assert.equal(ledger.eventDateFormatted, "14 de novembro de 2026");
    assert.equal(ledger.eventLocation, "Catembe Gallery Hotel, Maputo");
    assert.equal(ledger.guestCount, 200);
    assert.equal(ledger.summary.budgetCeiling, 1200000);
    assert.equal(ledger.summary.contractedAmount, 800000);
    assert.equal(ledger.summary.paidAmount, 350000);
    assert.equal(ledger.summary.outstandingAmount, 450000);
    assert.equal(ledger.summary.uncommittedBudget, 400000);
    assert.equal(ledger.summary.forecastFinalCost, 980000);
    assert.equal(ledger.summary.projectedVariance, 220000);
    assert.equal(ledger.summary.costPerGuest, 4900);

    // 2. Convert to UI Data and verify that UI Data carries the identical canonical ledger
    const uiData = convertNormalizedLedgerToBudgetModuleData(ledger);
    assert.ok(uiData.ledger, "uiData must carry the canonical ledger");
    assert.equal(uiData.ledger.summary.budgetCeiling, 1200000);
    assert.equal(uiData.ledger.summary.contractedAmount, 800000);
    assert.equal(uiData.ledger.summary.paidAmount, 350000);
    assert.equal(uiData.ledger.summary.outstandingAmount, 450000);
    assert.equal(uiData.ledger.summary.uncommittedBudget, 400000);
    assert.equal(uiData.ledger.summary.forecastFinalCost, 980000);
    assert.equal(uiData.ledger.summary.projectedVariance, 220000);
    assert.equal(uiData.ledger.summary.costPerGuest, 4900);
    assert.equal(uiData.ledger.guestCount, 200);

    // 3. Generate XLSX directly from the same canonical ledger passed to UI
    const wb = await buildOfficialWeddingLedgerWorkbook(uiData.ledger);
    const wsDash = wb.getWorksheet("01 — Executive Dashboard");
    assert.ok(wsDash);

    // Cell checks on Dashboard
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
    assert.equal(wsDash.getCell("C5").value, "Casamento Leila & Armando");
  });

  it("item-level reconciliation: reconciles exact vendor contracted, paid, and balance lines", () => {
    const ledger = buildNormalizedFinancialLedger({
      event: realEvent,
      vendors: realVendors,
      paymentsPayload: realPaymentsPayload,
    });

    // Find Venue item
    const venueItem = ledger.items.find((i) => i.id === "v-venue");
    assert.ok(venueItem);
    assert.equal(venueItem.contractedAmount, 350000);
    assert.equal(venueItem.paidAmount, 150000);
    assert.equal(venueItem.balance, 200000);
    assert.equal(venueItem.status, "parcial");

    // Find Catering item
    const cateringItem = ledger.items.find((i) => i.id === "v-catering");
    assert.ok(cateringItem);
    assert.equal(cateringItem.contractedAmount, 450000);
    assert.equal(cateringItem.paidAmount, 200000);
    assert.equal(cateringItem.balance, 250000);
    assert.equal(cateringItem.status, "parcial");

    // Find Decor item (uncontracted)
    const decorItem = ledger.items.find((i) => i.id === "v-decor");
    assert.ok(decorItem);
    assert.equal(decorItem.contractedAmount, 0);
    assert.equal(decorItem.paidAmount, 0);
    assert.equal(decorItem.balance, 0);
    assert.equal(decorItem.status, "planeado");

    // Totals verification
    const totalContracted = ledger.items.reduce((s, i) => s + i.contractedAmount, 0);
    const totalPaid = ledger.items.reduce((s, i) => s + i.paidAmount, 0);
    const totalBalance = ledger.items.reduce((s, i) => s + (i.contractedAmount > 0 ? i.balance : 0), 0);

    assert.equal(totalContracted, 800000);
    assert.equal(totalPaid, 350000);
    assert.equal(totalBalance, 450000);
  });

  it("cash flow reconciliation: sum of economic outflows matches exact contract commitments without duplication", async () => {
    const ledger = buildNormalizedFinancialLedger({
      event: realEvent,
      vendors: realVendors,
      paymentsPayload: realPaymentsPayload,
    });

    // Total installments sum
    const totalInstallmentsAmount = ledger.installments.reduce((sum, inst) => sum + inst.amount, 0);
    // For contracted vendors: paid portions (150k + 200k = 350k) + balance portions (200k + 250k = 450k) = 800.000 MT
    assert.equal(totalInstallmentsAmount, 800000);

    // Generate XLSX and verify Cash Flow sheet
    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);
    const wsCash = wb.getWorksheet("05 — Cash Flow");
    assert.ok(wsCash);

    let sumOutflows = 0;
    wsCash.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const val = Number(row.getCell(3).value) || 0;
        sumOutflows += val;
      }
    });

    assert.equal(sumOutflows, 800000, "Cash flow total scheduled outflows must equal exact contracted total of 800.000 MT without duplication");
  });

  it("negotiation scenario: preserves proposal (500k), contracted (470k), saving (30k), paid (200k), balance (270k)", async () => {
    const negotiatedVendor: Vendor = {
      id: "v-neg-01",
      name: "Alta Costura Floral",
      category: "decoracao",
      status: "contratado",
      contractedAmount: 470000,
      proposal: {
        id: "prop-01",
        amount: 500000,
        receivedAt: "2026-08-01",
        status: "aprovada",
      },
      contract: {
        id: "ct-01",
        signed: true,
      },
    };

    const payment: ClientEventPaymentsRpcPayload = {
      payments: [
        {
          id: "pay-neg-01",
          amount: 200000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "REF-NEG-200",
          notes: "Sinal contratual negociado",
          paid_at: "2026-08-05T10:00:00Z",
          created_at: "2026-08-05T10:00:00Z",
          document: null,
          vendor_id: "v-neg-01",
        },
      ],
      summary: {
        paymentCount: 1,
        totalPayments: 200000,
        totalPaid: 200000,
        pendingAmount: 270000,
        currency: "MZN",
        budgetMin: 500000,
        budgetMax: 500000,
        budgetRange: "500000",
        lastPayment: null,
      },
    };

    const ledger = buildNormalizedFinancialLedger({
      event: { ...realEvent, budget_max: 500000, budget_min: 500000 },
      vendors: [negotiatedVendor],
      paymentsPayload: payment,
    });

    const item = ledger.items[0];
    assert.ok(item);
    assert.equal(item.proposedAmount, 500000);
    assert.equal(item.contractedAmount, 470000);
    assert.equal(item.variance, 30000, "Saving must be exactly 30.000 MT (500k proposal - 470k contracted)");
    assert.equal(item.paidAmount, 200000);
    assert.equal(item.balance, 270000, "Balance must be 270.000 MT (470k contracted - 200k paid)");

    // UI Data parity
    const uiData = convertNormalizedLedgerToBudgetModuleData(ledger);
    const uiItem = uiData.items[0];
    assert.equal(uiItem.proposedAmount, 500000);
    assert.equal(uiItem.contractedAmount, 470000);
    assert.equal(uiItem.variance, 30000);
    assert.equal(uiItem.paidAmount, 200000);
    assert.equal(uiItem.balance, 270000);

    // XLSX Workbook Savings Sheet parity
    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);
    const wsSavings = wb.getWorksheet("08 — Savings & Negotiations");
    assert.ok(wsSavings);

    const row2 = wsSavings.getRow(2);
    assert.equal(row2.getCell(1).value, "Alta Costura Floral");
    assert.equal(row2.getCell(2).value, 500000); // Initial proposed
    assert.equal(row2.getCell(3).value, 470000); // Final contracted
    assert.equal(row2.getCell(4).value, 30000);  // Saved
  });
});
