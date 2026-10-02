export type SignInFieldErrors = { email?: string; password?: string; form?: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignInCredentials(email: string, password?: string): SignInFieldErrors {
  const errors: SignInFieldErrors = {};
  if (!email.trim()) errors.email = "O email é obrigatório.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Introduza um endereço de email válido.";
  if (password !== undefined && !password) errors.password = "A palavra-passe é obrigatória.";
  return errors;
}

export function hasSignInFieldErrors(errors: SignInFieldErrors): boolean { return Object.keys(errors).length > 0; }
