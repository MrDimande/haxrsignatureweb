"use server";

import { runAction } from "@/lib/admin/actions/auth";
import * as analyticsRepo from "@/lib/admin/repositories/analytics.repository";
import type { BusinessId } from "@/lib/admin/types";

export async function getRevenueByBusinessAction(fiscalYear?: number) {
  return runAction(() => analyticsRepo.getRevenueByBusiness(fiscalYear));
}

export async function getRevenueByMonthAction(
  fiscalYear: number,
  businessId?: BusinessId
) {
  return runAction(() =>
    analyticsRepo.getRevenueByMonth(fiscalYear, businessId)
  );
}

export async function getDocumentAnalyticsAction(
  filters?: analyticsRepo.AnalyticsFilters
) {
  return runAction(() => analyticsRepo.queryDocumentAnalytics(filters));
}
