import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateExecutiveFinancialSummary,
  calculateCategoryBreakdown,
  isPastDue,
  MasterBudgetItem,
  PaymentInstallment,
} from "./wedding-financial-engine";

describe("Wedding Financial Calculation Engine", () => {
  it("accurately calculates summary metrics from master budget items and payments", () => {
    const items: MasterBudgetItem[] = [
      {
        id: "item-1",
        category: "Espaço & Salão",
        vendorOrItem: "Quinta dos Cedros",
        initialPlanned: 200000,
        proposedAmount: 220000,
        contractedAmount: 190000,
        actualAmount: 190000,
        paidAmount: 95000,
        balance: 95000,
        variance: 10000, // saved 10.000 MT
        dueDate: "30 Ago 2026",
        dueDateIso: "2026-08-30",
        status: "parcial",
      },
      {
        id: "item-2",
        category: "Catering & Gastronomia",
        vendorOrItem: "Alta Cozinha",
        initialPlanned: 300000,
        proposedAmount: 320000,
        contractedAmount: 300000,
        actualAmount: 300000,
        paidAmount: 100000,
        balance: 200000,
        variance: 0,
        dueDate: "15 Set 2026",
        dueDateIso: "2026-09-15",
        status: "parcial",
      },
      {
        id: "item-3",
        category: "Reserva & Contingência",
        vendorOrItem: "Fundo de Segurança",
        initialPlanned: 40000,
        proposedAmount: 0,
        contractedAmount: 0,
        actualAmount: 0,
        paidAmount: 0,
        balance: 40000,
        variance: 0,
        dueDate: "Semana do Evento",
        status: "planeado",
      },
    ];

    const installments: PaymentInstallment[] = [
      {
        id: "inst-1",
        vendorOrItem: "Quinta dos Cedros",
        installmentLabel: "Sinal 50%",
        amount: 95000,
        dueDate: "01 Jul 2026",
        dueDateIso: "2026-07-01",
        paidAt: "2026-07-01",
        status: "pago",
      },
      {
        id: "inst-2",
        vendorOrItem: "Quinta dos Cedros",
        installmentLabel: "Reforço 50%",
        amount: 95000,
        dueDate: "01 Ago 2026",
        dueDateIso: "2026-08-01",
        status: "pendente",
      },
    ];

    const summary = calculateExecutiveFinancialSummary({
      estimatedBudget: 800000,
      approvedBudget: 750000,
      guestCount: 150,
      items,
      installments,
      todayIso: "2026-08-18",
    });

    // Contracted: 190.000 + 300.000 = 490.000
    assert.equal(summary.contractedAmount, 490000);
    // Paid: 95.000 + 100.000 = 195.000
    assert.equal(summary.paidAmount, 195000);
    // Outstanding: 490.000 - 195.000 = 295.000
    assert.equal(summary.outstandingAmount, 295000);
    // Budget Ceiling: approved budget (750.000)
    assert.equal(summary.budgetCeiling, 750000);
    assert.equal(summary.hasApprovedBudget, true);
    // Uncommitted: 750.000 - 490.000 = 260.000
    assert.equal(summary.uncommittedBudget, 260000);
    // Forecast Final Cost: 190.000 + 300.000 + 40.000 = 530.000
    assert.equal(summary.forecastFinalCost, 530000);
    // Projected Variance: 750.000 - 530.000 = 220.000 (surplus)
    assert.equal(summary.projectedVariance, 220000);
    assert.equal(summary.isOverBudget, false);
    // Cost per guest: 530.000 / 150 = 3.533 MT
    assert.equal(summary.costPerGuest, 3533);
    // Overdue check: inst-2 due 2026-08-01 is past 2026-08-18
    assert.equal(summary.overdueCount, 1);
    assert.equal(summary.overdueTotalAmount, 95000);
  });

  it("handles estimated budget when approved budget is null without inventing approved budget", () => {
    const summary = calculateExecutiveFinancialSummary({
      estimatedBudget: 600000,
      approvedBudget: null,
      guestCount: 100,
      items: [],
    });

    assert.equal(summary.estimatedBudget, 600000);
    assert.equal(summary.approvedBudget, null);
    assert.equal(summary.hasApprovedBudget, false);
    assert.equal(summary.budgetCeiling, 600000);
  });

  it("calculates category breakdown percentages accurately", () => {
    const items: MasterBudgetItem[] = [
      {
        id: "1",
        category: "Decoração",
        vendorOrItem: "Flores",
        initialPlanned: 100000,
        proposedAmount: 100000,
        contractedAmount: 100000,
        actualAmount: 100000,
        paidAmount: 50000,
        balance: 50000,
        variance: 0,
        dueDate: "—",
        status: "parcial",
      },
      {
        id: "2",
        category: "Música",
        vendorOrItem: "DJ",
        initialPlanned: 100000,
        proposedAmount: 100000,
        contractedAmount: 100000,
        actualAmount: 100000,
        paidAmount: 100000,
        balance: 0,
        variance: 0,
        dueDate: "—",
        status: "pago",
      },
    ];

    const breakdown = calculateCategoryBreakdown(items);
    assert.equal(breakdown.length, 2);
    assert.equal(breakdown[0].shareOfTotal, 0.5);
    assert.equal(breakdown[1].shareOfTotal, 0.5);
  });

  it("detects past due dates correctly", () => {
    assert.equal(isPastDue("2026-08-01", "2026-08-18"), true);
    assert.equal(isPastDue("2026-08-30", "2026-08-18"), false);
  });
});
