import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";
import { shouldUseNeonAuthForAppSession } from "@/lib/neon/config";
import { getSetCookieHeaders, proxyNeonAuthRequest } from "@/lib/neon/auth-proxy";

export type SupabaseAuthSessionResult = {
  response: NextResponse;
  user: User | null;
};

type RawNeonSessionPayload = {
  user?: {
    id?: unknown;
    email?: unknown;
    emailVerified?: unknown;
  } | null;
};

async function updateNeonAuthSession(
  request: NextRequest,
): Promise<SupabaseAuthSessionResult> {
  const sessionResponse = NextResponse.next({ request });

  try {
    const upstreamRequest = new Request(request.url, {
      method: "GET",
      headers: request.headers,
    });
    const upstream = await proxyNeonAuthRequest(upstreamRequest, "get-session");

    for (const cookie of getSetCookieHeaders(upstream.headers)) {
      sessionResponse.headers.append("Set-Cookie", cookie);
    }

    if (upstream.status === 401 || upstream.status === 403) {
      return { response: sessionResponse, user: null };
    }

    if (!upstream.ok) {
      console.warn("[neon-auth] middleware get-session failed", upstream.status);
      return { response: sessionResponse, user: null };
    }

    const payload = (await upstream.json().catch(() => null)) as RawNeonSessionPayload | null;
    if (
      !payload?.user ||
      typeof payload.user.id !== "string" ||
      payload.user.emailVerified !== true
    ) {
      return { response: sessionResponse, user: null };
    }

    const user = {
      id: payload.user.id,
      email: typeof payload.user.email === "string" ? payload.user.email : undefined,
    } as unknown as User;

    return { response: sessionResponse, user };
  } catch (cause) {
    console.warn(
      "[neon-auth] middleware session check failed",
      cause instanceof Error ? cause.message : cause,
    );
    return { response: sessionResponse, user: null };
  }
}

/**
 * Refreshes the active client-app Auth session cookie on each request.
 * During migration the historical function name is retained; the explicit
 * server-side HAXR_AUTH_PROVIDER switch decides whether Supabase or Neon runs.
 */
export async function updateSupabaseAuthSession(
  request: NextRequest,
): Promise<SupabaseAuthSessionResult> {
  if (shouldUseNeonAuthForAppSession()) {
    return updateNeonAuthSession(request);
  }

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
