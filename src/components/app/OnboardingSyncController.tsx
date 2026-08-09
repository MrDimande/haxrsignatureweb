"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  performOnboardingSync,
  type OnboardingSyncUiState,
} from "@/lib/auth/onboarding-sync";

export default function OnboardingSyncController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const runIdRef = useRef(0);
  const [uiState, setUiState] = useState<OnboardingSyncUiState>({ kind: "idle" });

  const runSync = useCallback(async () => {
    const runId = ++runIdRef.current;
    setUiState({ kind: "idle" });

    const result = await performOnboardingSync({
      searchParams: new URLSearchParams(searchKey),
      redirect: (url) => router.replace(url),
      onStatus: (status) => {
        if (runId === runIdRef.current) {
          setUiState(status);
        }
      },
    });

    if (runId !== runIdRef.current) {
      return;
    }

    if (result.action === "error" && result.retryable) {
      setUiState({
        kind: "error",
        message: result.message,
        retryable: true,
        status: result.status,
      });
    }
  }, [router, searchKey]);

  useEffect(() => {
    void runSync();
  }, [runSync]);

  const handleRetry = () => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem("haxr_onboarding_sync_status");
    void runSync();
  };

  if (uiState.kind === "syncing") {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 top-[84px] z-50 flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 rounded-full border border-brand-champagne/20 bg-[#120e0d]/95 px-4 py-2 text-xs text-zinc-200 shadow-lg backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-gold" />
          <span>A preparar o seu dashboard...</span>
        </div>
      </div>
    );
  }

  if (uiState.kind === "error" && uiState.retryable) {
    return (
      <div className="fixed inset-x-0 top-[84px] z-50 flex justify-center px-4" role="alert">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#120e0d]/95 p-4 text-xs text-zinc-200 shadow-lg backdrop-blur">
          <p className="text-red-300">{uiState.message}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-lg bg-brand-gold px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-gold-light"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return null;
}
