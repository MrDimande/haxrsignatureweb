export type PasswordResetFieldErrors = { email?: string; password?: string; confirmPassword?: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateForgotPasswordEmail(email: string): PasswordResetFieldErrors {
  return EMAIL_PATTERN.test(email.trim()) ? {} : { email: "Introduza um endereço de email válido." };
}

export function validateResetPasswordFields(input: { password: string; confirmPassword: string }): PasswordResetFieldErrors {
  const errors: PasswordResetFieldErrors = {};
  if (input.password.length < 12) errors.password = "Use pelo menos 12 caracteres.";
  if (input.password !== input.confirmPassword) errors.confirmPassword = "As palavras-passe não coincidem.";
  return errors;
}

export function hasPasswordResetFieldErrors(errors: PasswordResetFieldErrors): boolean { return Object.keys(errors).length > 0; }
