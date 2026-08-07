import { validateClientAppAuthEnvironment } from "@/lib/supabase/config";

export type SignUpFieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
};

export type EmailPasswordSignUpClient = {
  auth: {
    signUp: (credentials: {
      email: string;
      password: string;
      options?: {
        data?: {
          full_name?: string;
        };
      };
    }) => Promise<{
      data: { session: unknown | null };
      error: { message: string } | null;
    }>;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateSignUpCredentials(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};
  const trimmedEmail = input.email.trim();
  const trimmedName = input.fullName.trim();

  if (!trimmedName) {
    errors.fullName = "O nome é obrigatório.";
  } else if (trimmedName.length < 2) {
    errors.fullName = "Introduza o seu nome completo.";
  }

  if (!trimmedEmail) {
    errors.email = "O email é obrigatório.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Introduza um endereço de email válido.";
  }

  if (!input.password) {
    errors.password = "A palavra-passe é obrigatória.";
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirme a palavra-passe.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "As palavras-passe não coincidem.";
  }

  if (!input.termsAccepted) {
    errors.termsAccepted = "Aceite os termos para continuar.";
  }

  return errors;
}

export function hasSignUpFieldErrors(errors: SignUpFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapSupabaseSignUpError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  ) {
    return "Este email já está registado. Inicie sessão.";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "A palavra-passe é demasiado fraca. Use letras e números.";
  }

  if (normalized.includes("invalid email")) {
    return "Introduza um endereço de email válido.";
  }

  if (normalized.includes("signup is disabled")) {
    return "O registo está temporariamente indisponível. Contacte a equipa HAXR.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("failed to fetch")
  ) {
    return "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.";
  }

  return "Não foi possível criar a conta. Tente novamente.";
}

export type SignUpWithEmailPasswordResult =
  | { ok: true; sessionCreated: boolean }
  | { ok: false; fieldErrors?: SignUpFieldErrors; formError: string };

export async function signUpWithEmailPassword(
  client: EmailPasswordSignUpClient,
  input: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  },
): Promise<SignUpWithEmailPasswordResult> {
  const fieldErrors = validateSignUpCredentials(input);
  if (hasSignUpFieldErrors(fieldErrors)) {
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
    const { data, error } = await client.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
        },
      },
    });

    if (error) {
      return { ok: false, formError: mapSupabaseSignUpError(error.message) };
    }

    return { ok: true, sessionCreated: Boolean(data.session) };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabaseSignUpError(message) };
  }
}
