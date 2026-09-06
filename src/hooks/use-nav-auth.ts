"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildAppUserDisplay, type AppUserDisplay } from "@/lib/auth/app-user-display";
import { signOutFromSupabase } from "@/lib/auth/sign-in-auth";

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
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const session = data?.session as {
        user?: { email?: string; id?: string; user_metadata?: Record<string, unknown> };
      } | null;

      if (!session?.user) {
        setIsAuthenticated(false);
        setUserDisplay(null);
        setIsLoading(false);
        return;
      }

      const display = buildAppUserDisplay({
        user: session.user,
        profile: null,
      });

      setIsAuthenticated(true);
      setUserDisplay(display);
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
      const supabase = createSupabaseBrowserClient();
      await signOutFromSupabase(supabase);
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
