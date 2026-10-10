"use client";

import AuthRoleToggle from "@/components/auth/auth-role-toggle";
import {
  buildSignUpPath,
  resolvePostLoginRedirectWithReturnPath,
  stashPostAuthReturn,
} from "@/lib/auth/client-app-middleware";
import { isOnboardingComplete } from "@/lib/auth/onboarding-status";
import { hasSignInFieldErrors, validateSignInCredentials } from "@/lib/auth/sign-in-auth";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stashPostAuthReturn(fromParam);
    emailInputRef.current?.focus();
  }, [fromParam]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateSignInCredentials(email, password);
    if (hasSignInFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/portal-auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        activeClientEventId?: string | null;
      };
      if (!response.ok) {
        setFormError(body.error ?? "Não foi possível iniciar sessão. Tente novamente.");
        return;
      }
      const hasActiveEvent = Boolean(body.activeClientEventId);
      const target =
        !hasActiveEvent && !isOnboardingComplete()
          ? "/onboarding/profile/1"
          : resolvePostLoginRedirectWithReturnPath(fromParam, isOnboardingComplete());
      router.replace(target);
      router.refresh();
    } catch {
      setFormError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold disabled:cursor-not-allowed disabled:opacity-60";
  const isActivated = searchParams?.get("activated") === "1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9"
    >
      <header className="mb-7 space-y-4 text-center">
        <h1 className="font-serif text-3xl font-light leading-tight tracking-[-0.02em] text-brand-text-dark md:text-4xl">Bem-vindo de volta</h1>
        <div className="flex justify-center"><AuthRoleToggle currentRole="couple" vendorHref="/for-pros" /></div>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">Entre para aceder ao vosso Painel de Casamento.</p>
      </header>

      {isActivated && !formError ? (
        <p className="mb-5 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-xs font-light text-emerald-800 text-center" role="status">
          Conta activada com sucesso. Inicie sessão para continuar.
        </p>
      ) : null}

      {formError ? <p className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs font-light text-red-700" role="alert">{formError}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="sign-in-email" className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/80">Email</label>
          <input ref={emailInputRef} id="sign-in-email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={fieldErrors.email ? true : undefined} placeholder="nome@exemplo.com" disabled={loading} className={`${inputClass} ${fieldErrors.email ? "border-red-400/60" : "border-brand-champagne/45"}`} />
          {fieldErrors.email ? <p className="pl-1 text-xs font-light text-red-600" role="alert">{fieldErrors.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 px-1">
            <label htmlFor="sign-in-password" className="font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/80">Palavra-passe</label>
            <Link href="/forgot-password" className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold-accessible hover:underline">Esqueceu a palavra-passe?</Link>
          </div>
          <div className="relative">
            <input id="sign-in-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={fieldErrors.password ? true : undefined} placeholder="••••••••••••" disabled={loading} className={`${inputClass} pr-11 ${fieldErrors.password ? "border-red-400/60" : "border-brand-champagne/45"}`} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-text-dark/40 hover:text-brand-text-dark/70" aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
          {fieldErrors.password ? <p className="pl-1 text-xs font-light text-red-600" role="alert">{fieldErrors.password}</p> : null}
        </div>
        <label className="flex items-center gap-2 pl-1 font-sans text-xs font-light text-brand-text-dark/70"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-3.5 w-3.5 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold/30" />Lembrar-me neste dispositivo</label>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_35px_rgba(8,7,6,0.18)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/55 hover:bg-[#17130f] disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /><span>A entrar...</span></> : <span>Entrar</span>}
        </button>
      </form>
      <div className="mt-8 space-y-4 text-center"><p className="font-sans text-xs font-light text-brand-text-dark/65">Ainda não tem conta? <Link href={buildSignUpPath(fromParam)} className="font-semibold text-brand-gold-accessible hover:underline">Criar conta</Link></p><p className="font-sans text-xs font-light text-brand-text-dark/55">É fornecedor? <Link href="/for-pros" className="font-semibold text-brand-text-dark/75 hover:text-brand-gold-accessible hover:underline">Junte-se à comunidade HAXR</Link></p></div>
    </motion.div>
  );
}
