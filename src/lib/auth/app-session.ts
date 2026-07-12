import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import {
  buildAppUserDisplay,
  type AppUserDisplay,
  type ClientAppProfile,
} from "@/lib/auth/app-user-display";

type ProfileQueryClient = {
  from(table: "profiles"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{
          data: ClientAppProfile | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export type CurrentAppSession = {
  user: {
    id: string;
    email: string | null;
  } | null;
  profile: ClientAppProfile | null;
  display: AppUserDisplay;
};

export async function getCurrentAppSession(): Promise<CurrentAppSession> {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      display: buildAppUserDisplay({ user: null, profile: null }),
    };
  }

  const profileClient = supabase as unknown as ProfileQueryClient;
  const { data: profile, error } = await profileClient
    .from("profiles")
    .select("id, full_name, app_role, active_client_event_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[client-app] profile lookup failed", error.message);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: profile ?? null,
    display: buildAppUserDisplay({ user, profile: profile ?? null }),
  };
}
