import { dashboardDataSchema } from "@/lib/dashboard/schemas";
import type { DashboardData, DashboardDataResult } from "@/lib/dashboard/types";

/**
 * Validates and normalises dashboard payloads from any future data source.
 * Use after API/database reads to guarantee shape before rendering.
 */
export function adaptDashboardData(raw: unknown): DashboardDataResult {
  const parsed = dashboardDataSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "unavailable",
      message: "Formato de dados do painel inválido.",
    };
  }

  return { ok: true, data: parsed.data };
}

export function assertDashboardData(data: DashboardData): DashboardData {
  const result = adaptDashboardData(data);
  if (!result.ok) {
    throw new Error(result.message ?? "Dashboard data validation failed.");
  }
  return result.data;
}
