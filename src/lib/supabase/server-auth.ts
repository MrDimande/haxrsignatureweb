import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";

export async function createSupabaseServerAuthClient() {
  if (!isSupabaseAnonConfigured()) {
    throw new Error(
      "Supabase server auth client: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without mutable cookies — middleware will refresh.
          }
        },
      },
    },
  );
}

export function createSupabaseUserAuthClient(accessToken: string) {
  if (!isSupabaseAnonConfigured()) {
    throw new Error(
      "Supabase user auth client: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function extractBearerToken(request: Request): string | null {
  const match = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function resolveAuthenticatedSupabaseClient(request: Request) {
  const cookieClient = await createSupabaseServerAuthClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();

  if (cookieUser) {
    return { user: cookieUser, supabase: cookieClient };
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return { user: null, supabase: cookieClient };
  }

  const {
    data: { user: bearerUser },
    error,
  } = await cookieClient.auth.getUser(accessToken);

  if (error || !bearerUser) {
    return { user: null, supabase: cookieClient };
  }

  return {
    user: bearerUser,
    supabase: createSupabaseUserAuthClient(accessToken),
  };
}
