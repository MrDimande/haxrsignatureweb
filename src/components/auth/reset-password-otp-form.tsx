"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  resetNeonPasswordWithOtp,
  resendNeonPasswordResetOtp,
} from "@/lib/supabase/browser";
import {
  clearPendingNeonPasswordReset,
  readPendingNeonPasswordReset,
  stashPendingNeonPasswordReset,
} from "@/lib/neon/pending-auth";
import {
  hasPasswordResetFieldErrors,
  validateForgotPasswordEmail,
  validateResetPasswordFields,
} from "@/lib/auth/password-reset-auth";

function mapResetError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("expired")) return "O código expirou. Peça um novo código.";
  if (normalized.includes("invalid") || normalized.includes("otp")) {
    return "Código inválido. Confirme o código recebido e tente novamente.";
  }
  if (normalized.includes("too many")) {
    return "Foram feitas demasiadas tentativas. Peça um novo código.";
  }
  return "Não foi possível actualizar a palavra-passe. Tente novamente.";
}

export default function ResetPasswordOtpForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setEmail(readPendingNeonPasswordReset() ?? "");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const emailErrors = validateForgotPasswordEmail(email);
    if (hasPasswordResetFieldErrors(emailErrors)) {
      setError(emailErrors.email ?? "Introduza um email válido.");
      return;
    }

    if (!/^\d{4,10}$/.test(otp.trim())) {
      setError("Introduza o código numérico recebido por email.");
      return;
    }

    const passwordErrors = validateResetPasswordFields({ password, confirmPassword });
    if (hasPasswordResetFieldErrors(passwordErrors)) {
      setError(passwordErrors.password ?? passwordErrors.confirmPassword ?? "Verifique a nova palavra-passe.");
      return;
    }

    setLoading(true);
    const result = await resetNeonPasswordWithOtp({
      email: email.trim(),
      otp: otp.trim(),
      password,
    });
    if (result.error) {
      setError(mapResetError(result.error.message));
      setLoading(false);
      return;
    }

    clearPendingNeonPasswordReset();
    setSuccess(true);
    setLoading(false);
  };

  const handleResend = async () => {
    const emailErrors = validateForgotPasswordEmail(email);
    if (hasPasswordResetFieldErrors(emailErrors)) {
      setError(emailErrors.email ?? "Introduza um email válido.");
      return;
    }

    setError(null);
    setMessage(null);
    setResending(true);
    const result = await resendNeonPasswordResetOtp(email.trim());
    if (result.error) {
      setError(mapResetError(result.error.message));
    } else {
      stashPendingNeonPasswordReset(email.trim());
      setMessage("Enviámos um novo código de recuperação.");
    }
    setResending(false);
  };

  if (success) {
    return (
      <div className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
        <h1 className="font-serif text-3xl font-light text-brand-text-dark">Palavra-passe actualizada</h1>
        <p className="mt-3 font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          A nova palavra-passe já está activa. Pode iniciar sessão novamente com segurança.
        </p>
        <Link href="/sign-in" className="mt-7 flex w-full items-center justify-center rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Iniciar sessão
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25";

  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
      <header className="mb-8 space-y-3 text-left">
        <div className="flex items-center gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.3em] text-brand-gold">
          <span className="h-px w-8 bg-brand-gold" aria-hidden />
          Recuperação segura
        </div>
        <h1 className="font-serif text-3xl font-light text-brand-text-dark">Definir nova palavra-passe</h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          Use o código enviado ao vosso email e escolha uma nova palavra-passe para a conta HAXR.
        </p>
      </header>

      {error ? <p className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-700" role="alert">{error}</p> : null}
      {message ? <p className="mb-5 rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 text-xs text-brand-text-dark" role="status">{message}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" className={inputClass} disabled={loading || resending} />
        <input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Código recebido" className={`${inputClass} text-center font-mono tracking-[0.25em]`} disabled={loading || resending} />
        <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova palavra-passe" className={inputClass} disabled={loading || resending} />
        <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmar nova palavra-passe" className={inputClass} disabled={loading || resending} />

        <button type="submit" disabled={loading || resending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          <span>{loading ? "A actualizar..." : "Actualizar palavra-passe"}</span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-xs">
        <button type="button" onClick={handleResend} disabled={loading || resending} className="font-semibold text-brand-gold hover:underline disabled:opacity-60">
          {resending ? "A reenviar..." : "Reenviar código"}
        </button>
        <Link href="/sign-in" className="font-semibold text-brand-text-dark/60 hover:text-brand-gold">
          Voltar ao início de sessão
        </Link>
      </div>
    </div>
  );
}
