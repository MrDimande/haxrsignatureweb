import { createNeonAuth } from "@neondatabase/auth/next/server";
import { isNeonAuthServerConfigured } from "@/lib/neon/config";

let authServer: ReturnType<typeof createNeonAuth> | null = null;

/**
 * Lazily creates the Managed Better Auth server instance.
 *
 * Lazy initialization is intentional while Supabase remains the active fallback:
 * importing this module must not break builds/environments that have not received
 * the Neon Preview secrets yet.
 */
export function getNeonAuthServer() {
  if (!isNeonAuthServerConfigured()) {
    throw new Error(
      "Neon Auth server não configurado. Defina NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET.",
    );
  }

  if (!authServer) {
    authServer = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
      logLevel: process.env.NODE_ENV === "development" ? "warn" : "error",
    });
  }

  return authServer;
}

export function resetNeonAuthServerForTests(): void {
  authServer = null;
}
