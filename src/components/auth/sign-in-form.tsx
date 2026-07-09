"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resolvePostLoginRedirect } from "@/lib/auth/onboarding-status";
import {
  hasSignInFieldErrors,
  signInWithEmailPassword,
  validateSignInCredentials,
} from "@/lib/auth/sign-in-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FieldErrors = {
  email?: string;
  password?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateSignInCredentials(email, password);
    if (hasSignInFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = await signInWithEmailPassword(supabase, email, password);

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(result.formError);
        return;
      }

      router.push(resolvePostLoginRedirect());
      router.refresh();
    } catch {
      setFormError("Não foi possível iniciar sessão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setFieldErrors({});
    setFormError("Continuar com Google estará disponível em breve.");
  };

  const inputClass =
    "w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
      <header className="mb-8 space-y-2 text-left">
        <h1 className="font-serif text-2xl font-light text-brand-text-dark md:text-3xl">
          Bem-vindo de volta
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          Entre para aceder ao vosso Painel de Casamento Exclusivo e Inteligente.
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
            htmlFor="sign-in-email"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Email
          </label>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "sign-in-email-error" : undefined}
            placeholder="nome@exemplo.com"
            disabled={loading}
            className={`${inputClass} ${
              fieldErrors.email
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.email ? (
            <p id="sign-in-email-error" className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 px-1">
            <label
              htmlFor="sign-in-password"
              className="font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
            >
              Palavra-passe
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold transition-colors hover:text-brand-gold-light hover:underline"
            >
              Esqueceu a palavra-passe?
            </Link>
          </div>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "sign-in-password-error" : undefined}
            placeholder="••••••••••••"
            disabled={loading}
            className={`${inputClass} ${
              fieldErrors.password
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.password ? (
            <p id="sign-in-password-error" className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.password}
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
              <span>A entrar...</span>
            </>
          ) : (
            <span>Entrar</span>
          )}
        </button>
      </form>

      <div className="relative my-7 flex items-center">
        <div className="grow border-t border-brand-champagne/35" />
        <span className="mx-4 shrink-0 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
          ou
        </span>
        <div className="grow border-t border-brand-champagne/35" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-brand-champagne/55 bg-white px-4 py-3 font-sans text-sm text-brand-text-dark/85 transition-colors hover:border-brand-gold hover:bg-brand-champagne/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span>Continuar com Google</span>
      </button>

      <div className="mt-8 space-y-4 text-center">
        <p className="font-sans text-xs font-light text-brand-text-dark/65">
          Ainda não tem conta?{" "}
          <Link
            href="/onboarding"
            className="font-semibold text-brand-gold transition-colors hover:text-brand-gold-light hover:underline"
          >
            Começar agora
          </Link>
        </p>
        <p className="font-sans text-xs font-light text-brand-text-dark/55">
          É fornecedor?{" "}
          <Link
            href="/for-pros"
            className="font-semibold text-brand-text-dark/75 transition-colors hover:text-brand-gold hover:underline"
          >
            Junte-se à comunidade HAXR
          </Link>
        </p>
      </div>
    </div>
  );
}
