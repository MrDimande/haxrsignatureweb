"use client";

import { useEffect, useState } from "react";
import {
  getOnboardingEventNameFromBrowser,
  getOnboardingEventSlugFromBrowser,
} from "@/lib/auth/onboarding-storage";
import { isOnboardingComplete } from "@/lib/auth/onboarding-status";
import {
  isRealClientEventId,
  resolvePreferredRealClientEventId,
} from "@/lib/auth/resolve-active-event-id";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";
import { DEFAULT_DASHBOARD_EVENT_ID } from "@/lib/dashboard/mock-dashboard-data";

const DEMO_EVENT_NAME = "Jessica & Samuel";
const ACTIVE_EVENT_NAME_KEY = "haxr_active_event_name";

type AppEventState = {
  eventName: string;
  eventId: string;
  isDemoFallback: boolean;
  isResolved: boolean;
};

function createInitialAppEventState(initialEventId?: string | null): AppEventState {
  const normalizedEventId = initialEventId?.trim() ?? "";
  const eventId = isRealClientEventId(normalizedEventId)
    ? normalizedEventId
    : DEFAULT_EVENT_ID;
  return {
    eventName: "O seu evento",
    eventId,
    isDemoFallback: false,
    isResolved: eventId !== DEFAULT_EVENT_ID,
  };
}

function readCachedActiveEventName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_EVENT_NAME_KEY)?.trim() || null;
}

function resolveAppEvent(initialEventId?: string | null): AppEventState {
  if (typeof window === "undefined") {
    return createInitialAppEventState(initialEventId);
  }

  const params = new URLSearchParams(window.location.search);
  const realEventId = resolvePreferredRealClientEventId({
    searchParams: params,
    store: localStorage,
    profileActiveEventId: initialEventId,
  });

  if (realEventId && isRealClientEventId(realEventId)) {
    const cachedName = readCachedActiveEventName();
    const onboardingName = isOnboardingComplete() ? getOnboardingEventNameFromBrowser() : null;
    return {
      eventName: cachedName || onboardingName || "O seu evento",
      eventId: realEventId,
      isDemoFallback: false,
      isResolved: true,
    };
  }

  if (isOnboardingComplete()) {
    const name = getOnboardingEventNameFromBrowser();
    const slug = getOnboardingEventSlugFromBrowser();
    if (name && slug) {
      return { eventName: name, eventId: slug, isDemoFallback: false, isResolved: true };
    }
  }

  if (params.get("demo") === DEFAULT_DASHBOARD_EVENT_ID) {
    return {
      eventName: DEMO_EVENT_NAME,
      eventId: DEFAULT_DASHBOARD_EVENT_ID,
      isDemoFallback: true,
      isResolved: true,
    };
  }

  return {
    eventName: "O seu evento",
    eventId: DEFAULT_EVENT_ID,
    isDemoFallback: false,
    isResolved: false,
  };
}

/** Resolves active event label + id for the app shell from real event, onboarding or demo mode. */
export function useAppEvent(initialEventId?: string | null): AppEventState {
  // Keep the server and the first browser render identical. Browser-backed
  // event data is applied after hydration to avoid a React text mismatch.
  const [state, setState] = useState<AppEventState>(() =>
    createInitialAppEventState(initialEventId),
  );

  useEffect(() => {
    setState(resolveAppEvent(initialEventId));

    const refresh = () => setState(resolveAppEvent(initialEventId));
    window.addEventListener("storage", refresh);
    window.addEventListener("haxr:onboarding-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("haxr:onboarding-updated", refresh);
    };
  }, [initialEventId]);

  return state;
}
