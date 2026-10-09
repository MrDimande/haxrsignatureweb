export type SignUpFieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUpInput(input: {
  fullName?: string;
  email: string;
  termsAccepted: boolean;
}): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};
  if (input.fullName === undefined || input.fullName.trim().length < 2) {
    errors.fullName = "Introduza o seu nome completo.";
  }
  const trimmedEmail = input.email.trim();
  if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 254) {
    errors.email = "Introduza um endereço de email válido.";
  }
  if (!input.termsAccepted) {
    errors.termsAccepted = "Aceite os termos para continuar.";
  }
  return errors;
}

export function validateSignUpCredentials(input: {
  fullName?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted: boolean;
}): SignUpFieldErrors {
  const errors = validateSignUpInput({
    fullName: input.fullName,
    email: input.email,
    termsAccepted: input.termsAccepted,
  });
  if (input.fullName === undefined) {
    delete errors.fullName;
  }
  if (input.password !== undefined) {
    if (input.password.length < 12) errors.password = "Use pelo menos 12 caracteres.";
    if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
      errors.confirmPassword = "As palavras-passe não coincidem.";
    }
  }
  return errors;
}

export function hasSignUpFieldErrors(errors: SignUpFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
