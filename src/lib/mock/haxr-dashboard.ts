/**
 * @deprecated Import from `@/lib/dashboard/types` and `@/lib/dashboard/mock-dashboard-data`.
 * Kept for backward compatibility during migration.
 */
export type {
  DashboardEventOverview as EventOverview,
  DashboardStatCard as StatCardData,
  DashboardProgressItem as ProgressMetric,
  DashboardNextAction as NextAction,
  DashboardModule as ModuleItem,
  DashboardGuestSnapshot as GuestSnapshot,
  DashboardVendorSnapshot as VendorSnapshotItem,
  DashboardRecentActivity as RecentActivityItem,
  DashboardConciergeSummary as ConciergeSummary,
} from "@/lib/dashboard/types";

export type { DashboardFinanceSnapshot as FinanceSnapshot } from "@/lib/dashboard/types";

import {
  DEFAULT_DASHBOARD_EVENT_ID,
  getMockDashboardData,
} from "@/lib/dashboard/mock-dashboard-data";
import { VENDOR_STATUS_STYLES } from "@/lib/dashboard/presentation";
import { formatCurrencyMZN } from "@/lib/formatters";

const legacy = getMockDashboardData(DEFAULT_DASHBOARD_EVENT_ID);

if (!legacy) {
  throw new Error("Default mock dashboard data is missing.");
}

export const eventOverview = {
  name: legacy.eventOverview.name,
  type: legacy.eventOverview.type,
  date: legacy.eventOverview.date,
  location: legacy.eventOverview.location,
  status: legacy.eventOverview.status,
  responsible: legacy.eventOverview.responsible,
  progress: legacy.eventOverview.progress,
};

export const dashboardStats = legacy.stats.map((stat) => ({
  label: stat.label,
  value:
    stat.valueType === "currency" && typeof stat.value === "number"
      ? formatCurrencyMZN(stat.value, legacy.financeSnapshot.currency)
      : stat.value,
  detail: stat.detail,
}));

export const planningProgress = legacy.progress.map((item) => ({
  name: item.name,
  value: item.value,
}));

export const nextActions = legacy.nextActions.map((action) => ({
  id: action.id,
  title: action.title,
  due: action.dueDate,
  priority: action.priority,
}));

export const modules = legacy.modules.map((module) => ({
  id: module.id,
  title: module.title,
  description: module.description,
  metric: module.metric,
  status: module.status,
  href: module.href,
}));

export const financeSnapshot = {
  estimated: formatCurrencyMZN(
    legacy.financeSnapshot.budgetEstimated,
    legacy.financeSnapshot.currency
  ),
  registered: formatCurrencyMZN(
    legacy.financeSnapshot.budgetRegistered,
    legacy.financeSnapshot.currency
  ),
  paid: formatCurrencyMZN(
    legacy.financeSnapshot.paidAmount,
    legacy.financeSnapshot.currency
  ),
  pending: formatCurrencyMZN(
    legacy.financeSnapshot.pendingAmount,
    legacy.financeSnapshot.currency
  ),
  nextPayment: {
    fornecedor: legacy.financeSnapshot.nextPayment.vendorName,
    dueDate: legacy.financeSnapshot.nextPayment.dueDate,
    value: formatCurrencyMZN(
      legacy.financeSnapshot.nextPayment.amount,
      legacy.financeSnapshot.currency
    ),
  },
};

export const guestSnapshot = {
  total: legacy.guestSnapshot.total,
  confirmed: legacy.guestSnapshot.confirmed,
  pending: legacy.guestSnapshot.pending,
  declined: legacy.guestSnapshot.declined,
  plusOnes: legacy.guestSnapshot.plusOnes,
  tablesAssigned: `${legacy.guestSnapshot.tablesAssigned} / ${legacy.guestSnapshot.tablesTotal} mesas`,
};

export const vendorSnapshot = legacy.vendorSnapshot.map((vendor) => ({
  name: vendor.name,
  service: vendor.service,
  status: vendor.status,
  statusColor: VENDOR_STATUS_STYLES[vendor.status],
}));

export const recentActivity = legacy.recentActivity.map((activity) => ({
  id: activity.id,
  text: activity.description ?? activity.title,
  time: activity.relativeLabel,
}));

export const conciergeSummary = {
  documentsToday: legacy.conciergeSummary.documentsToday,
  contractsAwaiting: legacy.conciergeSummary.contractsAwaiting,
  proposalsApproval: legacy.conciergeSummary.proposalsApproval,
  guestsNoResponse: legacy.conciergeSummary.guestsNoResponse,
};
