"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  buildSignUpPath,
  resolvePostLoginRedirectWithReturnPath,
  stashPostAuthReturn,
  STYLE_QUIZ_PATH,
} from "@/lib/auth/client-app-middleware";
import { isOnboardingComplete, POST_LOGIN_DASHBOARD } from "@/lib/auth/onboarding-status";
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

import GoogleAuthButton from "@/components/auth/google-auth-button";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const isStyleQuizGate = fromParam === STYLE_QUIZ_PATH;
  const isDashboardGate =
    fromParam === POST_LOGIN_DASHBOARD || fromParam === "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
  }, [fromParam]);

  useEffect(() => {
    const authError = searchParams?.get("error");
    if (authError === "auth_callback") {
      setFormError(
        "Não foi possível concluir o início de sessão. Tente novamente ou use email.",
      );
    }
  }, [searchParams]);

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

      router.push(
        resolvePostLoginRedirectWithReturnPath(fromParam, isOnboardingComplete()),
      );
      router.refresh();
    } catch {
      setFormError("Não foi possível iniciar sessão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

  const signUpHref = buildSignUpPath(fromParam);

  const signUpHref = buildSignUpPath(fromParam);

  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
      <header className="mb-8 space-y-3 text-left">
        <div className="flex items-center gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.3em] text-brand-gold">
          <span className="h-px w-8 bg-brand-gold" aria-hidden />
          Private client access
        </div>
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">
          Bem-vindo de volta
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          {isStyleQuizGate
            ? "Entre na sua conta gratuita para aceder ao Style Quiz e descobrir o estilo editorial do vosso casamento."
            : isDashboardGate
              ? "Entre para aceder ao vosso painel de casamento gratuito."
              : "Entre para aceder ao vosso Painel de Casamento Exclusivo e Inteligente."}
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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

      <GoogleAuthButton
        fromParam={fromParam}
        disabled={loading}
        onError={(message) => setFormError(message)}
      />

      <div className="mt-8 space-y-4 text-center">
        <p className="font-sans text-xs font-light text-brand-text-dark/65">
          Ainda não tem conta?{" "}
          <Link
            href={signUpHref}
            className="font-semibold text-brand-gold transition-colors hover:text-brand-gold-light hover:underline"
          >
            {isStyleQuizGate || isDashboardGate ? "Criar conta gratuita" : "Começar agora"}
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
