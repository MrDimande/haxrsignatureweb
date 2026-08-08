import { validateClientAppAuthEnvironment } from "@/lib/supabase/config";

export type GoogleOAuthClient = {
  auth: {
    signInWithOAuth: (options: {
      provider: "google";
      options?: {
        redirectTo?: string;
        queryParams?: Record<string, string>;
      };
    }) => Promise<{ data: { url: string | null }; error: { message: string } | null }>;
  };
};

export function mapSupabaseOAuthError(message: string): string {
  const normalized = message.toLowerCase();

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
  | { ok: true }
  | { ok: false; formError: string };

export async function signInWithGoogle(
  client: GoogleOAuthClient,
  redirectTo: string,
): Promise<SignInWithGoogleResult> {
  const envCheck = validateClientAppAuthEnvironment();
  if (!envCheck.ok) {
    return { ok: false, formError: envCheck.message };
  }

  if (!redirectTo.startsWith("http")) {
    return { ok: false, formError: "URL de retorno inválida." };
  }

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { ok: false, formError: mapSupabaseOAuthError(error.message) };
    }

    if (!data.url) {
      return { ok: false, formError: "Não foi possível iniciar o fluxo Google." };
    }

    window.location.assign(data.url);
    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabaseOAuthError(message) };
  }
}
