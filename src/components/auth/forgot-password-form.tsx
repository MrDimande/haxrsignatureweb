"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { buildPasswordResetRedirectUrl } from "@/lib/auth/auth-redirect";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import {
  hasPasswordResetFieldErrors,
  requestPasswordResetEmail,
  validateForgotPasswordEmail,
} from "@/lib/auth/password-reset-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateForgotPasswordEmail(email);
    if (hasPasswordResetFieldErrors(validationErrors)) {
      setFieldError(validationErrors.email);
      return;
    }

    setFieldError(undefined);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = buildPasswordResetRedirectUrl(window.location.origin);
      const result = await requestPasswordResetEmail(supabase, email, redirectTo);

      if (!result.ok) {
        if (result.fieldErrors?.email) {
          setFieldError(result.fieldErrors.email);
        }
        setFormError(result.formError);
        return;
      }

      setSent(true);
    } catch {
      setFormError("Não foi possível enviar o email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

  if (sent) {
    return (
      <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
        <header className="mb-6 space-y-2 text-left">
          <h1 className="font-serif text-2xl font-light text-brand-text-dark">
            Verifique o email
          </h1>
          <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
            Se existir uma conta HAXR associada a{" "}
            <span className="font-medium text-brand-text-dark">{email.trim()}</span>, enviámos
            um link para redefinir a palavra-passe. O link expira em breve por segurança.
          </p>
        </header>

        <p className="rounded-xl border border-brand-champagne/35 bg-brand-ivory/50 px-4 py-3 text-xs font-light text-brand-text-dark/70">
          Não recebeu? Verifique spam ou promoções. Se usou Google para entrar, continue com
          Google no início de sessão.
        </p>

        <p className="mt-6 text-center font-sans text-xs font-light text-brand-text-dark/60">
          <Link href={buildSignInPath(null)} className="font-semibold text-brand-gold hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
      <header className="mb-8 space-y-2 text-left">
        <h1 className="font-serif text-2xl font-light text-brand-text-dark md:text-3xl">
          Recuperar acesso
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          Introduza o email da vossa conta. Enviaremos um link seguro para definir uma nova
          palavra-passe.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError ? (
          <p
            className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs font-light text-red-700"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label
            htmlFor="forgot-password-email"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Email
          </label>
          <input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError(undefined);
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldError ? true : undefined}
            placeholder="nome@exemplo.com"
            disabled={loading}
            className={`${inputClass} ${
              fieldError
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldError ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>A enviar...</span>
            </>
          ) : (
            <span>Enviar link de recuperação</span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center font-sans text-xs font-light text-brand-text-dark/60">
        <Link href={buildSignInPath(null)} className="font-semibold text-brand-gold hover:underline">
          Voltar ao início de sessão
        </Link>
      </p>
    </div>
  );
}
