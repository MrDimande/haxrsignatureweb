import { validateClientAppAuthEnvironment } from "@/lib/supabase/config";

export type SignInFieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type EmailPasswordSignInClient = {
  auth: {
    signInWithPassword: (credentials: SignInCredentials) => Promise<{
      error: { message: string } | null;
    }>;
    signInWithOtp?: (options: {
      email: string;
      options?: {
        emailRedirectTo?: string;
      };
    }) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignInCredentials(
  email: string,
  password?: string,
): SignInFieldErrors {
  const errors: SignInFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "O email é obrigatório.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Introduza um endereço de email válido.";
  }

  if (password !== undefined) {
    if (!password) {
      errors.password = "A palavra-passe é obrigatória.";
    }
  }

  return errors;
}

export function hasSignInFieldErrors(errors: SignInFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapSupabaseSignInError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Email ou palavra-passe incorrectos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme o seu email antes de entrar.";
  }

  if (normalized.includes("for security purposes") || normalized.includes("rate limit")) {
    return "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("failed to fetch")
  ) {
    return "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.";
  }

  return "Não foi possível iniciar sessão. Tente novamente.";
}

export type SignInWithEmailPasswordResult =
  | { ok: true }
  | { ok: false; fieldErrors?: SignInFieldErrors; formError: string };

export async function signInWithEmailPassword(
  client: EmailPasswordSignInClient,
  email: string,
  password: string,
): Promise<SignInWithEmailPasswordResult> {
  const fieldErrors = validateSignInCredentials(email, password);
  if (hasSignInFieldErrors(fieldErrors)) {
    return {
      ok: false,
      fieldErrors,
      formError: "Corrija os campos assinalados.",
    };
  }

  const envCheck = validateClientAppAuthEnvironment();
  if (!envCheck.ok) {
    return { ok: false, formError: envCheck.message };
  }

  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, formError: mapSupabaseSignInError(error.message) };
    }

    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabaseSignInError(message) };
  }
}

export type SignInWithMagicLinkResult =
  | { ok: true }
  | { ok: false; fieldErrors?: SignInFieldErrors; formError: string };

export async function signInWithMagicLink(
  client: EmailPasswordSignInClient,
  email: string,
  redirectTo: string,
): Promise<SignInWithMagicLinkResult> {
  const fieldErrors = validateSignInCredentials(email);
  if (hasSignInFieldErrors(fieldErrors)) {
    return {
      ok: false,
      fieldErrors,
      formError: "Introduza um email válido.",
    };
  }

  const envCheck = validateClientAppAuthEnvironment();
  if (!envCheck.ok) {
    return { ok: false, formError: envCheck.message };
  }

  if (!client.auth.signInWithOtp) {
    return {
      ok: false,
      formError: "O método de link de acesso por email não está disponível.",
    };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { ok: false, formError: mapSupabaseSignInError(error.message) };
    }

    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabaseSignInError(message) };
  }
}

export async function signOutFromSupabase(
  client: { auth: { signOut: () => Promise<{ error: { message: string } | null }> } },
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { ok: false, message: mapSupabaseSignInError(error.message) };
    }
    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, message: mapSupabaseSignInError(message) };
  }
}
