import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNormalizedFinancialLedger, convertNormalizedLedgerToBudgetModuleData } from "./normalized-financial-ledger";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";
import type { Vendor } from "@/lib/event-modules/types";

describe("Normalized Financial Ledger Assembler", () => {
  const baseEvent: ClientEventRow = {
    id: "evt-uuid-1",
    owner_user_id: "user-1",
    slug: "casamento-jessica-samuel",
    event_name: "Casamento Jessica & Samuel",
    event_type: "wedding",
    bride_name: "Jessica",
    groom_name: "Samuel",
    event_date: "2026-09-20",
    event_location: "Polana Serena Hotel, Maputo",
    estimated_guests: 150,
    budget_min: 700000,
    budget_max: 850000,
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

  const samplePaymentsPayload: ClientEventPaymentsRpcPayload = {
    payments: [
      {
        id: "pay-1",
        amount: 80000,
        currency: "MZN",
        payment_method: "bank_transfer",
        reference: "TRF-88219",
        notes: "Sinal Assessoria HAXR",
        paid_at: "2026-08-10T14:00:00Z",
        created_at: "2026-08-10T14:00:00Z",
        document: { number: "FT-2026-001", client_name: "Jessica & Samuel" },
      },
    ],
    summary: {
      paymentCount: 1,
      totalPayments: 80000,
      totalPaid: 80000,
      pendingAmount: 0,
      currency: "MZN",
      budgetMin: 700000,
      budgetMax: 850000,
      budgetRange: "700.000 MT - 850.000 MT",
      lastPayment: {
        id: "pay-1",
        amount: 80000,
        currency: "MZN",
        payment_method: "bank_transfer",
        reference: "TRF-88219",
        paid_at: "2026-08-10T14:00:00Z",
      },
    },
  };

  const sampleVendors: Vendor[] = [
    {
      id: "v-1",
      name: "HAXR Signature Assessoria",
      category: "outro",
      contact: "+258 87 088 3428",
      location: "Maputo",
      status: "contratado",
      contractedAmount: 80000,
      nextAction: "Cronograma de Produção",
      contract: { id: "c-1", signed: true },
    },
    {
      id: "v-2",
      name: "Catering 4 Tempos",
      category: "catering",
      contact: "+258 84 111 2222",
      location: "Maputo",
      status: "em_análise",
      contractedAmount: 250000,
      proposal: { id: "prop-1", amount: 250000, receivedAt: "2026-08-05", status: "pendente" },
      nextAction: "Degustação de Menu",
    },
  ];

  it("normalizes real event, vendor and payment data without conflating approved budget", () => {
    const ledger = buildNormalizedFinancialLedger({
      event: baseEvent,
      paymentsPayload: samplePaymentsPayload,
      vendors: sampleVendors,
    });

    assert.equal(ledger.clientNames, "Jessica & Samuel");
    assert.equal(ledger.eventTitle, "Casamento Jessica & Samuel");
    assert.equal(ledger.guestCount, 150);
    // Estimated budget comes from budget_max (850000)
    assert.equal(ledger.summary.estimatedBudget, 850000);
    assert.equal(ledger.summary.approvedBudget, null);
    assert.equal(ledger.summary.hasApprovedBudget, false);
    // Contracted amount = 80000 + 250000 = 330000
    assert.equal(ledger.summary.contractedAmount, 330000);
    // Paid = 80000
    assert.equal(ledger.summary.paidAmount, 80000);
    // Outstanding = 330000 - 80000 = 250000
    assert.equal(ledger.summary.outstandingAmount, 250000);
    // Items length = 2 vendors
    assert.equal(ledger.items.length, 2);
  });

  it("converts cleanly to BudgetModuleData for private UI rendering", () => {
    const ledger = buildNormalizedFinancialLedger({
      event: baseEvent,
      paymentsPayload: samplePaymentsPayload,
      vendors: sampleVendors,
    });

    const moduleData = convertNormalizedLedgerToBudgetModuleData(ledger);
    assert.equal(moduleData.summary.paid, 80000);
    assert.equal(moduleData.summary.pending, 250000);
    assert.equal(moduleData.items.length, 2);
    assert.equal(moduleData.recentPayments.length, 1);
  });
});
