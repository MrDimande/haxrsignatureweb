import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";

export type SupabaseAuthSessionResult = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refreshes the Supabase Auth session cookie on each request.
 * Wired into middleware in Fase B.2 (/app/* protection).
 */
export async function updateSupabaseAuthSession(
  request: NextRequest,
): Promise<SupabaseAuthSessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseAnonConfigured()) {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
