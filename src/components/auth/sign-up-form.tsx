"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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
import AuthLegalDialog from "@/components/auth/auth-legal-dialog";
import AuthRoleToggle from "@/components/auth/auth-role-toggle";
import GoogleAuthButton from "@/components/auth/google-auth-button";
import PasswordStrengthMeter from "@/components/auth/password-strength-meter";
import type { AuthLegalDocumentId } from "@/lib/auth/legal-documents";

type FieldErrors = {
  email?: string;
  password?: string;
  termsAccepted?: string;
};

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const isStyleQuizGate = fromParam === STYLE_QUIZ_PATH;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [legalDocument, setLegalDocument] = useState<AuthLegalDocumentId | null>(null);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
  }, [fromParam]);

  // Auto-focus first input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateSignUpCredentials({
      email,
      password,
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
        email,
        password,
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
    "w-full rounded-xl border bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold disabled:cursor-not-allowed disabled:opacity-60";

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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9"
    >
      <header className="mb-7 space-y-4 text-center">
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">
          Crie a sua conta
        </h1>

        {/* ── Segmented Pill Toggle (Padrão Loverly) ── */}
        <div className="flex justify-center">
          <AuthRoleToggle currentRole="couple" vendorHref="/for-pros" />
        </div>

        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">
          {isStyleQuizGate
            ? "Pode adicionar os detalhes do vosso casamento depois."
            : "Pode adicionar os detalhes do vosso casamento depois."}
        </p>
      </header>

      {formError ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs font-light text-red-700"
          role="alert"
        >
          {formError}
        </motion.p>
      ) : null}

      {/* ── Google OAuth (CTA primário — padrão Loverly) ── */}
      <div className="mb-2 space-y-3">
        <GoogleAuthButton
          fromParam={fromParam}
          disabled={authBusy}
          label="Continuar com Google"
          consentAccepted={termsAccepted}
          onConsentRequired={requireConsent}
          onError={(message) => setFormError(message || null)}
          onLoadingChange={setOauthLoading}
        />
      </div>

      {/* ── Divider ── */}
      <div className="relative my-6 flex items-center">
        <div className="grow border-t border-brand-champagne/35" />
        <span className="mx-4 shrink-0 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
          ou
        </span>
        <div className="grow border-t border-brand-champagne/35" />
      </div>

      {/* ── Formulário email + password ── */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-email"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Email
          </label>
          <input
            ref={emailInputRef}
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
          <div className="relative">
            <input
              id="sign-up-password"
              name="password"
              type={showPassword ? "text" : "password"}
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
              className={`${inputClass} pr-11 ${
                fieldErrors.password
                  ? "border-red-400/60 focus:border-red-500 focus:ring-red-500/20"
                  : "border-brand-champagne/45 focus:border-brand-gold focus:ring-brand-gold/25"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-text-dark/40 hover:text-brand-text-dark/70 transition-colors cursor-pointer"
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* ── Password Strength Meter (Live feedback) ── */}
          <PasswordStrengthMeter password={password} />

          {fieldErrors.password ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {/* ── Terms consent ── */}
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
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
            aria-labelledby="sign-up-terms-label"
            aria-describedby={fieldErrors.termsAccepted ? "sign-up-terms-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold/30 cursor-pointer"
          />
          <p
            id="sign-up-terms-label"
            className="font-sans text-xs font-light leading-relaxed text-brand-text-dark/75"
          >
            <label htmlFor="sign-up-terms" className="cursor-pointer">
              Aceito os{" "}
            </label>
            <button
              type="button"
              onClick={() => setLegalDocument("terms")}
              className="rounded-sm font-medium text-brand-gold underline decoration-brand-gold/45 underline-offset-2 transition-colors hover:text-brand-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 cursor-pointer"
            >
              termos de utilização
            </button>{" "}
            e a{" "}
            <button
              type="button"
              onClick={() => setLegalDocument("privacy")}
              className="rounded-sm font-medium text-brand-gold underline decoration-brand-gold/45 underline-offset-2 transition-colors hover:text-brand-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 cursor-pointer"
            >
              política de privacidade
            </button>{" "}
            <label htmlFor="sign-up-terms" className="cursor-pointer">
              da HAXR Signature.
            </label>
          </p>
        </div>
        {fieldErrors.termsAccepted ? (
          <p
            id="sign-up-terms-error"
            className="pl-1 text-xs font-light text-red-600"
            role="alert"
          >
            {fieldErrors.termsAccepted}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={authBusy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>A criar conta...</span>
            </>
          ) : (
            <span>Criar conta</span>
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

      <AuthLegalDialog
        documentId={legalDocument}
        onSelect={setLegalDocument}
        onClose={() => setLegalDocument(null)}
      />
    </motion.div>
  );
}
