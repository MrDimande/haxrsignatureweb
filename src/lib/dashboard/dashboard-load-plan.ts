export type DashboardLoadPlan =
  | { source: "demo" }
  | { source: "redirect"; url: string }
  | { source: "api"; eventId: string }
  | { source: "local" };

export function resolveDashboardLoadPlan(input: {
  demoMode: boolean;
  onboardingRedirect: string | null;
  realEventId: string | null;
}): DashboardLoadPlan {
  if (input.demoMode) {
    return { source: "demo" };
  }

  if (input.onboardingRedirect) {
    return { source: "redirect", url: input.onboardingRedirect };
  }

  if (input.realEventId) {
    return { source: "api", eventId: input.realEventId };
  }

  return { source: "local" };
}
