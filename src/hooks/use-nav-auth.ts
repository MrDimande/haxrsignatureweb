"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";
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
    if (!isSupabaseAnonConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setUserDisplay(null);
        setIsLoading(false);
        return;
      }

      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, app_role, active_client_event_id")
        .eq("id", user.id)
        .maybeSingle();

      const display = buildAppUserDisplay({
        user,
        profile: profile ?? null,
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

    if (!isSupabaseAnonConfigured()) return;

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
          void checkUser();
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setUserDisplay(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Supabase not available
    }
  }, [checkUser]);

  const signOut = useCallback(async () => {
    if (!isSupabaseAnonConfigured()) return;
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
