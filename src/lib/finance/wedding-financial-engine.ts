import { PaymentStatus } from "@/lib/event-modules/types";

export interface MasterBudgetItem {
  id: string;
  categoryId?: string;
  category: string;
  vendorOrItem: string;
  initialPlanned: number;
  proposedAmount: number;
  contractedAmount: number;
  actualAmount: number;
  paidAmount: number;
  balance: number;
  variance: number;
  dueDate: string;
  dueDateIso?: string;
  status: PaymentStatus;
  notes?: string;
}

export interface PaymentInstallment {
  id: string;
  vendorOrItem: string;
  installmentLabel: string;
  amount: number;
  dueDate: string;
  dueDateIso?: string;
  paidAt?: string;
  status: PaymentStatus;
  method?: string;
  reference?: string;
  notes?: string;
}

export interface CategoryFinancialMetric {
  name: string;
  allocated: number;
  contracted: number;
  paid: number;
  balance: number;
  shareOfTotal: number;
}

export interface ExecutiveFinancialSummary {
  /** The initial estimated budget range or target (e.g. from onboarding). */
  estimatedBudget: number;
  /** Explicit approved budget if formally established, otherwise null. */
  approvedBudget: number | null;
  /** Active baseline ceiling (approvedBudget if set, else estimatedBudget). */
  budgetCeiling: number;
  hasApprovedBudget: boolean;
  /** Total formal/contracted commitments. */
  contractedAmount: number;
  /** Total disbarsed/liquidated payments. */
  paidAmount: number;
  /** Outstanding balance on contracted commitments (contracted - paid). */
  outstandingAmount: number;
  /** Remaining uncommitted capital from budget ceiling. */
  uncommittedBudget: number;
  /** Realistic final cost forecast (contracted for signed items + planned for uncontracted). */
  forecastFinalCost: number;
  /** Budget ceiling minus forecastFinalCost. Positive = margin, Negative = excess. */
  projectedVariance: number;
  isOverBudget: boolean;
  /** Contingency reserve allocated. */
  contingencyReserved: number;
  /** Contingency reserve disbarsed. */
  contingencySpent: number;
  /** Average investment per confirmed/estimated guest. */
  costPerGuest: number;
  guestCount: number;
  /** % of contracted commitments paid (0 - 100). */
  paymentProgress: number;
  /** % of budget ceiling contracted (0 - 100). */
  commitmentProgress: number;
  /** Total count of overdue installments. */
  overdueCount: number;
  /** Total amount currently past due date. */
  overdueTotalAmount: number;
  /** Next scheduled payment installment. */
  nextPayment: {
    vendorName: string;
    dueDate: string;
    amount: number;
  } | null;
}

export interface FinancialEngineInput {
  estimatedBudget: number;
  approvedBudget?: number | null;
  guestCount: number;
  items: MasterBudgetItem[];
  installments?: PaymentInstallment[];
  recordedPayments?: { amount: number; paidAt?: string; vendorOrItem?: string }[];
  todayIso?: string;
}

export function isPastDue(dueDateIso?: string, todayIso?: string): boolean {
  if (!dueDateIso) return false;
  const now = todayIso ? new Date(todayIso) : new Date();
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime())) return false;
  // Compare date only at midnight
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < now.getTime();
}

