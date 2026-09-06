import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseAnonConfigured } from "@/lib/supabase/config";
import { shouldUseNeonAuthInBrowser } from "@/lib/neon/browser-config";

export type ClientAppAuthError = { message: string };

type ClientAppAuthClient = {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): Promise<{
      error: ClientAppAuthError | null;
    }>;
    signUp(credentials: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown> };
    }): Promise<{
      data: { session: unknown | null; verificationRequired?: boolean };
      error: ClientAppAuthError | null;
    }>;
    signInWithOAuth(options: {
      provider: string;
      options?: {
        redirectTo?: string;
        queryParams?: Record<string, string>;
        skipBrowserRedirect?: boolean;
      };
    }): Promise<{
      data: { url: string | null };
      error: ClientAppAuthError | null;
    }>;
    getSession(): Promise<{
      data: { session: unknown | null };
      error: ClientAppAuthError | null;
    }>;
    signOut(): Promise<{ error: ClientAppAuthError | null }>;
    resetPasswordForEmail(
      email: string,
      options: { redirectTo: string },
    ): Promise<{ error: ClientAppAuthError | null; delivery?: "link" | "otp" }>;
    updateUser(attributes: { password: string }): Promise<{
      error: ClientAppAuthError | null;
    }>;
  };
};

type JsonRecord = Record<string, unknown>;

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let neonCompatClient: ClientAppAuthClient | null = null;

function getSupabaseBrowserClient(): ClientAppAuthClient {
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

  return browserClient as unknown as ClientAppAuthClient;
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const record = payload as JsonRecord;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (record.error && typeof record.error === "object") {
      const nested = record.error as JsonRecord;
      if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    }
  }
  return `Pedido de autenticação falhou com HTTP ${status}.`;
}

