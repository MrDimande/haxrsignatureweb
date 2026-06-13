import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import {
  buildCashAnalytics,
  pickFinanceOverview,
} from "@/lib/finance/analytics";
import { enrichPayments } from "@/lib/finance/balances";
import {
  buildEventRevenue,
  buildMarginSummary,
  buildOverdueAlerts,
  computeMonthProgress,
  resolveCurrentMonthTarget,
} from "@/lib/finance/extended-analytics";
import * as expensesRepo from "@/lib/finance/repositories/expenses.repository";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import * as targetsRepo from "@/lib/finance/repositories/targets.repository";
import type { CashAnalytics, FinanceOverview, PaymentRecord } from "@/lib/finance/types";

function enrichWithFinanceExtras(
  analytics: CashAnalytics,
  documents: Awaited<ReturnType<typeof documentsRepo.listDocuments>>,
  events: Awaited<ReturnType<typeof eventsRepo.listAllEvents>>,
  expenses: Awaited<ReturnType<typeof expensesRepo.listExpenses>>,
  targets: Awaited<ReturnType<typeof targetsRepo.listMonthlyTargets>>,
  financeExtrasEnabled: boolean
): CashAnalytics {
  const enrichedExpenses = expensesRepo.enrichExpensesWithEvents(
    expenses,
    events
  );
  const margin = buildMarginSummary(
    analytics.payments,
    analytics.paidMovements,
    enrichedExpenses
  );
  const currentMonthTarget = resolveCurrentMonthTarget(targets);

  return {
    ...analytics,
    expenses: enrichedExpenses,
    monthlyTargets: targets,
    overdueAlerts: buildOverdueAlerts(documents),
    eventRevenue: buildEventRevenue(
      events,
      documents,
      analytics.payments,
      enrichedExpenses
    ),
    margin,
    currentMonthTarget,
    currentMonthProgress: computeMonthProgress(
      margin.monthReceived,
      currentMonthTarget
    ),
    financeExtrasEnabled,
  };
}

export async function getCashAnalytics(
  fiscalYear?: number
): Promise<CashAnalytics> {
  const year = fiscalYear ?? new Date().getUTCFullYear();
  const [documents, businesses, events] = await Promise.all([
    documentsRepo.listDocuments(),
    businessesRepo.listBusinesses(),
    eventsRepo.listAllEvents(),
  ]);

  let payments: PaymentRecord[] = [];
  let paymentsEnabled = false;

  try {
    payments = await paymentsRepo.listPayments(200);
    payments = await enrichPayments(payments, documents);
    paymentsEnabled = true;
  } catch {
    payments = [];
  }

  const base = buildCashAnalytics(
    documents,
    businesses.map((b) => ({ id: b.id, name: b.name })),
    year,
    payments,
    paymentsEnabled
  );

  let expenses: Awaited<ReturnType<typeof expensesRepo.listExpenses>> = [];
  let targets: Awaited<ReturnType<typeof targetsRepo.listMonthlyTargets>> = [];
  let financeExtrasEnabled = false;

  try {
    [expenses, targets] = await Promise.all([
      expensesRepo.listExpenses(200),
      targetsRepo.listMonthlyTargets(year),
    ]);
    financeExtrasEnabled = true;
  } catch {
    expenses = [];
    targets = [];
  }

  return enrichWithFinanceExtras(
    base,
    documents,
    events,
    expenses,
    targets,
    financeExtrasEnabled
  );
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  const analytics = await getCashAnalytics();
  return pickFinanceOverview(analytics);
}

export async function listOpenCollectionDocuments() {
  const documents = await documentsRepo.listDocuments();
  return documents
    .filter(
      (doc) =>
        (doc.documentType === "invoice" || doc.documentType === "proforma") &&
        doc.status === "sent"
    )
    .sort(
      (a, b) =>
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );
}
