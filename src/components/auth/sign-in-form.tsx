"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  signInWithMagicLink,
  validateSignInCredentials,
} from "@/lib/auth/sign-in-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import AuthRoleToggle from "@/components/auth/auth-role-toggle";
import GoogleAuthButton from "@/components/auth/google-auth-button";
import { buildAuthCallbackUrl, resolveDefaultAuthCallbackNext } from "@/lib/auth/auth-redirect";

type FieldErrors = {
  email?: string;
  password?: string;
};

type AuthMode = "password" | "magic-link";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const isStyleQuizGate = fromParam === STYLE_QUIZ_PATH;
  const isDashboardGate =
    fromParam === POST_LOGIN_DASHBOARD || fromParam === "/dashboard";
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
  }, [fromParam]);

  // Auto-focus on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

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

    if (authMode === "magic-link") {
      const validationErrors = validateSignInCredentials(email);
      if (hasSignInFieldErrors(validationErrors)) {
        setFieldErrors(validationErrors);
        return;
      }

      setFieldErrors({});
      setLoading(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const next = fromParam ?? resolveDefaultAuthCallbackNext();
        const redirectTo = buildAuthCallbackUrl({
          origin: window.location.origin,
          next,
        });

        const result = await signInWithMagicLink(supabase, email, redirectTo);

        if (!result.ok) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          setFormError(result.formError);
          return;
        }

        setMagicLinkSent(true);
      } catch {
        setFormError("Não foi possível enviar o link de acesso. Tente novamente.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Password mode
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
    "w-full rounded-xl border bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold disabled:cursor-not-allowed disabled:opacity-60";

  const signUpHref = buildSignUpPath(fromParam);
  const authBusy = loading || oauthLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9"
    >
      <header className="mb-7 space-y-4 text-center">
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">
          Bem-vindo de volta
        </h1>

        {/* ── Segmented Pill Toggle (Casal vs Fornecedor) ── */}
        <div className="flex justify-center">
          <AuthRoleToggle currentRole="couple" vendorHref="/for-pros" />
        </div>

        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">
          {isStyleQuizGate
            ? "Entre para aceder ao Style Quiz e descobrir o vosso estilo."
            : isDashboardGate
              ? "Entre para aceder ao vosso painel de casamento."
              : "Entre para aceder ao vosso Painel de Casamento."}
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
      <div className="mb-2">
        <GoogleAuthButton
          fromParam={fromParam}
          disabled={authBusy}
          onError={(message) => setFormError(message)}
          onLoadingChange={setOauthLoading}
        />
      </div>

      {/* ── Divider ── */}
      <div className="relative my-6 flex items-center">
        <div className="grow border-t border-brand-champagne/35" />
        <span className="mx-4 shrink-0 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
          ou entrar com email
        </span>
        <div className="grow border-t border-brand-champagne/35" />
      </div>

      {/* ── Method Selector: Password vs Magic Link ── */}
      <div className="mb-5 flex rounded-xl border border-brand-champagne/35 bg-brand-ivory/40 p-1">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setMagicLinkSent(false);
            setFormError(null);
          }}
          className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-sans text-xs font-medium transition-all cursor-pointer ${
            authMode === "password"
              ? "bg-white text-brand-text-dark font-semibold shadow-xs"
              : "text-brand-text-dark/60 hover:text-brand-text-dark"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5 text-brand-gold" />
          <span>Palavra-passe</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode("magic-link");
            setFormError(null);
          }}
          className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-sans text-xs font-medium transition-all cursor-pointer ${
            authMode === "magic-link"
              ? "bg-white text-brand-text-dark font-semibold shadow-xs"
              : "text-brand-text-dark/60 hover:text-brand-text-dark"
          }`}
        >
          <Mail className="h-3.5 w-3.5 text-brand-gold" />
          <span>Link de Acesso</span>
        </button>
      </div>

      {magicLinkSent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-brand-champagne/45 bg-white/90 p-6 text-center space-y-3"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 mb-1">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <h2 className="font-serif text-xl font-light text-brand-text-dark">
            Verifique o seu email
          </h2>
          <p className="font-sans text-xs font-light text-brand-text-dark/70 leading-relaxed">
            Enviámos um link de acesso direto para{" "}
            <strong className="font-medium text-brand-text-dark">{email.trim()}</strong>. Clique no link para entrar instantaneamente sem palavra-passe.
          </p>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="font-mono text-[9px] uppercase tracking-wider text-brand-gold hover:underline pt-2 cursor-pointer"
          >
            Reenviar link ou tentar outro email
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="sign-in-email"
              className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
            >
              Email
            </label>
            <input
              ref={emailInputRef}
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
              disabled={authBusy}
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

          <AnimatePresence initial={false}>
            {authMode === "password" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 overflow-hidden"
              >
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
                  <div className="relative">
                    <input
                      id="sign-in-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
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
                  {fieldErrors.password ? (
                    <p id="sign-in-password-error" className="pl-1 text-xs font-light text-red-600" role="alert">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>

                {/* ── Lembrar-me neste dispositivo ── */}
                <div className="flex items-center gap-2 pl-1">
                  <input
                    id="sign-in-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold/30 cursor-pointer"
                  />
                  <label
                    htmlFor="sign-in-remember"
                    className="font-sans text-xs font-light text-brand-text-dark/70 cursor-pointer"
                  >
                    Lembrar-me neste dispositivo
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={authBusy}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>{authMode === "magic-link" ? "A enviar link..." : "A entrar..."}</span>
              </>
            ) : authMode === "magic-link" ? (
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Enviar link de acesso
              </span>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>
      )}

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
    </motion.div>
  );
}