async function neonRequest(
  path: string,
  init: { method?: "GET" | "POST"; body?: JsonRecord } = {},
): Promise<{ response: Response; payload: unknown }> {
  const method = init.method ?? "POST";
  const response = await fetch(`/api/neon-auth/${path}`, {
    method,
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  }

  return { response, payload };
}

function buildNeonOAuthCallback(redirectTo?: string): string {
  const origin = window.location.origin;
  const supplied = new URL(redirectTo ?? "/auth/callback", origin);
  const next = supplied.searchParams.get("next") ?? "/app/dashboard";
  const callback = new URL("/auth/neon/callback", origin);
  callback.searchParams.set("next", next.startsWith("/") && !next.startsWith("//") ? next : "/app/dashboard");
  return callback.toString();
}

function createNeonCompatClient(): ClientAppAuthClient {
  return {
    auth: {
      async signInWithPassword(credentials) {
        const { response, payload } = await neonRequest("sign-in/email", {
          body: { email: credentials.email, password: credentials.password },
        });
        return {
          error: response.ok ? null : { message: errorMessage(payload, response.status) },
        };
      },

      async signUp(credentials) {
        const fullName =
          typeof credentials.options?.data?.full_name === "string"
            ? credentials.options.data.full_name.trim()
            : "";

        const signUp = await neonRequest("sign-up/email", {
          body: {
            email: credentials.email,
            password: credentials.password,
            name: fullName || credentials.email,
          },
        });

        if (!signUp.response.ok) {
          return {
            data: { session: null },
            error: { message: errorMessage(signUp.payload, signUp.response.status) },
          };
        }

        const verification = await neonRequest("email-otp/send-verification-otp", {
          body: { email: credentials.email, type: "email-verification" },
        });
        if (!verification.response.ok) {
          return {
            data: { session: null },
            error: { message: errorMessage(verification.payload, verification.response.status) },
          };
        }

        return {
          data: { session: null, verificationRequired: true },
          error: null,
        };
      },

      async signInWithOAuth({ provider, options }) {
        const callbackURL = buildNeonOAuthCallback(options?.redirectTo);
        const { response, payload } = await neonRequest("sign-in/social", {
          body: {
            provider,
            callbackURL,
            disableRedirect: true,
          },
        });

        if (!response.ok) {
          return {
            data: { url: null },
            error: { message: errorMessage(payload, response.status) },
          };
        }

        const record = payload && typeof payload === "object" ? (payload as JsonRecord) : null;
        const url = record && typeof record.url === "string" ? record.url : null;
        return {
          data: { url },
          error: url ? null : { message: "Neon Auth não devolveu a URL do Google." },
        };
      },

      async getSession() {
        const { response, payload } = await neonRequest("get-session", { method: "GET" });
        if (response.status === 401 || response.status === 403) {
          return { data: { session: null }, error: null };
        }
        if (!response.ok) {
          return {
            data: { session: null },
            error: { message: errorMessage(payload, response.status) },
          };
        }

        if (!payload || typeof payload !== "object") {
          return { data: { session: null }, error: null };
        }

        const record = payload as JsonRecord;
        const session = record.session && record.user
          ? { ...(record.session as JsonRecord), user: record.user }
          : null;
        return { data: { session }, error: null };
      },

      async signOut() {
        const { response, payload } = await neonRequest("sign-out", { body: {} });
        return {
          error: response.ok ? null : { message: errorMessage(payload, response.status) },
        };
      },

      async resetPasswordForEmail(email) {
        const { response, payload } = await neonRequest("email-otp/send-verification-otp", {
          body: { email, type: "forget-password" },
        });
        return {
          error: response.ok ? null : { message: errorMessage(payload, response.status) },
          delivery: response.ok ? "otp" : undefined,
        };
      },

      async updateUser() {
        return {
          error: {
            message:
              "No Neon Auth, a recuperação usa código OTP. Peça um novo código de recuperação.",
          },
        };
      },
    },
  };
}

/**
 * Migration compatibility facade.
 *
 * The historical export name is kept so existing HAXR UI components do not
 * need a risky mass rewrite. Production remains Supabase unless the explicit
 * NEXT_PUBLIC_HAXR_AUTH_PROVIDER=neon switch is present in that build.
 */
export function createSupabaseBrowserClient(): ClientAppAuthClient {
  if (!shouldUseNeonAuthInBrowser()) {
    return getSupabaseBrowserClient();
  }

  if (!neonCompatClient) neonCompatClient = createNeonCompatClient();
  return neonCompatClient;
}

export async function verifyNeonEmailOtp(
  email: string,
  otp: string,
): Promise<{ error: ClientAppAuthError | null }> {
  const { response, payload } = await neonRequest("email-otp/verify-email", {
    body: { email, otp },
  });
  return {
    error: response.ok ? null : { message: errorMessage(payload, response.status) },
  };
}

export async function resendNeonEmailVerificationOtp(
  email: string,
): Promise<{ error: ClientAppAuthError | null }> {
  const { response, payload } = await neonRequest("email-otp/send-verification-otp", {
    body: { email, type: "email-verification" },
  });
  return {
    error: response.ok ? null : { message: errorMessage(payload, response.status) },
  };
}

export async function resetNeonPasswordWithOtp(input: {
  email: string;
  otp: string;
  password: string;
}): Promise<{ error: ClientAppAuthError | null }> {
  const { response, payload } = await neonRequest("email-otp/passcode", {
    body: input,
  });
  return {
    error: response.ok ? null : { message: errorMessage(payload, response.status) },
  };
}

export async function resendNeonPasswordResetOtp(
  email: string,
): Promise<{ error: ClientAppAuthError | null }> {
  const { response, payload } = await neonRequest("email-otp/send-verification-otp", {
    body: { email, type: "forget-password" },
  });
  return {
    error: response.ok ? null : { message: errorMessage(payload, response.status) },
  };
}

/** Test helper — reset singleton between unit tests. */
export function resetSupabaseBrowserClientForTests(): void {
  browserClient = null;
  neonCompatClient = null;
}
