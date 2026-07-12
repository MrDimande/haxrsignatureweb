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
};

function readCachedActiveEventName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_EVENT_NAME_KEY)?.trim() || null;
}

function resolveAppEvent(): AppEventState {
  if (typeof window === "undefined") {
    return {
      eventName: "O seu evento",
      eventId: DEFAULT_EVENT_ID,
      isDemoFallback: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const realEventId = resolvePreferredRealClientEventId({
    searchParams: params,
    store: localStorage,
  });

  if (realEventId && isRealClientEventId(realEventId)) {
    const cachedName = readCachedActiveEventName();
    const onboardingName = isOnboardingComplete() ? getOnboardingEventNameFromBrowser() : null;
    return {
      eventName: cachedName || onboardingName || "O seu evento",
      eventId: realEventId,
      isDemoFallback: false,
    };
  }

  if (isOnboardingComplete()) {
    const name = getOnboardingEventNameFromBrowser();
    const slug = getOnboardingEventSlugFromBrowser();
    if (name && slug) {
      return { eventName: name, eventId: slug, isDemoFallback: false };
    }
  }

  if (params.get("demo") === DEFAULT_DASHBOARD_EVENT_ID) {
    return {
      eventName: DEMO_EVENT_NAME,
      eventId: DEFAULT_DASHBOARD_EVENT_ID,
      isDemoFallback: true,
    };
  }

  return {
    eventName: "O seu evento",
    eventId: DEFAULT_EVENT_ID,
    isDemoFallback: false,
  };
}

/** Resolves active event label + id for the app shell from real event, onboarding or demo mode. */
export function useAppEvent(): AppEventState {
  const [state, setState] = useState<AppEventState>(() => resolveAppEvent());

  useEffect(() => {
    setState(resolveAppEvent());

    const refresh = () => setState(resolveAppEvent());
    window.addEventListener("storage", refresh);
    window.addEventListener("haxr:onboarding-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("haxr:onboarding-updated", refresh);
    };
  }, []);

  return state;
}
