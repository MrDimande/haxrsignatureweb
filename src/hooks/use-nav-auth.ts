"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AppUserDisplay } from "@/lib/auth/app-user-display";

export type NavAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userDisplay: AppUserDisplay | null;
  signOut: () => Promise<void>;
};

export function useNavAuth(): NavAuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDisplay, setUserDisplay] = useState<AppUserDisplay | null>(null);
  const router = useRouter();

  const checkUser = useCallback(async () => {
    try {
      const response = await fetch("/api/portal-auth/session", { credentials: "same-origin" });
      const payload = (await response.json().catch(() => ({}))) as {
        authenticated?: boolean;
        user?: AppUserDisplay;
      };

      if (!response.ok || !payload.authenticated || !payload.user) {
        setIsAuthenticated(false);
        setUserDisplay(null);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUserDisplay(payload.user);
    } catch {
      setIsAuthenticated(false);
      setUserDisplay(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkUser();
  }, [checkUser]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/portal-auth/logout", { method: "POST", credentials: "same-origin" });
      setIsAuthenticated(false);
      setUserDisplay(null);
      router.push("/sign-in");
      router.refresh();
    } catch {
      router.push("/sign-in");
    }
  }, [router]);

  return {
    isAuthenticated,
    isLoading,
    userDisplay,
    signOut,
  };
}
