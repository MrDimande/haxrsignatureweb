export type SignInWithGoogleResult = { ok: false; formError: string };

/** OAuth is intentionally unavailable in the HAXR-owned password/activation model. */
export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
  return { ok: false, formError: "O acesso HAXR é efectuado com email e palavra-passe." };
}
