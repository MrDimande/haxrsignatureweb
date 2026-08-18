import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildOfficialWeddingLedgerWorkbook,
  sanitizeWorkbookFilename,
} from "./excel-wedding-ledger";
import { buildNormalizedFinancialLedger } from "@/lib/finance/normalized-financial-ledger";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { Vendor } from "@/lib/event-modules/types";
import type { ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";

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

  const sampleVendors: Vendor[] = [
    {
      id: "v-1",
      name: "Espaço Nobre & Salão",
      category: "local",
      contact: "+258 84 123 4567",
      location: "Maputo",
      status: "contratado",
      contractedAmount: 250000,
      nextAction: "Assinatura de Termo",
      contract: { id: "c-1", signed: true },
    },
    {
      id: "v-2",
      name: "Catering Alta Cozinha",
      category: "catering",
      contact: "+258 84 999 8888",
      location: "Maputo",
      status: "contratado",
      contractedAmount: 350000,
      nextAction: "Prova de Menu",
      contract: { id: "c-2", signed: true },
    },
  ];

  const samplePaymentsPayload: ClientEventPaymentsRpcPayload = {
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
  };

  it("sanitizes workbook filename properly", () => {
    const filename = sanitizeWorkbookFilename("Casamento Vanessa & Mauro", "2026-08-20");
    assert.equal(filename, "HAXR_Wedding_Ledger_Casamento_Vanessa_Mauro_2026-08-20.xlsx");
  });

  it("proves EXACT mathematical parity across normalized ledger and workbook dashboard", async () => {
    const ledger = buildNormalizedFinancialLedger({
      event: baseEvent,
      vendors: sampleVendors,
      paymentsPayload: samplePaymentsPayload,
    });

    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);
    const wsDash = wb.getWorksheet("01 — Executive Dashboard");
    assert.ok(wsDash);

    // KPI values in dashboard
    const cellBudgetCeiling = wsDash.getCell("C11").value;
    const cellContracted = wsDash.getCell("C12").value;
    const cellPaid = wsDash.getCell("C13").value;
    const cellOutstanding = wsDash.getCell("C14").value;
    const cellUncommitted = wsDash.getCell("C15").value;
    const cellForecast = wsDash.getCell("C16").value;
    const cellVariance = wsDash.getCell("C17").value;
    const cellCostPerGuest = wsDash.getCell("C18").value;

    assert.equal(cellBudgetCeiling, ledger.summary.budgetCeiling);
    assert.equal(cellContracted, ledger.summary.contractedAmount);
    assert.equal(cellPaid, ledger.summary.paidAmount);
    assert.equal(cellOutstanding, ledger.summary.outstandingAmount);
    assert.equal(cellUncommitted, ledger.summary.uncommittedBudget);
    assert.equal(cellForecast, ledger.summary.forecastFinalCost);
    assert.equal(cellVariance, ledger.summary.projectedVariance);
    assert.equal(cellCostPerGuest, ledger.summary.costPerGuest);
  });

  it("ensures official workbook contains ZERO demo/mock financial records on an empty event", async () => {
    const emptyEvent: ClientEventRow = {
      ...baseEvent,
      budget_min: null,
      budget_max: null,
      estimated_guests: 0,
      event_location: null,
      event_date: null,
      bride_name: null,
      groom_name: null,
      event_name: "Novo Evento",
    };

    const ledger = buildNormalizedFinancialLedger({
      event: emptyEvent,
      vendors: [],
      paymentsPayload: null,
    });

    const wb = await buildOfficialWeddingLedgerWorkbook(ledger);

    // 1. Check Executive Dashboard: no 150 guests, no 800000 MT
    const wsDash = wb.getWorksheet("01 — Executive Dashboard");
    assert.ok(wsDash);
    assert.equal(wsDash.getCell("C11").value, 0); // budget ceiling
    assert.equal(wsDash.getCell("F6").value, "Lotação por definir");
    assert.equal(wsDash.getCell("C6").value, "Local por definir");

    // 2. Check 07 — Wedding Day Payments: ZERO 15.000 or 10.000 mock rows
    const wsDay = wb.getWorksheet("07 — Wedding Day Payments");
    assert.ok(wsDay);
    // Row 2 should be empty state row with 0 amount
    const dayAmount = wsDay.getCell("C2").value;
    assert.equal(dayAmount, 0);
    assert.notEqual(dayAmount, 15000);
    assert.notEqual(dayAmount, 10000);

    // 3. Check 05 — Cash Flow: ZERO 30/40/30 dummy rows
    const wsCash = wb.getWorksheet("05 — Cash Flow");
    assert.ok(wsCash);
    const cashCellA2 = String(wsCash.getCell("A2").value);
    assert.ok(!cashCellA2.includes("Fase 1: Sinais de Bloqueio"));
    assert.ok(cashCellA2.includes("Sem fluxos"));
  });
});
