"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  buildSignInPath,
  resolvePostLoginRedirectWithReturnPath,
  stashPostAuthReturn,
  STYLE_QUIZ_PATH,
} from "@/lib/auth/client-app-middleware";
import { isOnboardingComplete } from "@/lib/auth/onboarding-status";
import {
  hasSignUpFieldErrors,
  signUpWithEmailPassword,
  validateSignUpCredentials,
} from "@/lib/auth/sign-up-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import GoogleAuthButton from "@/components/auth/google-auth-button";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
};

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const isStyleQuizGate = fromParam === STYLE_QUIZ_PATH;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
  }, [fromParam]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateSignUpCredentials({
      fullName,
      email,
      password,
      confirmPassword,
      termsAccepted,
    });
    if (hasSignUpFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = await signUpWithEmailPassword(supabase, {
        fullName,
        email,
        password,
        confirmPassword,
        termsAccepted,
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(result.formError);
        return;
      }

      if (!result.sessionCreated) {
        setFormError(
          "Conta criada. Confirme o email enviado e depois inicie sessão.",
        );
        return;
      }

      router.push(
        resolvePostLoginRedirectWithReturnPath(fromParam, isOnboardingComplete()),
      );
      router.refresh();
    } catch {
      setFormError("Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

  const signInHref = buildSignInPath(fromParam);
  const authBusy = loading || oauthLoading;

  const clearConsentError = () => {
    if (fieldErrors.termsAccepted) {
      setFieldErrors((prev) => ({ ...prev, termsAccepted: undefined }));
    }
    if (formError) setFormError(null);
  };

  const requireConsent = () => {
    setFieldErrors((prev) => ({
      ...prev,
      termsAccepted: "Aceite os termos para continuar com Google.",
    }));
    termsCheckboxRef.current?.focus();
  };

  return (
    <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
      <header className="mb-8 space-y-2 text-left">
        <h1 className="font-serif text-2xl font-light text-brand-text-dark md:text-3xl">
          O vosso casamento começa aqui
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          {isStyleQuizGate
            ? "Crie a vossa conta gratuita para aceder ao Style Quiz, guardar inspiração e organizar tudo num só painel."
            : "Crie a vossa conta gratuita para desbloquear o painel de casamento, ferramentas e recomendações personalizadas."}
        </p>
      </header>

      {formError ? (
        <p
          className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs font-light text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="mb-5 space-y-3">
        <GoogleAuthButton
          fromParam={fromParam}
          disabled={authBusy}
          label="Criar conta com Google"
          consentAccepted={termsAccepted}
          onConsentRequired={requireConsent}
          onError={(message) => setFormError(message || null)}
          onLoadingChange={setOauthLoading}
        />
        <p className="text-center font-sans text-[11px] font-light text-brand-text-dark/55">
          Registo rápido e seguro, sem criar uma nova palavra-passe.
        </p>
      </div>

      <label
        className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
          fieldErrors.termsAccepted
            ? "border-red-300 bg-red-50/70"
            : "border-brand-champagne/35 bg-brand-ivory/40"
        }`}
      >
        <input
          ref={termsCheckboxRef}
          id="sign-up-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => {
            setTermsAccepted(event.target.checked);
            clearConsentError();
          }}
          disabled={authBusy}
          aria-invalid={fieldErrors.termsAccepted ? true : undefined}
          aria-describedby={fieldErrors.termsAccepted ? "sign-up-terms-error" : undefined}
          className="mt-0.5 h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold/30"
        />
        <span className="font-sans text-xs font-light leading-relaxed text-brand-text-dark/75">
          Aceito os termos de utilização e a política de privacidade da HAXR Signature para
          criar a minha conta.
        </span>
      </label>
      {fieldErrors.termsAccepted ? (
        <p
          id="sign-up-terms-error"
          className="mb-5 pl-1 text-xs font-light text-red-600"
          role="alert"
        >
          {fieldErrors.termsAccepted}
        </p>
      ) : null}

      <div className="relative mb-6 flex items-center">
        <div className="grow border-t border-brand-champagne/35" />
        <span className="mx-4 shrink-0 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
          ou criar conta com email
        </span>
        <div className="grow border-t border-brand-champagne/35" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-name"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Nome completo
          </label>
          <input
            id="sign-up-name"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) {
                setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
              }
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldErrors.fullName ? true : undefined}
            placeholder="Ex: Jessica Silva"
            disabled={authBusy}
            className={`${inputClass} ${
              fieldErrors.fullName
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.fullName ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.fullName}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-email"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Email
          </label>
          <input
            id="sign-up-email"
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
            placeholder="nome@exemplo.com"
            disabled={authBusy}
            className={`${inputClass} ${
              fieldErrors.email
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.email ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-password"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Palavra-passe
          </label>
          <input
            id="sign-up-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldErrors.password ? true : undefined}
            placeholder="Mínimo 8 caracteres"
            disabled={authBusy}
            className={`${inputClass} ${
              fieldErrors.password
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.password ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-confirm-password"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Confirmar palavra-passe
          </label>
          <input
            id="sign-up-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
              if (formError) setFormError(null);
            }}
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
            placeholder="Repita a palavra-passe"
            disabled={authBusy}
            className={`${inputClass} ${
              fieldErrors.confirmPassword
                ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
            }`}
          />
          {fieldErrors.confirmPassword ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={authBusy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>A criar conta...</span>
            </>
          ) : (
            <span>Começar agora</span>
          )}
        </button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        <p className="font-sans text-xs font-light text-brand-text-dark/65">
          Já tem conta?{" "}
          <Link
            href={signInHref}
            className="font-semibold text-brand-gold transition-colors hover:text-brand-gold-light hover:underline"
          >
            Iniciar sessão
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
