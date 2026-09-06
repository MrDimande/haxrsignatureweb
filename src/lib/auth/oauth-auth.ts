import { validateClientAppAuthEnvironment } from "@/lib/auth/client-auth-config";

export type GoogleOAuthClient = {
  auth: {
    signInWithOAuth: (options: {
      provider: "google";
      options?: {
        redirectTo?: string;
        queryParams?: Record<string, string>;
        skipBrowserRedirect?: boolean;
      };
    }) => Promise<{ data: { url: string | null }; error: { message: string } | null }>;
  };
};

export function mapSupabaseOAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("oauth_request_timeout")) {
    return "O Google demorou demasiado a responder. Tente novamente ou use email.";
  }

  if (normalized.includes("provider is not enabled")) {
    return "O início de sessão com Google ainda não está activo. Use email e palavra-passe.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("failed to fetch")
  ) {
    return "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.";
  }

  return "Não foi possível continuar com Google. Tente novamente ou use email.";
}

export type SignInWithGoogleResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; formError: string };

export const GOOGLE_OAUTH_REQUEST_TIMEOUT_MS = 12_000;

export async function signInWithGoogle(
  client: GoogleOAuthClient,
  redirectTo: string,
  options: { timeoutMs?: number } = {},
): Promise<SignInWithGoogleResult> {
  const envCheck = validateClientAppAuthEnvironment();
  if (!envCheck.ok) {
    return { ok: false, formError: envCheck.message };
  }

  if (!redirectTo.startsWith("http")) {
    return { ok: false, formError: "URL de retorno inválida." };
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const { data, error } = await Promise.race([
      client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("oauth_request_timeout")),
          options.timeoutMs ?? GOOGLE_OAUTH_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);

    if (error) {
      return { ok: false, formError: mapSupabaseOAuthError(error.message) };
    }

    if (!data.url) {
      return { ok: false, formError: "Não foi possível iniciar o fluxo Google." };
    }

    return { ok: true, redirectUrl: data.url };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabaseOAuthError(message) };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
