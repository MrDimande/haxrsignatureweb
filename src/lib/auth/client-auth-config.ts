import { shouldUseNeonAuthInBrowser } from "@/lib/neon/browser-config";
import { validateClientAppAuthEnvironment as validateSupabaseAuthEnvironment } from "@/lib/supabase/config";

export type ClientAppAuthEnvironmentCheck =
  | { ok: true }
  | { ok: false; message: string };

export function validateClientAppAuthEnvironment(): ClientAppAuthEnvironmentCheck {
  if (shouldUseNeonAuthInBrowser()) {
    return { ok: true };
  }

  return validateSupabaseAuthEnvironment();
}
