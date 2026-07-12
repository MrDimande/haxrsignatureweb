"use server";

import { runAction } from "@/lib/admin/actions/auth";
import {
  getAdminAlerts,
  getAdminBadgeCounts,
} from "@/lib/admin/services/admin-alerts.service";

export async function getAdminBadgeCountsAction() {
  return runAction(() => getAdminBadgeCounts());
}

export async function getAdminAlertsAction() {
  return runAction(() => getAdminAlerts());
}
