import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (!isSupabaseAnonConfigured()) {
    throw new Error(
      "Supabase browser client: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return browserClient;
}

/** Test helper — reset singleton between unit tests. */
export function resetSupabaseBrowserClientForTests(): void {
  browserClient = null;
}
