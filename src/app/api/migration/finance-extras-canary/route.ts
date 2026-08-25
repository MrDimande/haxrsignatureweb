import { NextResponse } from "next/server";
import {
  createExpense,
  deleteExpense,
  listExpenses,
} from "@/lib/finance/repositories/expenses.repository";
import {
  listMonthlyTargets,
  upsertMonthlyTarget,
} from "@/lib/finance/repositories/targets.repository";
import { getCashAnalytics } from "@/lib/finance/repositories/overview.repository";
import { neonQuery } from "@/lib/neon/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "migration/supabase-to-neon"
  );
}

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  const initial = await neonQuery<{
    expenses: number;
    targets: number;
  }>(`
    SELECT
      (SELECT count(*)::int FROM public.finance_expenses) AS expenses,
      (SELECT count(*)::int FROM public.finance_monthly_targets) AS targets
  `);
  const initialCounts = initial.rows[0] ?? { expenses: 0, targets: 0 };

  const suffix = Date.now().toString(36);
  const targetYear = 2099;
  const targetMonth = 12;
  let expenseId: string | null = null;
  let targetId: string | null = null;

  try {
    const expense = await createExpense(
      {
        businessId: "haxr-signature",
        eventId: null,
        category: "marketing",
        description: `Migration Finance Expense ${suffix}`,
        amount: 3210.5,
        currency: "MZN",
        expenseDate: "2099-12-31",
        reference: `FIN-${suffix}`,
        notes: "Temporary Neon finance extras canary",
      },
      "",
    );
    expenseId = expense.id;

    const expenses = await listExpenses(200);

    const targetCreated = await upsertMonthlyTarget({
      businessId: "haxr-signature",
      year: targetYear,
      month: targetMonth,
      targetAmount: 100000,
      currency: "MZN",
      notes: `Migration target ${suffix}`,
    });
    targetId = targetCreated.id;

    const targetUpdated = await upsertMonthlyTarget({
      businessId: "haxr-signature",
      year: targetYear,
      month: targetMonth,
      targetAmount: 125000,
      currency: "MZN",
      notes: `Migration target updated ${suffix}`,
    });

    const yearTargets = await listMonthlyTargets(targetYear);
    const allTargets = await listMonthlyTargets();
    const analytics = await getCashAnalytics(targetYear);

    const operations = {
      expenseCreate:
        expense.businessId === "haxr-signature" &&
        expense.category === "marketing" &&
        expense.amount === 3210.5 &&
        expense.reference === `FIN-${suffix}`,
      expenseList: expenses.some((item) => item.id === expense.id),
      targetCreate:
        targetCreated.businessId === "haxr-signature" &&
        targetCreated.year === targetYear &&
        targetCreated.month === targetMonth &&
        targetCreated.targetAmount === 100000,
      targetUpsert:
        targetUpdated.id === targetCreated.id &&
        targetUpdated.targetAmount === 125000 &&
        targetUpdated.notes === `Migration target updated ${suffix}`,
      targetYearFilter:
        yearTargets.some(
          (item) =>
            item.id === targetCreated.id && item.targetAmount === 125000,
        ) && yearTargets.every((item) => item.year === targetYear),
      targetList: allTargets.some((item) => item.id === targetCreated.id),
      analyticsIntegration:
        analytics.financeExtrasEnabled === true &&
        analytics.expenses.some((item) => item.id === expense.id) &&
        analytics.monthlyTargets.some((item) => item.id === targetCreated.id),
    };

    await deleteExpense(expense.id);
    expenseId = null;

    await neonQuery(
      "DELETE FROM public.finance_monthly_targets WHERE id = $1::uuid",
      [targetCreated.id],
    );
    targetId = null;

    const final = await neonQuery<{
      expenses: number;
      targets: number;
    }>(`
      SELECT
        (SELECT count(*)::int FROM public.finance_expenses) AS expenses,
        (SELECT count(*)::int FROM public.finance_monthly_targets) AS targets
    `);
    const finalCounts = final.rows[0] ?? { expenses: -1, targets: -1 };

    const cleanup =
      finalCounts.expenses === initialCounts.expenses &&
      finalCounts.targets === initialCounts.targets;
    const ok = Object.values(operations).every(Boolean) && cleanup;

    return NextResponse.json(
      {
        ok,
        operations: { ...operations, cleanup },
        initialCounts,
        finalCounts,
      },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "finance_extras_neon_canary_failed",
        detail: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 503 },
    );
  } finally {
    if (expenseId) {
      await neonQuery(
        "DELETE FROM public.finance_expenses WHERE id = $1::uuid",
        [expenseId],
      ).catch(() => undefined);
    }
    if (targetId) {
      await neonQuery(
        "DELETE FROM public.finance_monthly_targets WHERE id = $1::uuid",
        [targetId],
      ).catch(() => undefined);
    }
  }
}
