import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";
import type { Database } from "@/lib/supabase/database.types";
import { validateNeonClientEnvironment } from "@/lib/neon/config";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Browser client for the Neon Data API + Managed Better Auth.
 *
 * The SupabaseAuthAdapter deliberately preserves the existing auth API surface
 * during the migration (`signInWithPassword`, `signUp`, `getUser`, etc.).
 * Database calls continue to use the familiar PostgREST-style `.from()`/`.rpc()`
 * API while authorization is enforced by Neon JWT + PostgreSQL RLS.
 */
export function createNeonBrowserClient() {
  const env = validateNeonClientEnvironment();
  if (!env.ok) {
    throw new Error(env.message);
  }

  if (!browserClient) {
    browserClient = createClient<Database>(
      {
        auth: { url: env.authUrl },
        dataApi: { url: env.dataApiUrl },
      },
      {
        auth: {
          adapter: SupabaseAuthAdapter(),
        },
      },
    );
  }

  return browserClient;
}

/** Test helper — reset singleton between unit tests. */
export function resetNeonBrowserClientForTests(): void {
  browserClient = null;
}
