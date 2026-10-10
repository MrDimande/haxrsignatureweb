"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import {
  buildSignInPath,
  stashPostAuthReturn,
} from "@/lib/auth/client-app-middleware";
import {
  hasSignUpFieldErrors,
  validateSignUpInput,
  type SignUpFieldErrors,
} from "@/lib/auth/sign-up-auth";
import AuthRoleToggle from "@/components/auth/auth-role-toggle";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
    if (!submitted) {
      nameInputRef.current?.focus();
    }
  }, [fromParam, submitted]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateSignUpInput({
      fullName,
      email,
      termsAccepted,
    });

    if (hasSignUpFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/portal-auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ fullName, email, termsAccepted }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: SignUpFieldErrors;
      };

      if (!response.ok) {
        if (body.fieldErrors) {
          setFieldErrors(body.fieldErrors);
        }
        setFormError(
          body.error ?? "Não foi possível criar a conta. Tente novamente.",
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold disabled:cursor-not-allowed disabled:opacity-60";

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="haxr-auth-card rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9"
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-gold/30 bg-brand-champagne/15 text-brand-gold shadow-[0_0_20px_rgba(184,138,42,0.12)]">
          <Mail className="h-6 w-6 stroke-[1.5]" aria-hidden />
        </div>

        <header className="space-y-3">
          <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">
            Verifique o seu email
          </h1>
          <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/75">
            Se este endereço puder ser utilizado para criar uma conta HAXR, enviámos um link seguro para continuar.
          </p>
        </header>

        <div className="mt-8 rounded-2xl border border-brand-champagne/35 bg-brand-ivory/45 p-5 text-left space-y-2">
          <p className="font-sans text-xs font-medium text-brand-text-dark">
            Próximos passos
          </p>
          <p className="font-sans text-xs font-light leading-relaxed text-brand-text-dark/70">
            Abra a mensagem recebida na sua caixa de entrada e prima o link de activação para definir a sua palavra-passe e aceder ao vosso espaço privado. O link é de utilização única e expira em breve por motivos de segurança.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href={buildSignInPath(fromParam)}
            className="flex w-full items-center justify-center rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f]"
          >
            Ir para início de sessão
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setFullName("");
              setTermsAccepted(false);
            }}
            className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold hover:underline"
          >
            Utilizar outro endereço de email
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9"
    >
      <header className="mb-7 space-y-4 text-center">
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">
          Criar a sua conta HAXR
        </h1>
        <div className="flex justify-center">
          <AuthRoleToggle currentRole="couple" vendorHref="/for-pros" />
        </div>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">
          Comece a organizar o vosso evento num espaço privado, pensado para reunir convidados, RSVP, orçamento, fornecedores e decisões importantes.
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

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="sign-up-fullname"
            className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60"
          >
            Nome completo
          </label>
          <input
            ref={nameInputRef}
            id="sign-up-fullname"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={fieldErrors.fullName ? true : undefined}
            placeholder="Ex: Jessica Samuel"
            disabled={loading}
            className={`${inputClass} ${
              fieldErrors.fullName
                ? "border-red-400/60"
                : "border-brand-champagne/45"
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
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={fieldErrors.email ? true : undefined}
            placeholder="nome@exemplo.com"
            disabled={loading}
            className={`${inputClass} ${
              fieldErrors.email
                ? "border-red-400/60"
                : "border-brand-champagne/45"
            }`}
          />
          {fieldErrors.email ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 pl-1 font-sans text-xs font-light text-brand-text-dark/75">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              disabled={loading}
              className="mt-0.5 h-3.5 w-3.5 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold/30"
            />
            <span>
              Li e aceito os Termos e a Política de Privacidade
            </span>
          </label>
          {fieldErrors.termsAccepted ? (
            <p className="pl-1 text-xs font-light text-red-600" role="alert">
              {fieldErrors.termsAccepted}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f] disabled:cursor-not-allowed disabled:opacity-70"
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
            href={buildSignInPath(fromParam)}
            className="font-semibold text-brand-gold-accessible hover:underline"
          >
            Iniciar sessão
          </Link>
        </p>
        <p className="font-sans text-xs font-light text-brand-text-dark/55">
          É fornecedor?{" "}
          <Link
            href="/for-pros"
            className="font-semibold text-brand-text-dark/75 hover:text-brand-gold-accessible hover:underline"
          >
            Junte-se à comunidade HAXR
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