export function calculateExecutiveFinancialSummary(
  input: FinancialEngineInput,
): ExecutiveFinancialSummary {
  const { estimatedBudget, approvedBudget = null, guestCount, items, installments = [], recordedPayments = [], todayIso } = input;

  const budgetCeiling = approvedBudget !== null && approvedBudget > 0 ? approvedBudget : estimatedBudget;
  const hasApprovedBudget = approvedBudget !== null && approvedBudget > 0;

  let totalContracted = 0;
  let totalPaidFromItems = 0;
  let totalForecast = 0;
  let contingencyReserved = 0;
  let contingencySpent = 0;

  items.forEach((item) => {
    const isContingency = item.category.toLowerCase().includes("reserva") || item.category.toLowerCase().includes("conting");
    if (isContingency) {
      contingencyReserved += item.initialPlanned;
      contingencySpent += item.paidAmount;
    }

    const itemContracted = item.contractedAmount > 0 ? item.contractedAmount : (item.status === "pago" || item.status === "parcial" ? (item.actualAmount || item.initialPlanned) : 0);
    totalContracted += itemContracted;

    totalPaidFromItems += item.paidAmount;

    // Forecast: if contracted, use contracted value; otherwise, use initial planned value
    const itemForecast = item.contractedAmount > 0 ? item.contractedAmount : (item.actualAmount > 0 ? item.actualAmount : item.initialPlanned);
    totalForecast += itemForecast;
  });

  // Disbursed payments can also come from recorded payment ledger
  const totalPaidRecorded = recordedPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = Math.max(totalPaidFromItems, totalPaidRecorded);

  const outstandingAmount = Math.max(0, totalContracted - paidAmount);
  const uncommittedBudget = Math.max(0, budgetCeiling - totalContracted);
  const forecastFinalCost = totalForecast > 0 ? totalForecast : budgetCeiling;
  const projectedVariance = budgetCeiling - forecastFinalCost;
  const isOverBudget = projectedVariance < 0;

  const costPerGuest = guestCount > 0 ? Math.round(forecastFinalCost / guestCount) : 0;
  const paymentProgress = totalContracted > 0 ? Math.min(100, Math.round((paidAmount / totalContracted) * 100)) : (forecastFinalCost > 0 ? Math.min(100, Math.round((paidAmount / forecastFinalCost) * 100)) : 0);
  const commitmentProgress = budgetCeiling > 0 ? Math.min(100, Math.round((totalContracted / budgetCeiling) * 100)) : 0;

  // Overdue and Next Payment Calculation
  let overdueCount = 0;
  let overdueTotalAmount = 0;
  let nextPayment: ExecutiveFinancialSummary["nextPayment"] = null;
  let nearestUpcomingDueTime = Number.POSITIVE_INFINITY;
  const nowTime = todayIso ? new Date(todayIso).getTime() : Date.now();

  installments.forEach((inst) => {
    const isPaid = inst.status === "pago" || (inst.paidAt && inst.paidAt.trim().length > 0);
    const overdue = !isPaid && isPastDue(inst.dueDateIso, todayIso);

    if (overdue) {
      overdueCount++;
      overdueTotalAmount += inst.amount;
    } else if (!isPaid && inst.dueDateIso) {
      const dueTime = new Date(inst.dueDateIso).getTime();
      if (!Number.isNaN(dueTime) && dueTime >= nowTime && dueTime < nearestUpcomingDueTime) {
        nearestUpcomingDueTime = dueTime;
        nextPayment = {
          vendorName: inst.vendorOrItem,
          dueDate: inst.dueDate,
          amount: inst.amount,
        };
      }
    }
  });

  // Fallback nextPayment if none from installments
  if (!nextPayment && items.length > 0) {
    const pendingItem = items.find((i) => i.status === "pendente" || i.status === "parcial");
    if (pendingItem) {
      nextPayment = {
        vendorName: pendingItem.vendorOrItem,
        dueDate: pendingItem.dueDate,
        amount: pendingItem.balance > 0 ? pendingItem.balance : pendingItem.initialPlanned,
      };
    }
  }

  return {
    estimatedBudget,
    approvedBudget,
    budgetCeiling,
    hasApprovedBudget,
    contractedAmount: totalContracted,
    paidAmount,
    outstandingAmount,
    uncommittedBudget,
    forecastFinalCost,
    projectedVariance,
    isOverBudget,
    contingencyReserved,
    contingencySpent,
    costPerGuest,
    guestCount,
    paymentProgress,
    commitmentProgress,
    overdueCount,
    overdueTotalAmount,
    nextPayment,
  };
}

export function calculateCategoryBreakdown(
  items: MasterBudgetItem[],
): CategoryFinancialMetric[] {
  const categoryMap = new Map<string, { allocated: number; contracted: number; paid: number; balance: number }>();

  items.forEach((item) => {
    const cat = item.category || "Outros";
    const existing = categoryMap.get(cat) || { allocated: 0, contracted: 0, paid: 0, balance: 0 };

    existing.allocated += item.initialPlanned;
    existing.contracted += item.contractedAmount > 0 ? item.contractedAmount : (item.actualAmount || item.initialPlanned);
    existing.paid += item.paidAmount;
    existing.balance += item.balance;

    categoryMap.set(cat, existing);
  });

  const totalAllocated = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.allocated, 0);

  return Array.from(categoryMap.entries()).map(([name, stats]) => ({
    name,
    allocated: stats.allocated,
    contracted: stats.contracted,
    paid: stats.paid,
    balance: stats.balance,
    shareOfTotal: totalAllocated > 0 ? stats.allocated / totalAllocated : 0,
  }));
}
