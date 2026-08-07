"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import { POST_LOGIN_DASHBOARD } from "@/lib/auth/onboarding-status";
import {
  hasPasswordResetFieldErrors,
  updatePasswordAfterRecovery,
  validateResetPasswordFields,
} from "@/lib/auth/password-reset-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (active) {
          setHasRecoverySession(Boolean(session));
        }
      } catch {
        if (active) {
          setHasRecoverySession(false);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void verifySession();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateResetPasswordFields({ password, confirmPassword });
    if (hasPasswordResetFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = await updatePasswordAfterRecovery(
        supabase,
        password,
        confirmPassword,
      );

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(result.formError);
        return;
      }

      router.push(`${POST_LOGIN_DASHBOARD}?reset=success`);
      router.refresh();
    } catch {
      setFormError("Não foi possível actualizar a palavra-passe. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border bg-white px-4 py-3 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

  if (checkingSession) {
    return (
      <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-8 text-center shadow-[0_12px_40px_rgba(28,26,23,0.06)]">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-gold" aria-hidden />
        <p className="mt-3 font-sans text-sm font-light text-brand-text-dark/70">
          A validar o link de recuperação...
        </p>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="rounded-2xl border border-brand-champagne/40 bg-white/80 p-6 shadow-[0_12px_40px_rgba(28,26,23,0.06)] backdrop-blur-sm sm:p-8">
        <header className="mb-6 space-y-2 text-left">
          <h1 className="font-serif text-2xl font-light text-brand-text-dark">
            Link inválido ou expirado
          </h1>
          <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
            O link de recuperação já não é válido. Peça um novo email ou inicie sessão com
            Google se foi assim que criou a conta.
          </p>
        </header>

        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
        >
          Pedir novo link
        </Link>

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
          Nova palavra-passe
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          Escolha uma palavra-passe segura para voltar ao vosso painel de casamento.
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
            htmlFor="reset-password"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Nova palavra-passe
          </label>
          <input
            id="reset-password"
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
            placeholder="Mínimo 8 caracteres"
            disabled={loading}
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
            htmlFor="reset-password-confirm"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Confirmar palavra-passe
          </label>
          <input
            id="reset-password-confirm"
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
            placeholder="Repita a palavra-passe"
            disabled={loading}
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
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>A guardar...</span>
            </>
          ) : (
            <span>Actualizar palavra-passe</span>
          )}
        </button>
      </form>
    </div>
  );
}
