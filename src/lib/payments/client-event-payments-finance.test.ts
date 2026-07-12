import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import { mapRpcPayloadToDashboardFinanceMetrics } from "@/lib/payments/client-event-payments-finance";
import type { ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";

const baseEvent: ClientEventRow = {
  id: "f51ce8b2-6b5c-4692-852e-fb1dad1842e1",
  owner_user_id: "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee",
  slug: "staging-a",
  event_name: "Staging A Event",
  event_type: "wedding",
  bride_name: "Staging",
  groom_name: "A",
  event_date: "2026-12-20",
  event_location: "Maputo",
  estimated_guests: 150,
  budget_min: null,
  budget_max: 150000,
  status: "planning",
  source: "onboarding",
  services_interested: [],
  phone: "+258840000000",
  operational_event_id: "1251bc6e-fac7-46cd-981d-bb3e4c066ce8",
  is_active: true,
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

const stagingPayload: ClientEventPaymentsRpcPayload = {
  payments: [],
  summary: {
    paymentCount: 2,
    totalPayments: 40000,
    totalPaid: 40000,
    pendingAmount: 110000,
    currency: "MZN",
    budgetMin: null,
    budgetMax: 150000,
    budgetRange: null,
    lastPayment: {
      id: "pay-2",
      amount: 15000,
      currency: "MZN",
      payment_method: "bank_transfer",
      reference: "TRF-002",
      paid_at: "2026-07-09T11:00:00.000Z",
    },
  },
};

describe("client-event-payments-finance", () => {
  it("mapRpcPayloadToDashboardFinanceMetrics maps staging payment totals", () => {
    const metrics = mapRpcPayloadToDashboardFinanceMetrics(baseEvent, stagingPayload);

    assert.equal(metrics.paymentCount, 2);
    assert.equal(metrics.paidAmount, 40000);
    assert.equal(metrics.pendingAmount, 110000);
    assert.equal(metrics.budgetEstimated, 150000);
    assert.equal(metrics.nextPayment.amount, 15000);
  });

  it("mapRpcPayloadToDashboardFinanceMetrics returns safe zeros without payments", () => {
    const emptyPayload: ClientEventPaymentsRpcPayload = {
      payments: [],
      summary: {
        paymentCount: 0,
        totalPayments: 0,
        totalPaid: 0,
        pendingAmount: 150000,
        currency: "MZN",
        budgetMin: null,
        budgetMax: 150000,
        budgetRange: null,
        lastPayment: null,
      },
    };

    const metrics = mapRpcPayloadToDashboardFinanceMetrics(baseEvent, emptyPayload);

    assert.equal(metrics.paymentCount, 0);
    assert.equal(metrics.paidAmount, 0);
    assert.equal(metrics.pendingAmount, 150000);
    assert.equal(metrics.nextPayment.vendorName, "—");
    assert.equal(metrics.nextPayment.amount, 0);
  });
});
