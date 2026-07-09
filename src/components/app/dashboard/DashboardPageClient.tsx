"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardEmptyState from "@/components/app/dashboard/DashboardEmptyState";
import DashboardErrorState from "@/components/app/dashboard/DashboardErrorState";
import DashboardOverview from "@/components/app/dashboard/DashboardOverview";
import DashboardSkeleton from "@/components/app/dashboard/DashboardSkeleton";
import { CLIENT_SIGN_IN_PATH } from "@/lib/auth/client-app-middleware";
import { resolveDashboardEntryRedirect } from "@/lib/auth/onboarding-status";
import {
  resolvePreferredRealClientEventId,
} from "@/lib/auth/resolve-active-event-id";
import { buildDashboardFromOnboardingStore } from "@/lib/dashboard/onboarding-dashboard-adapter";
import { resolveDashboardLoadPlan } from "@/lib/dashboard/dashboard-load-plan";
import type { DashboardDataResult } from "@/lib/dashboard/types";

const ACTIVE_EVENT_NAME_KEY = "haxr_active_event_name";

type DashboardPageClientProps = {
  initialResult?: DashboardDataResult;
  eventId: string;
  demoMode?: boolean;
  profileActiveEventId?: string | null;
};

function cacheActiveEventName(name: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_EVENT_NAME_KEY, name);
  window.dispatchEvent(new Event("haxr:onboarding-updated"));
}

async function fetchRealEventDashboard(eventId: string): Promise<{
  result: DashboardDataResult;
  status: number;
}> {
  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/dashboard`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as DashboardDataResult;
  return { result: payload, status: response.status };
}

export default function DashboardPageClient({
  initialResult,
  eventId,
  demoMode = false,
  profileActiveEventId = null,
}: DashboardPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const [result, setResult] = useState<DashboardDataResult | null>(
    demoMode ? (initialResult ?? null) : null,
  );
  const [isBootstrapping, setIsBootstrapping] = useState(!demoMode);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (demoMode) {
      setResult(initialResult ?? null);
      setIsBootstrapping(false);
      return;
    }

    const redirect = resolveDashboardEntryRedirect();
    const realEventId = resolvePreferredRealClientEventId({
      searchParams: new URLSearchParams(searchKey),
      store: localStorage,
      profileActiveEventId,
    });
    const plan = resolveDashboardLoadPlan({
      demoMode,
      onboardingRedirect: redirect,
      realEventId,
    });

    if (plan.source === "redirect") {
      router.replace(plan.url);
      return;
    }

    if (plan.source === "demo") {
      setResult(initialResult ?? null);
      setIsBootstrapping(false);
      return;
    }

    if (plan.source === "api") {
      const { result: apiResult, status } = await fetchRealEventDashboard(plan.eventId);

      if (status === 401 || (!apiResult.ok && apiResult.error === "unauthorized")) {
        router.replace(`${CLIENT_SIGN_IN_PATH}?from=${encodeURIComponent("/app/dashboard")}`);
        return;
      }

      if (!apiResult.ok) {
        setResult(apiResult);
        setIsBootstrapping(false);
        return;
      }

      cacheActiveEventName(apiResult.data.eventOverview.name);
      setResult(apiResult);
      setIsBootstrapping(false);
      return;
    }

    const dashboard = buildDashboardFromOnboardingStore(localStorage);
    if (!dashboard) {
      router.replace("/onboarding");
      return;
    }

    setResult({ ok: true, data: dashboard });
    setIsBootstrapping(false);
    window.dispatchEvent(new Event("haxr:onboarding-updated"));
  }, [demoMode, initialResult, profileActiveEventId, router, searchKey]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      if (demoMode) {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/dashboard`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as DashboardDataResult;
        setResult(payload);
        return;
      }

      await loadDashboard();
    } catch {
      setResult({
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar o painel.",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [demoMode, eventId, loadDashboard]);

  if (isBootstrapping || isRetrying || !result) {
    return <DashboardSkeleton />;
  }

  if (!result.ok) {
    if (result.error === "not_found") {
      return <DashboardEmptyState />;
    }

    const message =
      result.error === "forbidden"
        ? (result.message ?? "Não tem permissão para aceder a este evento.")
        : (result.message ?? "Não foi possível carregar o painel.");

    return (
      <DashboardErrorState
        message={message}
        onRetry={result.error === "forbidden" ? undefined : handleRetry}
      />
    );
  }

  return <DashboardOverview data={result.data} />;
}
