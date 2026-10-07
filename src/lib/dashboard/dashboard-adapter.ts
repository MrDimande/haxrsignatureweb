import { ZodIssueCode, type ZodIssue } from "zod";
import { dashboardDataSchema } from "@/lib/dashboard/schemas";
import type { DashboardData, DashboardDataResult } from "@/lib/dashboard/types";

export type DashboardValidationIssue = {
  path: string;
  expected: string;
  received: string;
  code: string;
};

function isPreviewOrDevelopment(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

export function summarizeDashboardValidationIssues(
  issues: readonly ZodIssue[],
): DashboardValidationIssue[] {
  return issues.map((issue) => {
    const typeIssue = issue.code === ZodIssueCode.invalid_type ? issue : null;
    return {
      path: issue.path.map(String).join("."),
      expected: typeIssue?.expected ?? "unknown",
      received: typeIssue?.received ?? "unknown",
      code: issue.code,
    };
  });
}

/**
 * Validates and normalises dashboard payloads from any future data source.
 * Use after API/database reads to guarantee shape before rendering.
 */
export function adaptDashboardData(raw: unknown): DashboardDataResult {
  const parsed = dashboardDataSchema.safeParse(raw);

  if (!parsed.success) {
    if (isPreviewOrDevelopment()) {
      console.warn("dashboard_validation_failed", summarizeDashboardValidationIssues(parsed.error.issues));
    }
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
