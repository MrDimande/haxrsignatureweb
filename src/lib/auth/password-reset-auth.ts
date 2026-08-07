import { validateClientAppAuthEnvironment } from "@/lib/supabase/config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type PasswordResetFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type PasswordResetEmailClient = {
  auth: {
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

export type PasswordUpdateClient = {
  auth: {
    updateUser: (attributes: {
      password: string;
    }) => Promise<{ error: { message: string } | null }>;
  };
};

export function validateForgotPasswordEmail(email: string): PasswordResetFieldErrors {
  const errors: PasswordResetFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "O email é obrigatório.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Introduza um endereço de email válido.";
  }

  return errors;
}

export function validateResetPasswordFields(input: {
  password: string;
  confirmPassword: string;
}): PasswordResetFieldErrors {
  const errors: PasswordResetFieldErrors = {};

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

  return errors;
}

export function hasPasswordResetFieldErrors(errors: PasswordResetFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapSupabasePasswordResetError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Demasiados pedidos. Aguarde alguns minutos e tente novamente.";
  }

  if (normalized.includes("same password")) {
    return "A nova palavra-passe deve ser diferente da anterior.";
  }

  if (normalized.includes("session") || normalized.includes("jwt")) {
    return "O link expirou ou é inválido. Peça um novo email de recuperação.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("failed to fetch")
  ) {
    return "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.";
  }

  return "Não foi possível concluir o pedido. Tente novamente.";
}

export type RequestPasswordResetResult =
  | { ok: true }
  | { ok: false; fieldErrors?: PasswordResetFieldErrors; formError: string };

export async function requestPasswordResetEmail(
  client: PasswordResetEmailClient,
  email: string,
  redirectTo: string,
): Promise<RequestPasswordResetResult> {
  const fieldErrors = validateForgotPasswordEmail(email);
  if (hasPasswordResetFieldErrors(fieldErrors)) {
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
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return { ok: false, formError: mapSupabasePasswordResetError(error.message) };
    }

    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabasePasswordResetError(message) };
  }
}

export type UpdatePasswordAfterRecoveryResult =
  | { ok: true }
  | { ok: false; fieldErrors?: PasswordResetFieldErrors; formError: string };

export async function updatePasswordAfterRecovery(
  client: PasswordUpdateClient,
  password: string,
  confirmPassword: string,
): Promise<UpdatePasswordAfterRecoveryResult> {
  const fieldErrors = validateResetPasswordFields({ password, confirmPassword });
  if (hasPasswordResetFieldErrors(fieldErrors)) {
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
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      return { ok: false, formError: mapSupabasePasswordResetError(error.message) };
    }

    return { ok: true };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    return { ok: false, formError: mapSupabasePasswordResetError(message) };
  }
}
